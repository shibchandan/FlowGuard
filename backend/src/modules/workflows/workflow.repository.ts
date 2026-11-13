// src/modules/workflows/workflow.repository.ts
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { PaginationParams, PaginatedResult } from '../../shared/types';
import { WorkflowVersionStatus } from '../../shared/enums';

export interface WorkflowFilter extends PaginationParams {
  search?: string;
  isActive?: boolean;
}

export async function findWorkflows(
  filter: WorkflowFilter,
): Promise<PaginatedResult<any>> {
  const { page = 1, limit = 10, search, isActive } = filter;
  const skip = (page - 1) * limit;

  const where: Prisma.WorkflowDefinitionWhereInput = {};

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [items, total] = await Promise.all([
    prisma.workflowDefinition.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
          select: {
            version: true,
            status: true,
          },
        },
        _count: {
          select: {
            requests: true,
            versions: true,
          },
        },
      },
    }),
    prisma.workflowDefinition.count({ where }),
  ]);

  const data = items.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    isActive: w.isActive,
    latestVersion: w.versions[0]?.version ?? 0,
    latestStatus: w.versions[0]?.status ?? null,
    totalRequests: w._count.requests,
    totalVersions: w._count.versions,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
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

export async function findWorkflowById(id: string) {
  return prisma.workflowDefinition.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { version: 'desc' },
      },
    },
  });
}

export async function createWorkflow(data: { name: string; description?: string }) {
  return prisma.workflowDefinition.create({
    data: {
      name: data.name,
      description: data.description,
      isActive: true,
    },
  });
}

export async function updateWorkflow(
  id: string,
  data: { name?: string; description?: string; isActive?: boolean },
) {
  return prisma.workflowDefinition.update({
    where: { id },
    data,
  });
}

export async function findVersionsByWorkflowId(workflowDefinitionId: string) {
  return prisma.workflowVersion.findMany({
    where: { workflowDefinitionId },
    orderBy: { version: 'desc' },
  });
}

export async function findVersionById(versionId: string) {
  return prisma.workflowVersion.findUnique({
    where: { id: versionId },
    include: {
      workflowDefinition: true,
    },
  });
}

export async function findLatestVersionNumber(workflowDefinitionId: string): Promise<number> {
  const latest = await prisma.workflowVersion.findFirst({
    where: { workflowDefinitionId },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  return latest?.version ?? 0;
}

export async function findLatestPublishedVersion(workflowDefinitionId: string) {
  return prisma.workflowVersion.findFirst({
    where: {
      workflowDefinitionId,
      status: WorkflowVersionStatus.PUBLISHED,
    },
    orderBy: { version: 'desc' },
  });
}

export async function createVersion(
  workflowDefinitionId: string,
  config: Record<string, unknown>,
  versionNumber: number,
) {
  return prisma.workflowVersion.create({
    data: {
      workflowDefinitionId,
      version: versionNumber,
      status: WorkflowVersionStatus.DRAFT,
      config: config as Prisma.InputJsonValue,
    },
  });
}

export async function publishVersion(versionId: string, tx?: Prisma.TransactionClient) {
  const db = tx ?? prisma;
  return db.workflowVersion.update({
    where: { id: versionId },
    data: {
      status: WorkflowVersionStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });
}
