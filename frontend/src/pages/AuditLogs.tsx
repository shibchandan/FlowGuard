// src/pages/AuditLogs.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAuditLogs } from '@/services/audit.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, Search, Filter } from 'lucide-react';

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['auditLogs', page, action, entityType],
    queryFn: () =>
      listAuditLogs({
        page,
        limit: 15,
        action: action || undefined,
        entityType: entityType || undefined,
      }),
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs & Traceability"
        description="Immutable chronological record of all system events, state transitions, and evaluations"
      />

      {/* Filter Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search action keyword..."
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-md border border-input bg-background text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Entity Types</option>
              <option value="REQUEST">Request</option>
              <option value="WORKFLOW">Workflow</option>
              <option value="WORKFLOW_VERSION">Workflow Version</option>
              <option value="WORKFLOW_EXECUTION">Workflow Execution</option>
              <option value="MANUAL_REVIEW">Manual Review</option>
              <option value="RETRY">Retry</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner text="Loading audit logs..." />
          ) : error ? (
            <div className="p-6">
              <ErrorState
                title="Could not load audit logs"
                message="Failed to fetch audit events from the API."
                onRetry={() => refetch()}
              />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No audit logs recorded"
                description="Audit logs will appear here as workflows, requests, and reviews are performed."
                icon={<ShieldCheck className="w-8 h-8" />}
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Metadata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell className="font-semibold text-xs">
                        <span className="px-2 py-0.5 rounded bg-muted text-foreground">
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.entityType}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.entityId ? `${log.entityId.slice(0, 8)}...` : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.actor?.email || log.actorId ? (
                          <span className="font-medium text-foreground">
                            {log.actor?.email || log.actorId?.slice(0, 8)}
                          </span>
                        ) : (
                          <span className="italic text-muted-foreground/60">
                            SYSTEM
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate font-mono">
                        {log.metadata
                          ? JSON.stringify(log.metadata)
                          : '-'}
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
