// src/modules/audit/audit.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as auditService from './audit.service';
import { paginated } from '../../shared/utils/response';

export async function listAuditLogsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const entityType = req.query.entityType as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const action = req.query.action as string | undefined;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

    const result = await auditService.getAuditLogs({
      page,
      limit,
      entityType,
      entityId,
      action,
      fromDate,
      toDate,
    });

    paginated(res, result.data, result.pagination, 'Audit logs retrieved');
  } catch (err) {
    next(err);
  }
}
