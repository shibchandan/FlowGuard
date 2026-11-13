// src/modules/executions/execution.service.ts
import { prisma } from '../../config/database';
import * as executionRepo from './execution.repository';
import * as requestRepo from '../requests/request.repository';
import * as auditService from '../audit/audit.service';
import * as retryService from '../retry/retry.service';
import { DependencySimulator } from '../simulator/simulator.service';
import { evaluateRules } from '../rules/rule.engine';
import { RuleConfig } from '../rules/rule.types';
import { AppError } from '../../shared/errors/AppError';
import {
  RequestStatus,
  ExecutionStatus,
  Decision,
  RetryStatus,
  ReviewStatus,
} from '../../shared/enums';
import { WorkflowConfig } from '../../shared/types';

export async function executeWorkflow(
  executionId: string,
  actorId?: string,
): Promise<void> {
  const execution = await executionRepo.findExecutionById(executionId);
  if (!execution) {
    throw new AppError(404, 'NOT_FOUND', 'Execution not found');
  }

  const { request, workflowVersion } = execution;
  const config = workflowVersion.config as unknown as WorkflowConfig;

  // Step 1: Input Validation
  await prisma.$transaction(async (tx) => {
    await requestRepo.transitionRequestStatus(
      request.id,
      RequestStatus.VALIDATED,
      'Request input validation started',
      undefined,
      tx,
    );

    await auditService.log(
      {
        entityType: 'REQUEST',
        entityId: request.id,
        action: 'REQUEST_VALIDATED',
        actorId,
      },
      tx,
    );
  });

  const inputData = request.inputData as Record<string, unknown>;
  const inputSchema = config?.inputSchema ?? {};

  // Verify mandatory schema fields exist
  const missingFields: string[] = [];
  for (const field of Object.keys(inputSchema)) {
    if (inputData[field] === undefined || inputData[field] === null || inputData[field] === '') {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    const errorMsg = `Mandatory field(s) missing: ${missingFields.join(', ')}`;
    await prisma.$transaction(async (tx) => {
      await requestRepo.transitionRequestStatus(
        request.id,
        RequestStatus.FAILED,
        errorMsg,
        { missingFields },
        tx,
      );

      await executionRepo.updateExecution(
        execution.id,
        {
          status: ExecutionStatus.FAILED,
          decision: Decision.REJECTED,
          errorMessage: errorMsg,
          completedAt: new Date(),
        },
        tx,
      );

      await auditService.log(
        {
          entityType: 'WORKFLOW_EXECUTION',
          entityId: execution.id,
          action: 'VALIDATION_FAILED',
          actorId,
          metadata: { missingFields },
        },
        tx,
      );
    });
    return;
  }

  // Step 2: Transition to PROCESSING
  await prisma.$transaction(async (tx) => {
    await requestRepo.transitionRequestStatus(
      request.id,
      RequestStatus.PROCESSING,
      'Workflow rule evaluation initiated',
      undefined,
      tx,
    );

    await executionRepo.updateExecution(
      execution.id,
      { status: ExecutionStatus.RUNNING },
      tx,
    );

    await auditService.log(
      {
        entityType: 'WORKFLOW_EXECUTION',
        entityId: execution.id,
        action: 'WORKFLOW_PROCESSING_STARTED',
        actorId,
      },
      tx,
    );
  });

  // Step 3: Evaluate Rules
  const rules = (config?.rules ?? []) as RuleConfig[];
  const evalResult = evaluateRules(rules, inputData);

  // Step 4: Handle Rule Decisions
  if (evalResult.decision === 'REJECTED') {
    await prisma.$transaction(async (tx) => {
      await executionRepo.updateExecution(
        execution.id,
        {
          status: ExecutionStatus.REJECTED,
          decision: Decision.REJECTED,
          ruleTrace: evalResult.ruleTrace,
          completedAt: new Date(),
        },
        tx,
      );

      await requestRepo.transitionRequestStatus(
        request.id,
        RequestStatus.REJECTED,
        evalResult.summary,
        { ruleTrace: evalResult.ruleTrace },
        tx,
      );

      await requestRepo.transitionRequestStatus(
        request.id,
        RequestStatus.COMPLETED,
        'Workflow execution ended with rejection',
        undefined,
        tx,
      );

      await auditService.log(
        {
          entityType: 'WORKFLOW_EXECUTION',
          entityId: execution.id,
          action: 'DECISION_REJECTED',
          actorId,
          metadata: { summary: evalResult.summary, ruleTrace: evalResult.ruleTrace },
        },
        tx,
      );
    });
    return;
  }

  if (evalResult.decision === 'MANUAL_REVIEW') {
    await prisma.$transaction(async (tx) => {
      await executionRepo.updateExecution(
        execution.id,
        {
          status: ExecutionStatus.MANUAL_REVIEW,
          decision: Decision.MANUAL_REVIEW,
          ruleTrace: evalResult.ruleTrace,
        },
        tx,
      );

      await requestRepo.transitionRequestStatus(
        request.id,
        RequestStatus.MANUAL_REVIEW,
        evalResult.summary,
        { ruleTrace: evalResult.ruleTrace },
        tx,
      );

      // Create manual review entry
      await tx.manualReview.upsert({
        where: { requestId: request.id },
        update: { status: ReviewStatus.PENDING },
        create: {
          requestId: request.id,
          status: ReviewStatus.PENDING,
        },
      });

      await auditService.log(
        {
          entityType: 'MANUAL_REVIEW',
          entityId: request.id,
          action: 'MANUAL_REVIEW_REQUIRED',
          actorId,
          metadata: { summary: evalResult.summary, ruleTrace: evalResult.ruleTrace },
        },
        tx,
      );
    });
    return;
  }

  // Step 5: Rules Passed -> Call External Dependency Simulator (OUTSIDE transaction)
  const depResult = await DependencySimulator.verify(inputData);

  if (!depResult.success) {
    if (depResult.retryable) {
      await prisma.$transaction(async (tx) => {
        await executionRepo.updateExecution(
          execution.id,
          {
            status: ExecutionStatus.RETRY,
            decision: Decision.PENDING,
            ruleTrace: evalResult.ruleTrace,
            errorMessage: depResult.message,
          },
          tx,
        );

        await requestRepo.transitionRequestStatus(
          request.id,
          RequestStatus.RETRYING,
          `External verification failed: ${depResult.message}`,
          { error: depResult.message },
          tx,
        );

        await retryService.createRetryRecord(
          execution.id,
          1,
          depResult.message,
          tx,
        );

        await auditService.log(
          {
            entityType: 'WORKFLOW_EXECUTION',
            entityId: execution.id,
            action: 'DEPENDENCY_FAILED_RETRYABLE',
            actorId,
            metadata: { message: depResult.message },
          },
          tx,
        );
      });
      return;
    } else {
      // Non-retryable failure
      await prisma.$transaction(async (tx) => {
        await executionRepo.updateExecution(
          execution.id,
          {
            status: ExecutionStatus.FAILED,
            decision: Decision.REJECTED,
            ruleTrace: evalResult.ruleTrace,
            errorMessage: depResult.message,
            completedAt: new Date(),
          },
          tx,
        );

        await requestRepo.transitionRequestStatus(
          request.id,
          RequestStatus.FAILED,
          `External verification permanently failed: ${depResult.message}`,
          undefined,
          tx,
        );

        await auditService.log(
          {
            entityType: 'WORKFLOW_EXECUTION',
            entityId: execution.id,
            action: 'DEPENDENCY_FAILED_PERMANENT',
            actorId,
            metadata: { message: depResult.message },
          },
          tx,
        );
      });
      return;
    }
  }

  // Step 6: Success Path
  await prisma.$transaction(async (tx) => {
    await executionRepo.updateExecution(
      execution.id,
      {
        status: ExecutionStatus.APPROVED,
        decision: Decision.APPROVED,
        ruleTrace: evalResult.ruleTrace,
        completedAt: new Date(),
      },
      tx,
    );

    await requestRepo.transitionRequestStatus(
      request.id,
      RequestStatus.APPROVED,
      'All rules satisfied and external verification succeeded',
      { ruleTrace: evalResult.ruleTrace },
      tx,
    );

    await requestRepo.transitionRequestStatus(
      request.id,
      RequestStatus.COMPLETED,
      'Workflow completed successfully',
      undefined,
      tx,
    );

    await auditService.log(
      {
        entityType: 'WORKFLOW_EXECUTION',
        entityId: execution.id,
        action: 'WORKFLOW_APPROVED',
        actorId,
        metadata: { summary: evalResult.summary, ruleTrace: evalResult.ruleTrace },
      },
      tx,
    );
  });
}

export async function retryExecution(
  executionId: string,
  reason?: string,
  actorId?: string,
): Promise<{ executionId: string; status: ExecutionStatus; attemptNumber: number }> {
  const execution = await executionRepo.findExecutionById(executionId);
  if (!execution) {
    throw new AppError(404, 'NOT_FOUND', 'Execution not found');
  }

  const { request, workflowVersion } = execution;
  const config = workflowVersion.config as unknown as WorkflowConfig;
  const maxRetries = config?.execution?.maxRetries ?? 3;

  const eligibility = await retryService.isEligibleForRetry(
    executionId,
    maxRetries,
  );

  if (!eligibility.eligible) {
    throw new AppError(
      409,
      'RETRY_INELIGIBLE',
      eligibility.reason || 'Execution is not eligible for retry',
    );
  }

  const nextAttempt = eligibility.currentAttempts + 1;

  // Step 1: Record retry attempt and set execution to RUNNING
  const retryRecord = await prisma.$transaction(async (tx) => {
    const record = await retryService.createRetryRecord(
      executionId,
      nextAttempt,
      reason,
      tx,
    );

    await executionRepo.updateExecution(
      executionId,
      { status: ExecutionStatus.RUNNING },
      tx,
    );

    await requestRepo.transitionRequestStatus(
      request.id,
      RequestStatus.PROCESSING,
      `Retry attempt ${nextAttempt} in progress`,
      { attemptNumber: nextAttempt, reason },
      tx,
    );

    await auditService.log(
      {
        entityType: 'RETRY',
        entityId: executionId,
        action: 'RETRY_INITIATED',
        actorId,
        metadata: { attemptNumber: nextAttempt, reason },
      },
      tx,
    );

    return record;
  });

  // Step 2: Call External Dependency Simulator (OUTSIDE transaction)
  const depResult = await DependencySimulator.verify(request.inputData);

  // Step 3: Handle retry outcome
  if (depResult.success) {
    await prisma.$transaction(async (tx) => {
      await retryService.updateRetryRecord(
        retryRecord.id,
        RetryStatus.SUCCESS,
        undefined,
        tx,
      );

      await executionRepo.updateExecution(
        executionId,
        {
          status: ExecutionStatus.APPROVED,
          decision: Decision.APPROVED,
          errorMessage: null,
          completedAt: new Date(),
        },
        tx,
      );

      await requestRepo.transitionRequestStatus(
        request.id,
        RequestStatus.APPROVED,
        'Retry verification succeeded',
        undefined,
        tx,
      );

      await requestRepo.transitionRequestStatus(
        request.id,
        RequestStatus.COMPLETED,
        'Workflow completed after successful retry',
        undefined,
        tx,
      );

      await auditService.log(
        {
          entityType: 'WORKFLOW_EXECUTION',
          entityId: executionId,
          action: 'RETRY_SUCCEEDED',
          actorId,
          metadata: { attemptNumber: nextAttempt },
        },
        tx,
      );
    });

    return {
      executionId,
      status: ExecutionStatus.APPROVED,
      attemptNumber: nextAttempt,
    };
  } else {
    // Retry failed
    const isExhausted = nextAttempt >= maxRetries;
    const finalStatus = isExhausted ? ExecutionStatus.FAILED : ExecutionStatus.RETRY;

    await prisma.$transaction(async (tx) => {
      await retryService.updateRetryRecord(
        retryRecord.id,
        RetryStatus.FAILED,
        depResult.message,
        tx,
      );

      await executionRepo.updateExecution(
        executionId,
        {
          status: finalStatus,
          decision: isExhausted ? Decision.REJECTED : Decision.PENDING,
          errorMessage: depResult.message,
          completedAt: isExhausted ? new Date() : null,
        },
        tx,
      );

      await requestRepo.transitionRequestStatus(
        request.id,
        isExhausted ? RequestStatus.FAILED : RequestStatus.RETRYING,
        isExhausted
          ? `Retry failed and retry limit (${maxRetries}) exhausted: ${depResult.message}`
          : `Retry attempt ${nextAttempt} failed: ${depResult.message}`,
        { error: depResult.message, attemptNumber: nextAttempt },
        tx,
      );

      await auditService.log(
        {
          entityType: 'RETRY',
          entityId: executionId,
          action: isExhausted ? 'RETRY_EXHAUSTED' : 'RETRY_FAILED',
          actorId,
          metadata: { attemptNumber: nextAttempt, error: depResult.message },
        },
        tx,
      );
    });

    return {
      executionId,
      status: finalStatus,
      attemptNumber: nextAttempt,
    };
  }
}

export async function getExecution(id: string) {
  const execution = await executionRepo.findExecutionById(id);
  if (!execution) {
    throw new AppError(404, 'NOT_FOUND', 'Execution not found');
  }
  return execution;
}

export async function listExecutions(params: any) {
  return executionRepo.listExecutions(params);
}
