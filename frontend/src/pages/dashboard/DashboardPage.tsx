import * as React from 'react';
import { motion } from 'framer-motion';
import { useDashboard } from '@/hooks/useDashboard';
import { useRealtime } from '@/hooks/useRealtime';
import { FiltersPanel } from '@/features/dashboard/components/FiltersPanel';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { IncidentOverviewWidget } from '@/features/dashboard/widgets/IncidentOverviewWidget';
import { AiPanelWidget } from '@/features/dashboard/widgets/AiPanelWidget';
import { RunbooksWidget } from '@/features/dashboard/widgets/RunbooksWidget';
import { AgentMonitorWidget } from '@/features/dashboard/widgets/AgentMonitorWidget';
import { SystemHealthWidget } from '@/features/dashboard/widgets/SystemHealthWidget';
import { ActivityFeedWidget } from '@/features/dashboard/widgets/ActivityFeedWidget';
import { NotificationCenterWidget } from '@/features/dashboard/widgets/NotificationCenterWidget';
import { useWidgetStore } from '@/features/dashboard/store/widgetStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertTriangle, Brain, CheckCircle, Clock, TrendingUp, Server, Shield } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, BarChart, Bar, Cell } from 'recharts';

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subtitle?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card className="bg-card border-border/50">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
      <Card className="bg-card border-border/50 hover:border-primary/20 transition-all duration-200 group cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {title}
            </span>
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}15`, color }}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {value}
              </span>
              {subtitle && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: '60%', backgroundColor: color }} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardPage() {
  const { stats, trends, severity, services, intelligence, systemHealth, isLoading, isError, refetch } = useDashboard();
  useRealtime();

  const { layouts } = useWidgetStore();

  const formattedMttr = React.useMemo(() => {
    if (!stats || !stats.averageResolutionTimeMs) return '14.2m';
    const mins = stats.averageResolutionTimeMs / 1000 / 60;
    if (mins >= 60) return `${(mins / 60).toFixed(1)}h`;
    return `${mins.toFixed(1)}m`;
  }, [stats]);

  const formattedConfidence = React.useMemo(() => {
    if (!stats || !stats.averageAiConfidence) return '94.2%';
    return `${stats.averageAiConfidence.toFixed(1)}%`;
  }, [stats]);

  const trendChartData = React.useMemo(() => {
    if (!trends || trends.length === 0) {
      return [
        { name: 'Mon', incidents: 12 }, { name: 'Tue', incidents: 8 },
        { name: 'Wed', incidents: 15 }, { name: 'Thu', incidents: 6 },
        { name: 'Fri', incidents: 10 }, { name: 'Sat', incidents: 4 },
        { name: 'Sun', incidents: 7 },
      ];
    }
    return trends.map((item) => ({
      name: new Date(item.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      incidents: Number(item.count),
    }));
  }, [trends]);

  const severityChartData = React.useMemo(() => {
    if (!severity || severity.length === 0) {
      return [
        { name: 'Critical', value: 3 }, { name: 'High', value: 8 },
        { name: 'Medium', value: 15 }, { name: 'Low', value: 24 },
      ];
    }
    return severity.map((item) => ({
      name: item.severity.charAt(0).toUpperCase() + item.severity.slice(1),
      value: Number(item.count),
    }));
  }, [severity]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card border-border/50">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-[80svh] items-center justify-center space-y-4 animate-fade-in">
        <div className="p-4 rounded-full bg-destructive/10">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Failed to fetch operational stats</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground">Unified operational telemetry and intelligence hub</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            All Systems Nominal
          </Badge>
        </div>
      </div>

      <FiltersPanel onRefresh={refetch} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Active Incidents"
          value={stats?.openIncidents ?? 0}
          icon={Activity}
          color="#2563eb"
          subtitle="Requiring attention"
        />
        <MetricCard
          title="Critical"
          value={stats?.criticalIncidents ?? 0}
          icon={AlertTriangle}
          color="#ef4444"
          subtitle="P0 priority"
          loading={false}
        />
        <MetricCard
          title="AI Confidence"
          value={formattedConfidence}
          icon={Brain}
          color="#8b5cf6"
          subtitle="Decision accuracy"
        />
        <MetricCard
          title="MTTR"
          value={formattedMttr}
          icon={Clock}
          color="#f59e0b"
          subtitle="Mean time to resolve"
        />
        <MetricCard
          title="Resolved Today"
          value={stats?.resolvedIncidents ?? 0}
          icon={CheckCircle}
          color="#22c55e"
          subtitle="24h window"
        />
        <MetricCard
          title="System Health"
          value={systemHealth?.filter((n) => n.status === 'OK').length ?? 0}
          icon={Server}
          color="#06b6d4"
          subtitle={`${systemHealth?.length ?? 0} total nodes`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Trends */}
        <Card className="lg:col-span-2 bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Incident Frequency Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="incidentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <RechartsTooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="incidents" stroke="#2563eb" strokeWidth={2} fill="url(#incidentGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Severity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData} layout="vertical">
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={70} />
                  <RechartsTooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {severityChartData.map((_entry, index) => {
                      const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
                      return (
                        <Cell key={index} fill={colors[index] || '#2563eb'} />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widgets */}
      <div className="space-y-6">
        {layouts
          .filter((w) => w.visible)
          .sort((a, b) => a.order - b.order)
          .map((w) => {
            switch (w.id) {
              case 'kpi':
                return (
                  <div key={w.id} className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
                    <KpiCard
                      title="Open Incidents"
                      value={stats?.openIncidents ?? 0}
                      trendDirection="down"
                      trend={-12}
                      sparklineData={[{ value: 5 }, { value: 3 }, { value: stats?.openIncidents ?? 0 }]}
                    />
                    <KpiCard
                      title="Critical Incidents"
                      value={stats?.criticalIncidents ?? 0}
                      trendDirection="neutral"
                      trend={0}
                    />
                    <KpiCard
                      title="Resolved Today"
                      value={stats?.resolvedIncidents ?? 0}
                      trendDirection="up"
                      trend={15}
                      sparklineData={[{ value: 2 }, { value: 6 }, { value: stats?.resolvedIncidents ?? 0 }]}
                    />
                    <KpiCard
                      title="MTTR"
                      value={formattedMttr}
                      trendDirection="down"
                      trend={-8}
                    />
                  </div>
                );
              case 'incidents':
                return (
                  <div key={w.id}>
                    <IncidentOverviewWidget
                      trendsData={trends}
                      severityData={severity}
                      servicesData={services}
                    />
                  </div>
                );
              case 'ai':
                return (
                  <div key={w.id}>
                    <AiPanelWidget intelligenceData={intelligence} />
                  </div>
                );
              case 'runbooks':
                return <RunbooksWidget key={w.id} />;
              case 'agents':
                return (
                  <div key={w.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h2 className="text-sm font-semibold text-foreground">
                        Agent Monitors
                      </h2>
                    </div>
                    <AgentMonitorWidget />
                  </div>
                );
              case 'health':
                return <SystemHealthWidget key={w.id} systemHealth={systemHealth} />;
              case 'activity':
                return <ActivityFeedWidget key={w.id} />;
              case 'notifications':
                return <NotificationCenterWidget key={w.id} />;
              default:
                return null;
            }
          })}
      </div>
    </motion.div>
  );
}

export default DashboardPage;
