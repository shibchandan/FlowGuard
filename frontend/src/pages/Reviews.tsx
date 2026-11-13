// src/pages/Reviews.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listReviews } from '@/services/review.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { formatDate } from '@/lib/utils';
import { CheckSquare, ArrowRight, UserCheck } from 'lucide-react';

export default function Reviews() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('PENDING');

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['reviewsList', page, status],
    queryFn: () =>
      listReviews({
        page,
        limit: 10,
        status: status || undefined,
      }),
  });

  const reviews = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manual Review Queue"
        description="Inspect borderline applications and record human approval or rejection decisions"
      />

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-2 border-b pb-2">
        {['PENDING', 'APPROVED', 'REJECTED', ''].map((s) => (
          <Button
            key={s}
            variant={status === s ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className="text-xs h-8"
          >
            {s ? (s === 'PENDING' ? '⏳ Pending Reviews' : s) : 'All Reviews'}
          </Button>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner text="Loading review queue..." />
          ) : error ? (
            <div className="p-6">
              <ErrorState
                title="Could not load reviews"
                message="Failed to fetch manual review tasks."
                onRetry={() => refetch()}
              />
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No reviews found"
                description={
                  status === 'PENDING'
                    ? 'All pending review cases have been processed! No action required.'
                    : 'No review items found for the selected filter.'
                }
                icon={<CheckSquare className="w-8 h-8" />}
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference #</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Review Status</TableHead>
                    <TableHead>Reviewed By</TableHead>
                    <TableHead>Review Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((rev) => (
                    <TableRow key={rev.id}>
                      <TableCell className="font-semibold text-xs">
                        <Link
                          to={`/reviews/${rev.id}`}
                          className="hover:underline text-primary"
                        >
                          {rev.referenceNumber || rev.requestId.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">
                        {rev.workflowName || 'Application Approval'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={rev.reviewStatus} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {rev.reviewer?.email || (
                          <span className="italic text-muted-foreground/60">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {rev.reviewedAt ? formatDate(rev.reviewedAt) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild className="h-8 px-2.5 text-xs">
                          <Link to={`/reviews/${rev.id}`}>
                            {rev.reviewStatus === 'PENDING' ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5 mr-1 text-primary" />
                                Decide
                              </>
                            ) : (
                              <>
                                View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                              </>
                            )}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 border-t">
                <Pagination
                  pagination={pagination}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
