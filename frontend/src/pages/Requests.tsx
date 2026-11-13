// src/pages/Requests.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listRequests } from '@/services/request.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { PlusCircle, Search, Eye, Filter } from 'lucide-react';

export default function Requests() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['requests', page, search, status],
    queryFn: () =>
      listRequests({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
      }),
  });

  const requests = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requests Management"
        description="Submit, track, and monitor all business decision requests"
      >
        <Button asChild size="sm">
          <Link to="/requests/new">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Request
          </Link>
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search reference number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-md border border-input bg-background text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="VALIDATED">Validated</option>
              <option value="PROCESSING">Processing</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="MANUAL_REVIEW">Manual Review</option>
              <option value="RETRYING">Retrying</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner text="Loading requests..." />
          ) : error ? (
            <div className="p-6">
              <ErrorState
                title="Failed to load requests"
                message="Could not fetch requests from the API."
                onRetry={() => refetch()}
              />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No requests found"
                description={
                  search || status
                    ? 'No requests match your search or filter criteria.'
                    : 'Submit your first request to get started with workflow evaluations.'
                }
                actionText="Submit Request"
                onAction={() => (window.location.href = '/requests/new')}
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference Number</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-semibold text-xs">
                        <Link
                          to={`/requests/${req.id}`}
                          className="hover:underline text-primary"
                        >
                          {req.referenceNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">
                        {req.workflowName || 'Application Approval'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={req.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {typeof req.submittedBy === 'object'
                          ? req.submittedBy?.name || req.submittedBy?.email || 'operator'
                          : req.submittedBy || 'operator@flowguard.local'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(req.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
                          <Link to={`/requests/${req.id}`}>
                            <Eye className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                            View
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
