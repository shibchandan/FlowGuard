// src/modules/requests/request.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as requestService from './request.service';
import { success, paginated } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';
import { RequestStatus } from '../../shared/enums';

export async function submitRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const idempotencyKey =
      (req.headers['idempotency-key'] as string) ||
      (req.body.idempotencyKey as string) ||
      undefined;

    const result = await requestService.submitRequest({
      workflowId: req.body.workflowId,
      data: req.body.data,
      idempotencyKey,
      userId: req.user.id,
    });

    if (result.isDuplicate) {
      success(res, result, 'Existing request returned', 200);
    } else {
      success(res, result, 'Request accepted for processing', 202);
    }
  } catch (err) {
    next(err);
  }
}

export async function listRequestsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const status = req.query.status as RequestStatus | undefined;
    const workflowId = req.query.workflowId as string | undefined;
    const search = req.query.search as string | undefined;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

    const result = await requestService.listRequests({
      page,
      limit,
      status,
      workflowId,
      search,
      fromDate,
      toDate,
    });

    paginated(res, result.data, result.pagination, 'Requests retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const request = await requestService.getRequest(String(req.params.id));
    success(res, request, 'Request details retrieved', 200);
  } catch (err) {
    next(err);
  }
}

export async function getRequestHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const history = await requestService.getRequestHistory(String(req.params.id));
    success(res, history, 'Request history retrieved', 200);
  } catch (err) {
    next(err);
  }
}
