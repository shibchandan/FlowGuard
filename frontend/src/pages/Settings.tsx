// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSimulatorMode, updateSimulatorMode } from '@/services/simulator.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Server,
  Zap,
} from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['simulatorMode'],
    queryFn: getSimulatorMode,
  });

  const [selectedMode, setSelectedMode] = useState<string>('SUCCESS');

  useEffect(() => {
    if (data?.mode) {
      setSelectedMode(data.mode);
    }
  }, [data?.mode]);

  const updateMutation = useMutation({
    mutationFn: (mode: string) => updateSimulatorMode(mode),
    onSuccess: (res) => {
      toast.success(`Simulator mode updated to ${res.mode}`);
      queryClient.invalidateQueries({ queryKey: ['simulatorMode'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update simulator mode');
    },
  });

  const modes = [
    {
      id: 'SUCCESS',
      name: 'Normal Success',
      description: 'External verification succeeds immediately. Normal happy-path execution.',
      icon: CheckCircle2,
      badge: 'SUCCESS',
      color: 'border-emerald-300 bg-emerald-50/40 text-emerald-900',
    },
    {
      id: 'TEMPORARY_FAILURE',
      name: 'Temporary Failure / Timeout',
      description: 'External verification fails with a retryable timeout. Demonstrates retry recovery.',
      icon: AlertTriangle,
      badge: 'RETRY',
      color: 'border-amber-300 bg-amber-50/40 text-amber-900',
    },
    {
      id: 'PERMANENT_FAILURE',
      name: 'Permanent Failure',
      description: 'External verification service rejects with a fatal error. Execution fails without retry.',
      icon: XCircle,
      badge: 'FAILED',
      color: 'border-rose-300 bg-rose-50/40 text-rose-900',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings & Simulator"
        description="Configure system parameters and control the external dependency failure simulator for demonstrations"
      />

      {/* Simulator Card */}
      <Card className="shadow-sm border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold flex items-center">
                <Zap className="w-4 h-4 mr-2 text-primary" />
                External Dependency Failure Simulator
              </CardTitle>
              <CardDescription className="text-xs">
                Simulates third-party credit/identity verification responses without requiring external APIs
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Active Mode:</span>
              <StatusBadge status={data?.mode || 'SUCCESS'} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <LoadingSpinner text="Checking simulator status..." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {modes.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMode === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMode(m.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
                        : 'border-border/60 hover:border-border bg-card'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Icon
                          className={`w-5 h-5 ${
                            m.id === 'SUCCESS'
                              ? 'text-emerald-600'
                              : m.id === 'TEMPORARY_FAILURE'
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        />
                        <StatusBadge status={m.badge} />
                      </div>
                      <h4 className="font-semibold text-xs text-foreground mb-1">
                        {m.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {m.description}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t flex justify-end">
                      <Button
                        size="sm"
                        variant={isSelected ? 'default' : 'outline'}
                        className="text-xs h-7 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMode(m.id);
                          updateMutation.mutate(m.id);
                        }}
                        disabled={updateMutation.isPending}
                      >
                        {isSelected && data?.mode === m.id
                          ? 'Active'
                          : 'Activate Mode'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-muted/20 border-t p-4 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            <span>
              Tip: Set mode to <strong>Temporary Failure</strong>, submit a request, witness the <strong>RETRYING</strong> state, then set back to <strong>Success</strong> and click <strong>Retry Execution</strong> to demonstrate self-healing!
            </span>
          </div>
        </CardFooter>
      </Card>

      {/* System Information Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center">
            <Server className="w-4 h-4 mr-2 text-primary" />
            System Architecture
          </CardTitle>
          <CardDescription className="text-xs">
            FlowGuard platform architecture and stack details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b">
            <span className="text-muted-foreground">Architecture Pattern</span>
            <span className="font-medium">Modular Monolith</span>
          </div>
          <div className="flex justify-between py-1.5 border-b">
            <span className="text-muted-foreground">Backend Stack</span>
            <span className="font-medium">Node.js + Express.js + TypeScript</span>
          </div>
          <div className="flex justify-between py-1.5 border-b">
            <span className="text-muted-foreground">Database & ORM</span>
            <span className="font-medium">PostgreSQL 16 + Prisma ORM</span>
          </div>
          <div className="flex justify-between py-1.5 border-b">
            <span className="text-muted-foreground">Frontend Stack</span>
            <span className="font-medium">React 18 + Vite + Tailwind CSS + TanStack Query</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-muted-foreground">Authentication Mechanism</span>
            <span className="font-medium">JWT Bearer Token + bcrypt (10 rounds) + RBAC</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
