// src/pages/Workflows.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listWorkflows, createWorkflow } from '@/services/workflow.service';
import { useAuth } from '@/context/AuthContext';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDate } from '@/lib/utils';
import { PlusCircle, GitBranch, ArrowRight, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function Workflows() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();

  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workflowsList'],
    queryFn: () => listWorkflows({ page: 1, limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: createWorkflow,
    onSuccess: (newWf) => {
      toast.success(`Workflow "${newWf.name}" created!`);
      queryClient.invalidateQueries({ queryKey: ['workflowsList'] });
      setOpenCreate(false);
      setName('');
      setDescription('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create workflow');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Workflow name is required');
      return;
    }
    createMutation.mutate({ name, description });
  };

  const workflows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflow Configurations"
        description="Manage business workflows, dynamic rule sets, and version releases"
      >
        {isAdmin && (
          <Button size="sm" onClick={() => setOpenCreate(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        )}
      </PageHeader>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner text="Loading workflows..." />
          ) : error ? (
            <div className="p-6">
              <ErrorState
                title="Failed to load workflows"
                message="Could not retrieve workflow definitions."
                onRetry={() => refetch()}
              />
            </div>
          ) : workflows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No workflows defined"
                description="Create a workflow to start configuring decision rules."
                actionText={isAdmin ? 'Create Workflow' : undefined}
                onAction={() => setOpenCreate(true)}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Latest Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Requests</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((wf) => (
                  <TableRow key={wf.id}>
                    <TableCell className="font-semibold text-xs">
                      <Link
                        to={`/workflows/${wf.id}`}
                        className="hover:underline text-primary flex items-center"
                      >
                        <GitBranch className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                        {wf.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {wf.description || 'No description provided'}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      v{wf.latestVersion || 1}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={wf.isActive ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {wf.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {wf.totalRequests ?? 0}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(wf.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="h-8 px-2">
                        <Link to={`/workflows/${wf.id}`}>
                          View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Workflow Modal */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Define a new business workflow. You can configure versioned rules after creation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Workflow Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Loan Application Approval"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Description
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Automated decisioning based on credit history and income"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenCreate(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Workflow'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
