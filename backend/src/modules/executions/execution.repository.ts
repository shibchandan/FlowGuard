// src/modules/executions/execution.repository.ts
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ExecutionStatus, Decision } from '../../shared/enums';
import { PaginationParams, PaginatedResult } from '../../shared/types';

export async function findExecutionById(id: string) {
  return prisma.workflowExecution.findUnique({
    where: { id },
    include: {
      request: {
        include: {
          workflowDefinition: true,
          user: {
            select: { id: true, email: true, name: true },
          },
          stateTransitions: {
            orderBy: { createdAt: 'asc' },
          },
          manualReview: true,
        },
      },
      workflowVersion: true,
      retryRecords: {
        orderBy: { attemptNumber: 'asc' },
      },
    },
  });
}

export async function updateExecution(
  id: string,
  data: {
    status?: ExecutionStatus;
    decision?: Decision;
    ruleTrace?: unknown;
    errorMessage?: string | null;
    completedAt?: Date | null;
  },
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? prisma;
  return db.workflowExecution.update({
    where: { id },
    data: {
      status: data.status,
      decision: data.decision,
      ruleTrace: data.ruleTrace as Prisma.InputJsonValue,
      errorMessage: data.errorMessage,
      completedAt: data.completedAt,
    },
  });
}

export async function listExecutions(
  filter: PaginationParams & { status?: ExecutionStatus; requestId?: string },
): Promise<PaginatedResult<any>> {
  const { page = 1, limit = 10, status, requestId } = filter;
  const skip = (page - 1) * limit;

  const where: Prisma.WorkflowExecutionWhereInput = {};
  if (status) where.status = status;
  if (requestId) where.requestId = requestId;

  const [items, total] = await Promise.all([
    prisma.workflowExecution.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        request: {
          select: {
            referenceNumber: true,
            status: true,
            workflowDefinition: { select: { name: true } },
          },
        },
        workflowVersion: {
          select: { version: true },
        },
      },
    }),
    prisma.workflowExecution.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: items,
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
