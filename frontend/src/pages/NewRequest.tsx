// src/pages/NewRequest.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listWorkflows } from '@/services/workflow.service';
import { submitRequest } from '@/services/request.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, Send, Sparkles, Key, AlertCircle } from 'lucide-react';

function generateKey(): string {
  return 'idem-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
}

export default function NewRequest() {
  const navigate = useNavigate();

  const { data: workflowsData, isLoading: isWorkflowsLoading } = useQuery({
    queryKey: ['workflowsList'],
    queryFn: () => listWorkflows({ page: 1, limit: 100 }),
  });

  const workflows = workflowsData?.data ?? [];

  const [workflowId, setWorkflowId] = useState<string>('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(generateKey);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [applicantName, setApplicantName] = useState('Rahul Sharma');
  const [email, setEmail] = useState('rahul@example.com');
  const [age, setAge] = useState<number>(28);
  const [creditScore, setCreditScore] = useState<number>(780);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(55000);
  const [requestedAmount, setRequestedAmount] = useState<number>(300000);

  useEffect(() => {
    if (workflows.length > 0 && !workflowId) {
      setWorkflowId(workflows[0].id);
    }
  }, [workflows, workflowId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowId) {
      toast.error('Please select a workflow');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      workflowId,
      idempotencyKey: idempotencyKey || undefined,
      data: {
        applicantName,
        email,
        age: Number(age),
        creditScore: Number(creditScore),
        monthlyIncome: Number(monthlyIncome),
        requestedAmount: Number(requestedAmount),
      },
    };

    try {
      const res = await submitRequest(payload);
      if (res.data?.isDuplicate) {
        toast.info(`Duplicate request detected! Returned existing ${res.data.referenceNumber}`);
      } else {
        toast.success(`Request created: ${res.data.referenceNumber}`);
      }
      navigate(`/requests/${res.data.requestId}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit request';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyPreset = (preset: 'APPROVAL' | 'REJECTION' | 'REVIEW') => {
    if (preset === 'APPROVAL') {
      setApplicantName('Amit Verma (Approval)');
      setEmail('amit.verma@example.com');
      setAge(29);
      setCreditScore(780);
      setMonthlyIncome(60000);
      setRequestedAmount(400000);
      setIdempotencyKey(generateKey());
      toast.info('Applied preset: High credit score (780) -> Auto-Approval path');
    } else if (preset === 'REJECTION') {
      setApplicantName('Vikas Kumar (Rejection)');
      setEmail('vikas.kumar@example.com');
      setAge(24);
      setCreditScore(520);
      setMonthlyIncome(30000);
      setRequestedAmount(200000);
      setIdempotencyKey(generateKey());
      toast.info('Applied preset: Low credit score (520) -> Rejection path');
    } else if (preset === 'REVIEW') {
      setApplicantName('Priya Nair (Review)');
      setEmail('priya.nair@example.com');
      setAge(31);
      setCreditScore(650);
      setMonthlyIncome(45000);
      setRequestedAmount(350000);
      setIdempotencyKey(generateKey());
      toast.info('Applied preset: Mid credit score (650) -> Manual Review queue');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Submit Business Request"
        description="Trigger configurable workflow evaluation with structured request data"
      />

      {/* Demo Scenario Presets */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">
                Demo Quick Presets
              </p>
              <p className="text-[11px] text-muted-foreground">
                Pre-fill data to demonstrate rule evaluation outcomes:
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs bg-background"
              onClick={() => applyPreset('APPROVAL')}
            >
              ✅ Approval (Score 780)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs bg-background"
              onClick={() => applyPreset('REVIEW')}
            >
              🔍 Review (Score 650)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs bg-background"
              onClick={() => applyPreset('REJECTION')}
            >
              ❌ Reject (Score 520)
            </Button>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Application Details
            </CardTitle>
            <CardDescription className="text-xs">
              Fill in the applicant profile to evaluate business rules
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <div className="flex items-center space-x-2 p-3 text-xs font-medium border rounded-md bg-destructive/10 text-destructive border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Workflow selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Target Workflow
              </label>
              <select
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
                disabled={isWorkflowsLoading}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {workflows.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name} {wf.latestVersion ? `(v${wf.latestVersion})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Form grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Applicant Name
                </label>
                <Input
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Full legal name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="applicant@example.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Age (Years)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Threshold: Minimum 18 years
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Credit Score (300 - 900)
                </label>
                <Input
                  type="number"
                  min="300"
                  max="900"
                  value={creditScore}
                  onChange={(e) => setCreditScore(parseInt(e.target.value, 10) || 0)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  &gt;= 750: Approve, 600-749: Review, &lt; 600: Reject
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Monthly Income (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(parseInt(e.target.value, 10) || 0)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Threshold: Minimum ₹25,000
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Requested Amount (₹)
                </label>
                <Input
                  type="number"
                  min="1000"
                  step="5000"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(parseInt(e.target.value, 10) || 0)}
                  required
                />
              </div>
            </div>

            {/* Idempotency Key */}
            <div className="pt-2 border-t space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center">
                  <Key className="w-3.5 h-3.5 mr-1 text-primary" />
                  Idempotency Key (Duplicate Prevention)
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIdempotencyKey(generateKey())}
                  className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
              </div>
              <Input
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                placeholder="Unique idempotency key"
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Submitting twice with the same key and payload returns the original result without duplicate executions.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t p-4 bg-muted/20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/requests')}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {isSubmitting ? 'Evaluating Workflow...' : 'Submit & Evaluate'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
