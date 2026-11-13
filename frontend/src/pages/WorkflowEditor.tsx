// src/pages/WorkflowEditor.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkflow, getVersions, createVersion, publishVersion } from '@/services/workflow.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
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
import { ErrorState } from '@/components/common/ErrorState';
import { toast } from 'sonner';
import { Plus, Trash2, Save, CheckCircle2, ArrowLeft } from 'lucide-react';
import { RuleConfig, WorkflowConfig } from '@/types';

const DEFAULT_OPERATORS = [
  'GTE',
  'GT',
  'LTE',
  'LT',
  'EQUALS',
  'NOT_EQUALS',
  'IN',
  'NOT_IN',
  'EXISTS',
  'NOT_EXISTS',
];

export default function WorkflowEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: workflow,
    isLoading: isWfLoading,
    error: wfError,
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

  const [rules, setRules] = useState<RuleConfig[]>([]);
  const [maxRetries, setMaxRetries] = useState(3);
  const [inputSchema, setInputSchema] = useState<Record<string, string>>({
    applicantName: 'string',
    email: 'string',
    age: 'number',
    creditScore: 'number',
    monthlyIncome: 'number',
    requestedAmount: 'number',
  });

  // Load existing version configuration into state
  useEffect(() => {
    if (versions.length > 0 && rules.length === 0) {
      const activeVersion =
        versions.find((v) => v.status === 'PUBLISHED') || versions[0];
      const config = (activeVersion?.config || activeVersion?.configuration) as any;
      if (config?.rules) {
        setRules(config.rules);
      }
      if (config?.execution?.maxRetries !== undefined) {
        setMaxRetries(config.execution.maxRetries);
      }
      if (config?.inputSchema) {
        setInputSchema(config.inputSchema);
      }
    }
  }, [versions, rules.length]);

  const saveMutation = useMutation({
    mutationFn: async ({ shouldPublish }: { shouldPublish: boolean }) => {
      const configPayload: WorkflowConfig = {
        inputSchema,
        rules,
        execution: { maxRetries: Number(maxRetries) },
      };

      const newVersion = await createVersion(id!, configPayload);

      if (shouldPublish) {
        await publishVersion(id!, newVersion.id);
      }

      return newVersion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      queryClient.invalidateQueries({ queryKey: ['workflowVersions', id] });
      if (variables.shouldPublish) {
        toast.success('New workflow version created and published!');
      } else {
        toast.success('Draft workflow version saved successfully!');
      }
      navigate(`/workflows/${id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save workflow version');
    },
  });

  if (isWfLoading || isVersionsLoading) {
    return <LoadingSpinner text="Loading editor..." />;
  }

  if (wfError || !workflow) {
    return (
      <ErrorState
        title="Could not load workflow"
        message="Workflow was not found or is inaccessible."
        onRetry={() => navigate('/workflows')}
      />
    );
  }

  const handleAddRule = () => {
    const nextPriority = rules.length + 1;
    const newRule: RuleConfig = {
      id: `RULE_${String(nextPriority).padStart(3, '0')}`,
      name: `New Rule ${nextPriority}`,
      field: 'creditScore',
      operator: 'GTE',
      value: 700,
      priority: nextPriority,
      failureAction: 'REJECT',
      isActive: true,
    };
    setRules([...rules, newRule]);
  };

  const handleRemoveRule = (index: number) => {
    const updated = rules.filter((_, i) => i !== index);
    setRules(updated);
  };

  const handleRuleChange = (index: number, key: keyof RuleConfig, val: any) => {
    const updated = [...rules];
    (updated[index] as any)[key] = val;
    setRules(updated);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Configure Rules: ${workflow.name}`}
        description="Modify business rules and thresholds. Changes will be saved as an immutable new version release."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/workflows/${id}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Button>
      </PageHeader>

      <Card className="shadow-sm">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Business Rules Configuration
            </CardTitle>
            <CardDescription className="text-xs">
              Rules are evaluated strictly in ascending order of priority.
            </CardDescription>
          </div>
          <Button size="sm" onClick={handleAddRule} variant="outline">
            <Plus className="w-4 h-4 mr-1.5" /> Add Rule
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Priority</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Comparison Value</TableHead>
                <TableHead>Failure Action</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule, idx) => (
                <TableRow key={rule.id || idx}>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={rule.priority}
                      onChange={(e) =>
                        handleRuleChange(idx, 'priority', parseInt(e.target.value, 10) || 1)
                      }
                      className="h-8 w-16 text-xs text-center"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={rule.name}
                      onChange={(e) => handleRuleChange(idx, 'name', e.target.value)}
                      placeholder="Rule name"
                      className="h-8 text-xs font-semibold"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={rule.field}
                      onChange={(e) => handleRuleChange(idx, 'field', e.target.value)}
                      placeholder="field"
                      className="h-8 text-xs font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      value={rule.operator}
                      onChange={(e) => handleRuleChange(idx, 'operator', e.target.value)}
                      className="h-8 px-2 rounded-md border border-input bg-background text-xs font-mono"
                    >
                      {DEFAULT_OPERATORS.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={String(rule.value ?? '')}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const num = Number(raw);
                        handleRuleChange(
                          idx,
                          'value',
                          !isNaN(num) && raw !== '' ? num : raw,
                        );
                      }}
                      placeholder="value"
                      className="h-8 text-xs font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      value={rule.failureAction}
                      onChange={(e) =>
                        handleRuleChange(idx, 'failureAction', e.target.value)
                      }
                      className="h-8 px-2 rounded-md border border-input bg-background text-xs font-semibold"
                    >
                      <option value="REJECT">REJECT</option>
                      <option value="MANUAL_REVIEW">MANUAL_REVIEW</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRule(idx)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-3 bg-muted/20">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-muted-foreground">Max Retries:</span>
            <Input
              type="number"
              min="0"
              max="10"
              value={maxRetries}
              onChange={(e) => setMaxRetries(parseInt(e.target.value, 10) || 0)}
              className="h-8 w-20 text-xs text-center"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => saveMutation.mutate({ shouldPublish: false })}
              disabled={saveMutation.isPending}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save Draft
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => saveMutation.mutate({ shouldPublish: true })}
              disabled={saveMutation.isPending}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              {saveMutation.isPending ? 'Publishing...' : 'Save & Publish Version'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
