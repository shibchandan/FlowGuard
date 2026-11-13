// src/modules/workflows/workflow.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as workflowService from './workflow.service';
import { success, paginated } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

export async function listWorkflowsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = req.query.search as string | undefined;
    const isActive =
      req.query.isActive !== undefined
        ? req.query.isActive === 'true'
        : undefined;

    const result = await workflowService.listWorkflows({
      page,
      limit,
      search,
      isActive,
    });

    paginated(res, result.data, result.pagination, 'Workflows retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getWorkflowHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workflow = await workflowService.getWorkflow(String(req.params.id));
    success(res, workflow, 'Workflow retrieved', 200);
  } catch (err) {
    next(err);
  }
}

export async function createWorkflowHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workflow = await workflowService.createWorkflow(req.body, req.user?.id);
    success(res, workflow, 'Workflow created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateWorkflowHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workflow = await workflowService.updateWorkflow(
      String(req.params.id),
      req.body,
      req.user?.id,
    );
    success(res, workflow, 'Workflow updated successfully', 200);
  } catch (err) {
    next(err);
  }
}

export async function getWorkflowVersionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const versions = await workflowService.getWorkflowVersions(String(req.params.id));
    success(res, versions, 'Workflow versions retrieved', 200);
  } catch (err) {
    next(err);
  }
}

export async function createWorkflowVersionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const config = req.body.configuration || req.body.config || req.body;
    const version = await workflowService.createWorkflowVersion(
      String(req.params.id),
      config,
      req.user?.id,
    );
    success(res, version, 'Draft version created', 201);
  } catch (err) {
    next(err);
  }
}

export async function publishWorkflowVersionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workflowId = String(req.params.id);
    const versionId = String(req.params.versionId || req.body.versionId);

    if (!versionId) {
      throw new AppError(400, 'BAD_REQUEST', 'versionId is required to publish');
    }

    const published = await workflowService.publishWorkflowVersion(
      workflowId,
      versionId,
      req.user?.id,
    );
    success(res, published, 'Workflow version published', 200);
  } catch (err) {
    next(err);
  }
}
