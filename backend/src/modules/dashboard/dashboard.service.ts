// src/modules/dashboard/dashboard.service.ts
import { prisma } from '../../config/database';
import { RequestStatus, ExecutionStatus, ReviewStatus, Decision } from '../../shared/enums';
import * as auditService from '../audit/audit.service';

export async function getSummary() {
  const [
    totalRequests,
    approvedRequests,
    rejectedRequests,
    pendingReviews,
    failedExecutions,
    retryingRequests,
  ] = await Promise.all([
    prisma.request.count(),
    prisma.workflowExecution.count({
      where: {
        decision: Decision.APPROVED,
      },
    }),
    prisma.request.count({
      where: {
        status: { in: [RequestStatus.REJECTED] },
      },
    }),
    prisma.manualReview.count({
      where: {
        status: ReviewStatus.PENDING,
      },
    }),
    prisma.workflowExecution.count({
      where: {
        status: ExecutionStatus.FAILED,
      },
    }),
    prisma.request.count({
      where: {
        status: RequestStatus.RETRYING,
      },
    }),
  ]);

  return {
    totalRequests,
    approvedRequests,
    rejectedRequests,
    pendingReviews,
    failedExecutions,
    retryingRequests,
  };
}

export async function getRecentActivity(page = 1, limit = 10) {
  return auditService.getAuditLogs({ page, limit });
}
