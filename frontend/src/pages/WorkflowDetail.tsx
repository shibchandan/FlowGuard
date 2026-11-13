// src/pages/WorkflowDetail.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkflow, getVersions, publishVersion } from '@/services/workflow.service';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { GitBranch, Edit, CheckCircle2, History, Shield, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();

  const {
    data: workflow,
    isLoading: isWorkflowLoading,
    error: workflowError,
    refetch,
  } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => getWorkflow(id!),
    enabled: !!id,
  });

  const { data: versions = [], isLoading: isVersionsLoading } = useQuery({
    queryKey: ['workflowVersions', id],
    queryFn: () => getVersions(id!),
    enabled: !!id,
  });

  const publishMutation = useMutation({
    mutationFn: (versionId: string) => publishVersion(id!, versionId),
    onSuccess: (pub) => {
      toast.success(`Workflow Version v${pub.version} published!`);
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      queryClient.invalidateQueries({ queryKey: ['workflowVersions', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to publish version');
    },
  });

  if (isWorkflowLoading || isVersionsLoading) {
    return <LoadingSpinner text="Loading workflow details..." />;
  }

  if (workflowError || !workflow) {
    return (
      <ErrorState
        title="Workflow Not Found"
        message="Could not load the requested workflow."
        onRetry={() => refetch()}
      />
    );
  }

  const publishedVersion =
    versions.find((v) => v.status === 'PUBLISHED') || versions[0];
  const draftVersion = versions.find((v) => v.status === 'DRAFT');

  const config = (publishedVersion?.config || publishedVersion?.configuration) as any;
  const rules = config?.rules || [];
  const inputSchema = config?.inputSchema || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title={workflow.name}
        description={workflow.description || 'Configurable decision workflow'}
      >
        <div className="flex items-center space-x-2">
          {draftVersion && isAdmin && (
            <Button
              size="sm"
              variant="default"
              onClick={() => publishMutation.mutate(draftVersion.id)}
              disabled={publishMutation.isPending}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              {publishMutation.isPending
                ? 'Publishing...'
                : `Publish Draft (v${draftVersion.version})`}
            </Button>
          )}

          {isAdmin && (
            <Button size="sm" variant="outline" asChild>
              <Link to={`/workflows/${id}/edit`}>
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Configure Rules
              </Link>
            </Button>
          )}

          <Button size="sm" asChild>
            <Link to="/requests/new">
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Run Request
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata & Versions */}
        <div className="space-y-6 lg:col-span-1">
          {/* Workflow Info Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center">
                <GitBranch className="w-4 h-4 mr-2 text-primary" />
                Workflow Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={workflow.isActive ? 'success' : 'secondary'}>
                  {workflow.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Active Version</span>
                <span className="font-semibold text-foreground">
                  {publishedVersion ? `v${publishedVersion.version}` : 'None'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Max Retries</span>
                <span className="font-mono">
                  {config?.execution?.maxRetries ?? 3}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Created Date</span>
                <span>{formatDate(workflow.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Versions List */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center">
                  <History className="w-4 h-4 mr-2 text-primary" />
                  Version History
                </CardTitle>
                <CardDescription className="text-xs">
                  Immutable version releases
                </CardDescription>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {versions.length} release(s)
              </span>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="p-3 border rounded-md flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm">v{v.version}</span>
                      <StatusBadge status={v.status} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {v.publishedAt
                        ? `Published ${formatDate(v.publishedAt)}`
                        : `Created ${formatDate(v.createdAt)}`}
                    </p>
                  </div>
                  {v.status === 'DRAFT' && isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => publishMutation.mutate(v.id)}
                      disabled={publishMutation.isPending}
                    >
                      Publish
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Rules & Schema */}
        <div className="space-y-6 lg:col-span-2">
          {/* Active Rules Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-primary" />
                  Configured Rules in Active Release (v{publishedVersion?.version ?? 1})
                </CardTitle>
                <CardDescription className="text-xs">
                  Business rules evaluated during execution in ascending priority order
                </CardDescription>
              </div>
              {isAdmin && (
                <Button size="sm" variant="outline" asChild className="h-8">
                  <Link to={`/workflows/${id}/edit`}>
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit Rules
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {rules.length === 0 ? (
                <p className="text-xs text-muted-foreground p-6 text-center">
                  No rules configured in this version yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priority</TableHead>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Expected Value</TableHead>
                      <TableHead>Failure Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules
                      .slice()
                      .sort((a: any, b: any) => a.priority - b.priority)
                      .map((rule: any) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-mono text-xs font-bold">
                            #{rule.priority}
                          </TableCell>
                          <TableCell className="font-semibold text-xs">
                            {rule.name}
                            <span className="block text-[10px] text-muted-foreground font-mono">
                              {rule.id}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-foreground">
                            {rule.field}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {rule.operator}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold">
                            {String(rule.value)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={rule.failureAction} />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Input Schema Definition */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Input Schema Contract
              </CardTitle>
              <CardDescription className="text-xs">
                Mandatory request payload fields expected for this workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {Object.entries(inputSchema).map(([field, type]) => (
                  <div
                    key={field}
                    className="p-3 border rounded-md bg-muted/20 space-y-1"
                  >
                    <span className="font-mono font-semibold text-foreground block">
                      {field}
                    </span>
                    <span className="text-[11px] text-muted-foreground uppercase font-mono">
                      Type: {String(type)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
