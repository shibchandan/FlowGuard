// src/modules/dashboard/dashboard.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';
import { success, paginated } from '../../shared/utils/response';

export async function getSummaryHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const summary = await dashboardService.getSummary();
    success(res, summary, 'Dashboard summary retrieved', 200);
  } catch (err) {
    next(err);
  }
}

export async function getRecentActivityHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await dashboardService.getRecentActivity(page, limit);
    paginated(res, result.data, result.pagination, 'Recent activity retrieved');
  } catch (err) {
    next(err);
  }
}
