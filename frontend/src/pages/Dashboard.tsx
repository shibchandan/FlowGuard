// src/pages/Dashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getDashboardSummary, getRecentActivity } from '@/services/dashboard.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  PlusCircle,
  Activity,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const {
    data: summary,
    isLoading: isSummaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: getDashboardSummary,
    refetchInterval: 10000,
  });

  const {
    data: activityData,
    isLoading: isActivityLoading,
    error: activityError,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: () => getRecentActivity(1, 8),
    refetchInterval: 10000,
  });

  if (isSummaryLoading && isActivityLoading) {
    return <LoadingSpinner text="Loading dashboard metrics..." />;
  }

  if (summaryError || activityError) {
    return (
      <ErrorState
        title="Dashboard Error"
        message="Could not load dashboard statistics from the server."
        onRetry={() => {
          refetchSummary();
          refetchActivity();
        }}
      />
    );
  }

  const statCards = [
    {
      title: 'Total Requests',
      value: summary?.totalRequests ?? 0,
      icon: FileText,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Approved',
      value: summary?.approvedRequests ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Rejected',
      value: summary?.rejectedRequests ?? 0,
      icon: XCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-500/10',
    },
    {
      title: 'Pending Reviews',
      value: summary?.pendingReviews ?? 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Failed Executions',
      value: summary?.failedExecutions ?? 0,
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      title: 'Retrying',
      value: summary?.retryingRequests ?? 0,
      icon: RotateCcw,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
    },
  ];

  const chartData = [
    { name: 'Approved', value: summary?.approvedRequests ?? 0, color: '#10b981' },
    { name: 'Rejected', value: summary?.rejectedRequests ?? 0, color: '#f43f5e' },
    { name: 'Pending Review', value: summary?.pendingReviews ?? 0, color: '#f59e0b' },
    { name: 'Failed', value: summary?.failedExecutions ?? 0, color: '#ef4444' },
    { name: 'Retrying', value: summary?.retryingRequests ?? 0, color: '#3b82f6' },
  ].filter((item) => item.value > 0);

  const activities = activityData?.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Dashboard"
        description="Real-time monitoring of workflow executions, requests, and automated decisions"
      >
        <Button asChild size="sm">
          <Link to="/requests/new">
            <PlusCircle className="w-4 h-4 mr-2" />
            Submit Request
          </Link>
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </span>
                  <div className={`p-1.5 rounded-md ${stat.bg} ${stat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outcome Breakdown Chart */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Execution Outcomes
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of current processing states
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center pt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [value, 'Requests']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-muted-foreground">
                No request executions recorded yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Recent Activity
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time audit log of system and workflow events
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/audit">
                View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            {activities.length > 0 ? (
              <div className="divide-y divide-border/60">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="py-3 flex items-start justify-between space-x-3 text-xs"
                  >
                    <div className="flex items-start space-x-2.5">
                      <div className="p-1 rounded-full bg-primary/10 text-primary mt-0.5">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {act.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {act.entityType} ID: {act.entityId.slice(0, 8)}...
                          {Boolean(act.metadata?.decision) && (
                            <span className="ml-1 font-medium text-foreground">
                              (Decision: {String(act.metadata?.decision)})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No recent activity logged
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
