// src/modules/reviews/review.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as reviewService from './review.service';
import { success, paginated } from '../../shared/utils/response';
import { ReviewStatus } from '../../shared/enums';
import { AppError } from '../../shared/errors/AppError';
import { z } from 'zod';

export const reviewDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().min(1, 'Comment is required'),
});

export async function listReviewsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const status = req.query.status as ReviewStatus | undefined;
    const assignedToMe = req.query.assignedToMe === 'true';

    const result = await reviewService.listReviews({
      page,
      limit,
      status,
      assignedToMe,
      userId: req.user?.id,
    });

    paginated(res, result.data, result.pagination, 'Reviews retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const review = await reviewService.getReview(String(req.params.id));
    success(res, review, 'Review details retrieved', 200);
  } catch (err) {
    next(err);
  }
}

export async function submitDecisionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const { decision, comment } = req.body;
    const result = await reviewService.submitDecision(
      String(req.params.id),
      decision,
      comment,
      req.user.id,
    );

    success(res, result, 'Review decision recorded', 200);
  } catch (err) {
    next(err);
  }
}

export async function approveReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const comment = req.body.comment || 'Approved by reviewer';
    const result = await reviewService.submitDecision(
      String(req.params.id),
      'APPROVED',
      comment,
      req.user.id,
    );

    success(res, result, 'Review approved', 200);
  } catch (err) {
    next(err);
  }
}

export async function rejectReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const comment = req.body.comment || 'Rejected by reviewer';
    const result = await reviewService.submitDecision(
      String(req.params.id),
      'REJECTED',
      comment,
      req.user.id,
    );

    success(res, result, 'Review rejected', 200);
  } catch (err) {
    next(err);
  }
}
