// src/pages/RequestDetails.tsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRequest, getRequestHistory } from '@/services/request.service';
import { retryExecution } from '@/services/execution.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  ArrowRight,
  FileText,
  ShieldAlert,
  GitBranch,
} from 'lucide-react';
import { RuleEvaluationResult, StateTransition } from '@/types';

export default function RequestDetails() {
  const { id } = useParams<{ id: string }>();
  const [retrying, setRetrying] = useState(false);

  const {
    data: request,
    isLoading: isRequestLoading,
    error: requestError,
    refetch,
  } = useQuery({
    queryKey: ['request', id],
    queryFn: () => getRequest(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['requestHistory', id],
    queryFn: () => getRequestHistory(id!),
    enabled: !!id,
  });

  if (isRequestLoading) {
    return <LoadingSpinner text="Loading request details..." />;
  }

  if (requestError || !request) {
    return (
      <ErrorState
        title="Request Not Found"
        message="Could not load the requested application details."
        onRetry={() => refetch()}
      />
    );
  }

  const execution = request.executions?.[0];
  const ruleTrace: RuleEvaluationResult[] =
    (execution?.ruleTrace as RuleEvaluationResult[]) || [];
  const retries = execution?.retryRecords || [];

  const handleRetry = async () => {
    if (!execution?.id) return;
    setRetrying(true);
    try {
      await retryExecution(execution.id, 'Manual retry from request details UI');
      toast.success('Retry attempt initiated successfully!');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Retry failed');
    } finally {
      setRetrying(false);
    }
  };

  const isRetryable =
    request.status === 'RETRYING' ||
    execution?.status === 'RETRY' ||
    (execution?.status === 'FAILED' && retries.length < 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title={request.referenceNumber}
        description={`Submitted ${formatDate(request.createdAt)} • Workflow: ${request.workflowDefinition?.name}`}
      >
        <div className="flex items-center space-x-2">
          <StatusBadge status={request.status} />
          {request.status === 'MANUAL_REVIEW' && (
            <Button asChild size="sm" variant="default">
              <Link to="/reviews">
                Review Queue <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          )}
          {isRetryable && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={retrying}
            >
              <RotateCcw
                className={`w-3.5 h-3.5 mr-1.5 ${retrying ? 'animate-spin' : ''}`}
              />
              {retrying ? 'Retrying...' : 'Retry Execution'}
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Data & Execution Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Input Data Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center">
                <FileText className="w-4 h-4 mr-2 text-primary" />
                Submitted Input Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {Object.entries(request.inputData || {}).map(([key, val]) => (
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

          {/* Execution Metadata */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center">
                <GitBranch className="w-4 h-4 mr-2 text-primary" />
                Execution Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Execution ID</span>
                <span className="font-mono">{execution?.id?.slice(0, 13)}...</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Workflow Version</span>
                <span className="font-medium">
                  v{execution?.workflowVersion?.version ?? 1}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Decision</span>
                <span className="font-semibold">{execution?.decision || 'PENDING'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Retry Attempts</span>
                <span className="font-medium">{retries.length}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Started At</span>
                <span>{formatDate(execution?.startedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* State Transition History */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center">
                <Clock className="w-4 h-4 mr-2 text-primary" />
                Lifecycle History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {history.map((t: StateTransition, idx: number) => (
                <div key={t.id || idx} className="relative pl-5 pb-2 last:pb-0">
                  <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary" />
                  {idx !== history.length - 1 && (
                    <div className="absolute left-[3px] top-3.5 w-0.5 h-full bg-border" />
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {t.fromStatus ? `${t.fromStatus} → ${t.toStatus}` : t.toStatus}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(t.createdAt)}
                    </span>
                  </div>
                  {t.reason && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t.reason}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Rule Traces and Decision Explanation */}
        <div className="space-y-6 lg:col-span-2">
          {/* Decision Explanation Banner */}
          <Card className="border-l-4 border-l-primary shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center">
                {execution?.decision === 'APPROVED' ? (
                  <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600" />
                ) : execution?.decision === 'REJECTED' ? (
                  <XCircle className="w-5 h-5 mr-2 text-rose-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
                )}
                Decision Explanation
              </CardTitle>
              <CardDescription className="text-xs">
                {execution?.decision === 'APPROVED'
                  ? 'Request satisfied all approval criteria and verified successfully'
                  : execution?.decision === 'REJECTED'
                  ? 'Request failed one or more mandatory business validation conditions'
                  : 'Request requires manual verification by an authorized reviewer'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              {execution?.errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md">
                  <span className="font-bold">Error message: </span>
                  {execution.errorMessage}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rule Evaluation Trace */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Evaluated Business Rules Trace
              </CardTitle>
              <CardDescription className="text-xs">
                Individual evaluation outcome for each configured rule in Version {execution?.workflowVersion?.version ?? 1}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ruleTrace.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No rule trace recorded for this execution.
                </p>
              ) : (
                ruleTrace.map((rule, idx) => (
                  <div
                    key={rule.ruleId || idx}
                    className={`p-3.5 rounded-lg border text-xs transition-colors ${
                      rule.passed
                        ? 'border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : rule.failureAction === 'MANUAL_REVIEW'
                        ? 'border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20'
                        : 'border-rose-200/80 bg-rose-50/40 dark:bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        {rule.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span className="font-semibold text-foreground text-sm">
                          {rule.ruleName}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          ({rule.ruleId})
                        </span>
                      </div>
                      <StatusBadge
                        status={
                          rule.passed
                            ? 'PASS'
                            : rule.failureAction === 'MANUAL_REVIEW'
                            ? 'REVIEW'
                            : 'FAIL'
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] py-2 px-2.5 rounded bg-background/60 border border-border/40 my-2">
                      <div>
                        <span className="text-muted-foreground block">Field</span>
                        <span className="font-mono font-medium">{rule.field}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Operator</span>
                        <span className="font-mono font-medium">{rule.operator}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Expected</span>
                        <span className="font-mono font-medium">
                          {String(rule.expectedValue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Actual</span>
                        <span className="font-mono font-semibold text-foreground">
                          {String(rule.actualValue)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      {rule.message}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Retry History if any */}
          {retries.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center">
                  <RotateCcw className="w-4 h-4 mr-2 text-primary" />
                  Retry Attempts ({retries.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {retries.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-3 border rounded-md flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold">
                        Attempt #{r.attemptNumber} - {r.status}
                      </p>
                      {r.reason && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {r.reason}
                        </p>
                      )}
                      {r.errorMessage && (
                        <p className="text-[11px] text-rose-600 mt-0.5">
                          Error: {r.errorMessage}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
