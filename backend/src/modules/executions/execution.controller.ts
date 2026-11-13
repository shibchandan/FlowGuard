// src/modules/executions/execution.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as executionService from './execution.service';
import * as auditService from '../audit/audit.service';
import { success, paginated } from '../../shared/utils/response';
import { ExecutionStatus } from '../../shared/enums';

export async function listExecutionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const status = req.query.status as ExecutionStatus | undefined;
    const requestId = req.query.requestId as string | undefined;

    const result = await executionService.listExecutions({
      page,
      limit,
      status,
      requestId,
    });

    paginated(res, result.data, result.pagination, 'Executions retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getExecutionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const execution = await executionService.getExecution(String(req.params.id));
    success(res, execution, 'Execution details retrieved', 200);
  } catch (err) {
    next(err);
  }
}

export async function getExecutionAuditHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await auditService.getAuditLogs({
      page,
      limit,
      entityType: 'WORKFLOW_EXECUTION',
      entityId: String(req.params.id),
    });

    success(res, result.data, 'Execution audit retrieved', 200);
  } catch (err) {
    next(err);
  }
}

export async function retryExecutionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { reason } = req.body;
    const result = await executionService.retryExecution(
      String(req.params.id),
      reason,
      req.user?.id,
    );
    success(res, result, 'Retry accepted', 202);
  } catch (err) {
    next(err);
  }
}
