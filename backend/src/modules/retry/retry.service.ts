// src/modules/retry/retry.service.ts
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { ExecutionStatus, RetryStatus } from '../../shared/enums';

export async function getRetryCount(
  executionId: string,
  tx?: Prisma.TransactionClient,
): Promise<number> {
  const db = tx ?? prisma;
  return db.retryRecord.count({
    where: { executionId },
  });
}

export async function isEligibleForRetry(
  executionId: string,
  maxRetries = 3,
  tx?: Prisma.TransactionClient,
): Promise<{ eligible: boolean; currentAttempts: number; reason?: string }> {
  const db = tx ?? prisma;

  const execution = await db.workflowExecution.findUnique({
    where: { id: executionId },
  });

  if (!execution) {
    throw new AppError(404, 'NOT_FOUND', 'Execution not found');
  }

  // Only RETRY or FAILED executions are retryable
  if (
    execution.status !== ExecutionStatus.RETRY &&
    execution.status !== ExecutionStatus.FAILED
  ) {
    return {
      eligible: false,
      currentAttempts: 0,
      reason: `Execution in status ${execution.status} is not eligible for retry`,
    };
  }

  const currentAttempts = await db.retryRecord.count({
    where: { executionId },
  });

  if (currentAttempts >= maxRetries) {
    return {
      eligible: false,
      currentAttempts,
      reason: `Maximum retry attempts (${maxRetries}) exceeded`,
    };
  }

  return { eligible: true, currentAttempts };
}

export async function createRetryRecord(
  executionId: string,
  attemptNumber: number,
  reason?: string,
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? prisma;
  return db.retryRecord.create({
    data: {
      executionId,
      attemptNumber,
      status: RetryStatus.RUNNING,
      reason: reason || 'Manual retry initiated',
    },
  });
}

export async function updateRetryRecord(
  recordId: string,
  status: RetryStatus,
  errorMessage?: string,
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? prisma;
  return db.retryRecord.update({
    where: { id: recordId },
    data: {
      status,
      errorMessage,
      completedAt: new Date(),
    },
  });
}

export async function getRetryHistory(executionId: string) {
  return prisma.retryRecord.findMany({
    where: { executionId },
    orderBy: { attemptNumber: 'asc' },
  });
}
