// src/modules/requests/request.service.ts
import { prisma } from '../../config/database';
import * as requestRepo from './request.repository';
import * as workflowRepo from '../workflows/workflow.repository';
import * as idempotencyService from '../idempotency/idempotency.service';
import * as executionService from '../executions/execution.service';
import * as auditService from '../audit/audit.service';
import { AppError } from '../../shared/errors/AppError';
import { RequestFilter } from './request.repository';

export interface SubmitRequestInput {
  workflowId: string;
  data: Record<string, unknown>;
  idempotencyKey?: string;
  userId: string;
}

export interface SubmitRequestResult {
  isDuplicate: boolean;
  requestId: string;
  referenceNumber: string;
  status: string;
  executionId: string;
}

export async function submitRequest(
  input: SubmitRequestInput,
): Promise<SubmitRequestResult> {
  const { workflowId, data, idempotencyKey, userId } = input;

  // 1. Resolve workflow and published version
  const workflow = await workflowRepo.findWorkflowById(workflowId);
  if (!workflow) {
    throw new AppError(404, 'NOT_FOUND', 'Workflow not found');
  }

  if (!workflow.isActive) {
    throw new AppError(422, 'WORKFLOW_INACTIVE', 'Workflow is currently inactive');
  }

  const publishedVersion = await workflowRepo.findLatestPublishedVersion(workflowId);
  if (!publishedVersion) {
    throw new AppError(
      422,
      'NO_PUBLISHED_VERSION',
      'No published version found for this workflow',
    );
  }

  // 2. Check idempotency if key is present
  if (idempotencyKey) {
    const check = await idempotencyService.checkIdempotency(idempotencyKey, data);
    if (check.isDuplicate) {
      return {
        isDuplicate: true,
        requestId: check.requestId!,
        referenceNumber: check.referenceNumber!,
        status: check.status!,
        executionId: check.executionId!,
      };
    }
  }

  // 3. Generate unique reference number
  const count = await requestRepo.countRequests();
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(6, '0');
  const referenceNumber = `FG-${year}-${seq}`;

  // 4. Atomically persist Request, Execution, IdempotencyRecord, StateTransition & AuditLog
  const request = await prisma.$transaction(async (tx) => {
    const req = await requestRepo.createRequestWithExecution(
      {
        referenceNumber,
        workflowDefinitionId: workflowId,
        userId,
        inputData: data,
        idempotencyKey,
        workflowVersionId: publishedVersion.id,
      },
      tx,
    );

    if (idempotencyKey) {
      await idempotencyService.createIdempotencyRecord(
        idempotencyKey,
        data,
        req.id,
        tx,
      );
    }

    await auditService.log(
      {
        entityType: 'REQUEST',
        entityId: req.id,
        action: 'REQUEST_SUBMITTED',
        actorId: userId,
        metadata: {
          referenceNumber,
          workflowId,
          version: publishedVersion.version,
        },
      },
      tx,
    );

    return req;
  });

  const executionId = request.executions[0].id;

  // 5. Execute workflow lifecycle synchronously
  await executionService.executeWorkflow(executionId, userId);

  // 6. Fetch updated status
  const updated = await requestRepo.findRequestById(request.id);

  return {
    isDuplicate: false,
    requestId: request.id,
    referenceNumber: request.referenceNumber,
    status: updated?.status ?? request.status,
    executionId,
  };
}

export async function listRequests(filter: RequestFilter) {
  return requestRepo.findRequests(filter);
}

export async function getRequest(id: string) {
  const req = await requestRepo.findRequestById(id);
  if (!req) {
    throw new AppError(404, 'NOT_FOUND', 'Request not found');
  }
  return req;
}

export async function getRequestHistory(id: string) {
  const req = await requestRepo.findRequestById(id);
  if (!req) {
    throw new AppError(404, 'NOT_FOUND', 'Request not found');
  }
  return requestRepo.findRequestHistory(id);
}
