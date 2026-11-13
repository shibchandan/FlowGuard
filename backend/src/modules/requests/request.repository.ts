// src/modules/requests/request.repository.ts
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { RequestStatus } from '../../shared/enums';
import { PaginationParams, PaginatedResult } from '../../shared/types';

export interface RequestFilter extends PaginationParams {
  status?: RequestStatus;
  workflowId?: string;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
  userId?: string;
}

export async function createRequestWithExecution(
  data: {
    referenceNumber: string;
    workflowDefinitionId: string;
    userId: string;
    inputData: Record<string, unknown>;
    idempotencyKey?: string;
    workflowVersionId: string;
  },
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? prisma;

  const request = await db.request.create({
    data: {
      referenceNumber: data.referenceNumber,
      workflowDefinitionId: data.workflowDefinitionId,
      userId: data.userId,
      status: RequestStatus.RECEIVED,
      inputData: data.inputData as Prisma.InputJsonValue,
      idempotencyKey: data.idempotencyKey ?? null,
      executions: {
        create: {
          workflowVersionId: data.workflowVersionId,
        },
      },
      stateTransitions: {
        create: {
          toStatus: RequestStatus.RECEIVED,
          reason: 'Request received and registered',
        },
      },
    },
    include: {
      executions: true,
      workflowDefinition: true,
    },
  });

  return request;
}

export async function findRequests(
  filter: RequestFilter,
): Promise<PaginatedResult<any>> {
  const { page = 1, limit = 10, status, workflowId, search, fromDate, toDate, userId } = filter;
  const skip = (page - 1) * limit;

  const where: Prisma.RequestWhereInput = {};

  if (status) where.status = status;
  if (workflowId) where.workflowDefinitionId = workflowId;
  if (userId) where.userId = userId;
  if (search) {
    where.referenceNumber = { contains: search, mode: 'insensitive' };
  }
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) where.createdAt.lte = toDate;
  }

  const [items, total] = await Promise.all([
    prisma.request.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        workflowDefinition: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, email: true, name: true },
        },
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            decision: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
    }),
    prisma.request.count({ where }),
  ]);

  const data = items.map((r) => ({
    id: r.id,
    referenceNumber: r.referenceNumber,
    workflowId: r.workflowDefinitionId,
    workflowName: r.workflowDefinition.name,
    userId: r.userId,
    submittedBy: r.user.email,
    submitterName: r.user.name,
    status: r.status,
    inputData: r.inputData,
    currentExecution: r.executions[0] ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function findRequestById(id: string) {
  return prisma.request.findUnique({
    where: { id },
    include: {
      workflowDefinition: true,
      user: {
        select: { id: true, email: true, name: true },
      },
      executions: {
        orderBy: { createdAt: 'desc' },
        include: {
          workflowVersion: true,
          retryRecords: {
            orderBy: { attemptNumber: 'asc' },
          },
        },
      },
      stateTransitions: {
        orderBy: { createdAt: 'asc' },
      },
      manualReview: {
        include: {
          reviewer: {
            select: { id: true, email: true, name: true },
          },
        },
      },
    },
  });
}

export async function findRequestHistory(requestId: string) {
  return prisma.stateTransition.findMany({
    where: { requestId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function countRequests(): Promise<number> {
  return prisma.request.count();
}

export async function transitionRequestStatus(
  requestId: string,
  newStatus: RequestStatus,
  reason?: string,
  metadata?: Record<string, unknown>,
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? prisma;

  const current = await db.request.findUnique({
    where: { id: requestId },
    select: { status: true },
  });

  const fromStatus = current?.status;

  await db.stateTransition.create({
    data: {
      requestId,
      fromStatus: fromStatus ?? null,
      toStatus: newStatus,
      reason: reason ?? null,
      metadata: (metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });

  return db.request.update({
    where: { id: requestId },
    data: { status: newStatus },
  });
}
