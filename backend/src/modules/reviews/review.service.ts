// src/modules/reviews/review.service.ts
import { prisma } from '../../config/database';
import * as requestRepo from '../requests/request.repository';
import * as executionRepo from '../executions/execution.repository';
import * as auditService from '../audit/audit.service';
import { AppError } from '../../shared/errors/AppError';
import {
  ReviewStatus,
  RequestStatus,
  ExecutionStatus,
  Decision,
} from '../../shared/enums';
import { PaginationParams, PaginatedResult } from '../../shared/types';

export interface ReviewFilter extends PaginationParams {
  status?: ReviewStatus;
  assignedToMe?: boolean;
  userId?: string;
}

export async function listReviews(filter: ReviewFilter): Promise<PaginatedResult<any>> {
  const { page = 1, limit = 10, status, assignedToMe, userId } = filter;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (assignedToMe && userId) {
    where.assignedTo = userId;
  }

  const [items, total] = await Promise.all([
    prisma.manualReview.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        request: {
          include: {
            workflowDefinition: { select: { name: true } },
            executions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                status: true,
                decision: true,
                ruleTrace: true,
              },
            },
          },
        },
        reviewer: {
          select: { id: true, email: true, name: true },
        },
      },
    }),
    prisma.manualReview.count({ where }),
  ]);

  const data = items.map((rev) => ({
    id: rev.id,
    requestId: rev.requestId,
    referenceNumber: rev.request.referenceNumber,
    workflowName: rev.request.workflowDefinition.name,
    reviewStatus: rev.status,
    assignedTo: rev.assignedTo,
    reviewer: rev.reviewer,
    reviewerComment: rev.reviewerComment,
    reviewedAt: rev.reviewedAt,
    createdAt: rev.createdAt,
    executionId: rev.request.executions[0]?.id,
    decisionExplanation: {
      summary: `Review pending human intervention`,
      ruleTrace: rev.request.executions[0]?.ruleTrace,
    },
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

export async function getReview(id: string) {
  const review = await prisma.manualReview.findUnique({
    where: { id },
    include: {
      request: {
        include: {
          workflowDefinition: true,
          user: { select: { id: true, email: true, name: true } },
          executions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              workflowVersion: true,
            },
          },
          stateTransitions: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
      reviewer: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  if (!review) {
    throw new AppError(404, 'NOT_FOUND', 'Manual review not found');
  }

  const currentExecution = review.request.executions[0];

  return {
    id: review.id,
    requestId: review.requestId,
    reviewStatus: review.status,
    assignedTo: review.assignedTo,
    reviewer: review.reviewer,
    reviewerComment: review.reviewerComment,
    reviewedAt: review.reviewedAt,
    createdAt: review.createdAt,
    request: {
      id: review.request.id,
      referenceNumber: review.request.referenceNumber,
      workflowName: review.request.workflowDefinition.name,
      status: review.request.status,
      inputData: review.request.inputData,
      createdAt: review.request.createdAt,
    },
    decisionExplanation: {
      summary: `Manual review required for request ${review.request.referenceNumber}`,
      ruleTrace: currentExecution?.ruleTrace ?? [],
    },
  };
}

export async function submitDecision(
  reviewId: string,
  decision: 'APPROVED' | 'REJECTED',
  comment: string,
  reviewerId: string,
) {
  const review = await prisma.manualReview.findUnique({
    where: { id: reviewId },
    include: {
      request: {
        include: {
          executions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!review) {
    throw new AppError(404, 'NOT_FOUND', 'Manual review not found');
  }

  if (review.status !== ReviewStatus.PENDING) {
    throw new AppError(
      409,
      'ALREADY_DECIDED',
      `This review has already been decided (${review.status})`,
    );
  }

  const newReviewStatus =
    decision === 'APPROVED' ? ReviewStatus.APPROVED : ReviewStatus.REJECTED;
  const newRequestStatus =
    decision === 'APPROVED' ? RequestStatus.APPROVED : RequestStatus.REJECTED;
  const newExecStatus =
    decision === 'APPROVED' ? ExecutionStatus.APPROVED : ExecutionStatus.REJECTED;
  const newExecDecision =
    decision === 'APPROVED' ? Decision.APPROVED : Decision.REJECTED;

  const executionId = review.request.executions[0]?.id;

  const updatedReview = await prisma.$transaction(async (tx) => {
    // 1. Update review record
    const updated = await tx.manualReview.update({
      where: { id: reviewId },
      data: {
        status: newReviewStatus,
        reviewerComment: comment,
        reviewedAt: new Date(),
        assignedTo: reviewerId,
      },
    });

    // 2. Transition request status
    await requestRepo.transitionRequestStatus(
      review.requestId,
      newRequestStatus,
      `Manual review decision: ${decision}. ${comment}`,
      { decision, comment, reviewerId },
      tx,
    );

    await requestRepo.transitionRequestStatus(
      review.requestId,
      RequestStatus.COMPLETED,
      `Workflow completed following manual review ${decision}`,
      undefined,
      tx,
    );

    // 3. Update execution if exists
    if (executionId) {
      await tx.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: newExecStatus,
          decision: newExecDecision,
          completedAt: new Date(),
        },
      });
    }

    // 4. Audit Log
    await auditService.log(
      {
        entityType: 'MANUAL_REVIEW',
        entityId: reviewId,
        action: `MANUAL_REVIEW_${decision}`,
        actorId: reviewerId,
        metadata: {
          requestId: review.requestId,
          decision,
          comment,
        },
      },
      tx,
    );

    return updated;
  });

  return {
    reviewId: updatedReview.id,
    reviewStatus: updatedReview.status,
    requestStatus: RequestStatus.COMPLETED,
    reviewedAt: updatedReview.reviewedAt,
  };
}
