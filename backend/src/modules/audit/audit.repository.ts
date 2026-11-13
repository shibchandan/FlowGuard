// src/modules/audit/audit.repository.ts
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../../config/database';
import { PaginationParams, PaginatedResult } from '../../shared/types';

export interface CreateAuditLogInput {
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditLogFilter extends PaginationParams {
  entityType?: string;
  entityId?: string;
  action?: string;
  fromDate?: Date;
  toDate?: Date;
}

export async function createAuditLog(
  input: CreateAuditLogInput,
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? prisma;
  return db.auditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorId: input.actorId ?? null,
      metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });
}

export async function findAuditLogs(
  filter: AuditLogFilter,
): Promise<PaginatedResult<any>> {
  const { page = 1, limit = 20, entityType, entityId, action, fromDate, toDate } = filter;
  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {};

  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) where.createdAt.lte = toDate;
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

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
