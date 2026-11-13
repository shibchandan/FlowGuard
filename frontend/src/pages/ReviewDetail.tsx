// src/pages/ReviewDetail.tsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReview, submitReviewDecision } from '@/services/review.service';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [comment, setComment] = useState('');

  const {
    data: review,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['review', id],
    queryFn: () => getReview(id!),
    enabled: !!id,
  });

  const decisionMutation = useMutation({
    mutationFn: ({ decision }: { decision: 'APPROVED' | 'REJECTED' }) =>
      submitReviewDecision(id!, decision, comment),
    onSuccess: (res, vars) => {
      toast.success(`Review ${vars.decision.toLowerCase()} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['review', id] });
      queryClient.invalidateQueries({ queryKey: ['reviewsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      navigate('/reviews');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit decision');
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="Loading review case..." />;
  }

  if (error || !review) {
    return (
      <ErrorState
        title="Review Not Found"
        message="Could not load the requested manual review task."
        onRetry={() => refetch()}
      />
    );
  }

  const isPending = review.reviewStatus === 'PENDING';
  const canDecide = isPending && (user?.role === 'ADMIN' || user?.role === 'REVIEWER');
  const ruleTrace = review.decisionExplanation?.ruleTrace || [];

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={`Review: ${review.request?.referenceNumber || review.requestId}`}
        description={`Created ${formatDate(review.createdAt)} • Workflow: ${review.request?.workflowName}`}
      >
        <div className="flex items-center space-x-2">
          <StatusBadge status={review.reviewStatus} />
          <Button variant="outline" size="sm" asChild>
            <Link to="/reviews">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Queue
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Request Inputs */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center">
                <FileText className="w-4 h-4 mr-2 text-primary" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {Object.entries(review.request?.inputData || {}).map(([key, val]) => (
                <div
                  key={key}
                  className="flex justify-between py-1.5 border-b border-border/40 last:border-0"
                >
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="font-semibold text-foreground">
                    {typeof val === 'number'
                      ? val.toLocaleString('en-IN')
                      : String(val)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Original Request</span>
                <Link
                  to={`/requests/${review.requestId}`}
                  className="text-primary hover:underline font-mono"
                >
                  {review.requestId.slice(0, 8)}...
                </Link>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Assigned Reviewer</span>
                <span>{review.reviewer?.email || 'Unassigned'}</span>
              </div>
              {review.reviewedAt && (
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Decision Date</span>
                  <span>{formatDate(review.reviewedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Rule Trace & Decision Action */}
        <div className="space-y-6 lg:col-span-2">
          {/* Review Reasoning */}
          <Card className="border-l-4 border-l-amber-500 shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
                Reason for Human Intervention
              </CardTitle>
              <CardDescription className="text-xs">
                {review.decisionExplanation?.summary ||
                  'One or more business rules triggered a manual review action'}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Rule Trace list */}
          {ruleTrace.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Rule Evaluation Trace
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {ruleTrace.map((r: any, idx: number) => (
                  <div
                    key={r.ruleId || idx}
                    className="p-3 border rounded-lg text-xs flex items-start justify-between space-x-2"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{r.ruleName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {r.message}
                      </p>
                    </div>
                    <StatusBadge
                      status={
                        r.passed
                          ? 'PASS'
                          : r.failureAction === 'MANUAL_REVIEW'
                          ? 'REVIEW'
                          : 'FAIL'
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Decision Form or Completed Decision Card */}
          {isPending ? (
            <Card className="shadow-sm border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center">
                  <UserCheck className="w-4 h-4 mr-2 text-primary" />
                  Reviewer Decision Form
                </CardTitle>
                <CardDescription className="text-xs">
                  Provide your justification and record an official approval or rejection
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Reviewer Notes / Justification
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="e.g. Supporting documents verified. Income tax return and salary slip confirm eligibility."
                    className="w-full p-2.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t p-4 bg-muted/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/reviews')}
                >
                  Cancel
                </Button>

                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={!canDecide || decisionMutation.isPending || !comment.trim()}
                    onClick={() => decisionMutation.mutate({ decision: 'REJECTED' })}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject Request
                  </Button>

                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    disabled={!canDecide || decisionMutation.isPending || !comment.trim()}
                    onClick={() => decisionMutation.mutate({ decision: 'APPROVED' })}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Approve Request
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Completed Decision Record
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="p-3 bg-muted/40 rounded-md space-y-1.5">
                  <p className="font-semibold text-foreground">
                    Reviewer Justification:
                  </p>
                  <p className="text-muted-foreground italic">
                    "{review.reviewerComment || 'No comments provided'}"
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
