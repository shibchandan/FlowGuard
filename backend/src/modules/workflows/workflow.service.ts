// src/modules/workflows/workflow.service.ts
import { prisma } from '../../config/database';
import * as workflowRepo from './workflow.repository';
import * as auditService from '../audit/audit.service';
import { AppError } from '../../shared/errors/AppError';
import { WorkflowFilter } from './workflow.repository';
import { WorkflowVersionStatus } from '../../shared/enums';
import { workflowConfigSchema } from './workflow.schema';

export async function listWorkflows(filter: WorkflowFilter) {
  return workflowRepo.findWorkflows(filter);
}

export async function getWorkflow(id: string) {
  const workflow = await workflowRepo.findWorkflowById(id);
  if (!workflow) {
    throw new AppError(404, 'NOT_FOUND', 'Workflow not found');
  }
  const latestPublished = workflow.versions.find(
    (v) => v.status === WorkflowVersionStatus.PUBLISHED,
  );
  return {
    ...workflow,
    latestVersion: workflow.versions[0]?.version ?? 0,
    publishedVersion: latestPublished ?? null,
  };
}

export async function createWorkflow(
  data: { name: string; description?: string },
  actorId?: string,
) {
  const workflow = await workflowRepo.createWorkflow(data);

  await auditService.log({
    entityType: 'WORKFLOW',
    entityId: workflow.id,
    action: 'WORKFLOW_CREATED',
    actorId,
    metadata: { name: workflow.name },
  });

  return workflow;
}

export async function updateWorkflow(
  id: string,
  data: { name?: string; description?: string; isActive?: boolean },
  actorId?: string,
) {
  const existing = await workflowRepo.findWorkflowById(id);
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Workflow not found');
  }

  const updated = await workflowRepo.updateWorkflow(id, data);

  await auditService.log({
    entityType: 'WORKFLOW',
    entityId: id,
    action: 'WORKFLOW_UPDATED',
    actorId,
    metadata: data,
  });

  return updated;
}

export async function getWorkflowVersions(workflowId: string) {
  const existing = await workflowRepo.findWorkflowById(workflowId);
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Workflow not found');
  }
  return workflowRepo.findVersionsByWorkflowId(workflowId);
}

export async function createWorkflowVersion(
  workflowId: string,
  configuration: Record<string, unknown>,
  actorId?: string,
) {
  const existing = await workflowRepo.findWorkflowById(workflowId);
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Workflow not found');
  }

  // Validate the configuration against the schema
  const parsed = workflowConfigSchema.safeParse(configuration);
  if (!parsed.success) {
    throw Object.assign(
      new AppError(422, 'VALIDATION_ERROR', 'Invalid workflow configuration'),
      { details: parsed.error.errors },
    );
  }

  const latestVersion = await workflowRepo.findLatestVersionNumber(workflowId);
  const nextVersion = latestVersion + 1;

  const newVersion = await workflowRepo.createVersion(
    workflowId,
    parsed.data as Record<string, unknown>,
    nextVersion,
  );

  await auditService.log({
    entityType: 'WORKFLOW_VERSION',
    entityId: newVersion.id,
    action: 'WORKFLOW_VERSION_DRAFT_CREATED',
    actorId,
    metadata: { workflowId, version: nextVersion },
  });

  return newVersion;
}

export async function publishWorkflowVersion(
  workflowId: string,
  versionId: string,
  actorId?: string,
) {
  const version = await workflowRepo.findVersionById(versionId);
  if (!version || version.workflowDefinitionId !== workflowId) {
    throw new AppError(404, 'NOT_FOUND', 'Workflow version not found');
  }

  if (version.status === WorkflowVersionStatus.PUBLISHED) {
    throw new AppError(409, 'ALREADY_PUBLISHED', 'Workflow version is already published');
  }

  // Validate config before publishing
  const parsed = workflowConfigSchema.safeParse(version.config);
  if (!parsed.success) {
    throw Object.assign(
      new AppError(422, 'VALIDATION_ERROR', 'Cannot publish invalid configuration'),
      { details: parsed.error.errors },
    );
  }

  // Execute in transaction: archive old published versions and publish this version
  const published = await prisma.$transaction(async (tx) => {
    // Optionally archive previous published versions
    await tx.workflowVersion.updateMany({
      where: {
        workflowDefinitionId: workflowId,
        status: WorkflowVersionStatus.PUBLISHED,
      },
      data: {
        status: WorkflowVersionStatus.ARCHIVED,
      },
    });

    const pub = await tx.workflowVersion.update({
      where: { id: versionId },
      data: {
        status: WorkflowVersionStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    await auditService.log(
      {
        entityType: 'WORKFLOW_VERSION',
        entityId: versionId,
        action: 'WORKFLOW_VERSION_PUBLISHED',
        actorId,
        metadata: { workflowId, version: pub.version },
      },
      tx,
    );

    return pub;
  });

  return published;
}
