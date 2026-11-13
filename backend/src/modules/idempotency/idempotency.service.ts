// src/modules/idempotency/idempotency.service.ts
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { hashPayload } from '../../shared/utils/hash';

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  requestId?: string;
  referenceNumber?: string;
  status?: string;
  executionId?: string;
}

export async function checkIdempotency(
  key: string,
  payload: unknown,
  tx?: Prisma.TransactionClient,
): Promise<IdempotencyCheckResult> {
  const db = tx ?? prisma;
  const payloadHash = hashPayload(payload);

  const existing = await db.idempotencyRecord.findUnique({
    where: { key },
    include: {
      request: {
        include: {
          executions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!existing) {
    return { isDuplicate: false };
  }

  // Key was found — compare payload hashes
  if (existing.payloadHash !== payloadHash) {
    throw new AppError(
      409,
      'IDEMPOTENCY_CONFLICT',
      'Idempotency key reused with different request payload',
    );
  }

  // Same key + same payload: return existing result
  return {
    isDuplicate: true,
    requestId: existing.requestId,
    referenceNumber: existing.request.referenceNumber,
    status: existing.request.status,
    executionId: existing.request.executions[0]?.id,
  };
}

export async function createIdempotencyRecord(
  key: string,
  payload: unknown,
  requestId: string,
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? prisma;
  const payloadHash = hashPayload(payload);

  return db.idempotencyRecord.create({
    data: {
      key,
      payloadHash,
      requestId,
    },
  });
}
