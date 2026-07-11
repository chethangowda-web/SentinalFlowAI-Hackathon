import * as React from 'react';
import { motion } from 'framer-motion';
import { useDashboard } from '@/hooks/useDashboard';
import { useRealtime } from '@/hooks/useRealtime';
import { FiltersPanel } from '@/features/dashboard/components/FiltersPanel';
import { EnhancedMetricCard } from '@/components/dashboard/EnhancedMetricCard';
import { GlobalStatusBar } from '@/components/dashboard/GlobalStatusBar';
import { IncidentWarRoom } from '@/components/dashboard/IncidentWarRoom';
import ExecutiveKPIs from '@/components/dashboard/ExecutiveKPIs';
import SREHeatmap from '@/components/dashboard/SREHeatmap';
import { AITimeline } from '@/components/dashboard/AITimeline';
import LogStream from '@/components/dashboard/LogStream';
import { SystemTopology } from '@/components/dashboard/SystemTopology';
import TrendAnalytics from '@/components/dashboard/TrendAnalytics';
import { AIAssistantPanel } from '@/components/dashboard/AIAssistantPanel';
import { AgentPipelineCard } from '@/components/dashboard/AgentPipelineCard';
import { InfraNodeCard } from '@/components/dashboard/InfraNodeCard';
import { IncidentOverviewWidget } from '@/features/dashboard/widgets/IncidentOverviewWidget';
import { RunbooksWidget } from '@/features/dashboard/widgets/RunbooksWidget';
import { NotificationCenterWidget } from '@/features/dashboard/widgets/NotificationCenterWidget';
import { useWidgetStore } from '@/features/dashboard/store/widgetStore';
import { useDashboardStore } from '@/features/dashboard/store/dashboardStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Activity, AlertTriangle, Brain, CheckCircle, Clock, Server, Bot, Radio,
  Shield, Zap, Gauge, TrendingUp, DollarSign, Target, Eye, Cloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeInOut" as const } },
};

function SkeletonCard() {
  return (
    <Card className="bg-card border-border/50 rounded-xl overflow-hidden">
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    </Card>
  );
}

function MetricCardSlim({ title, value, icon: Icon, color, trend, subtitle, onClick }: {
  title: string; value: string | number;   icon: React.ComponentType<{ className?: string; color?: string }>;
  color: string; trend?: string; subtitle?: string; onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        'kpi-card text-left w-full cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-4 h-4" color={color} />
        </div>
        {trend && (
          <span className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
            trend.startsWith('+') ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
          )}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">{title}</p>
      <p className="text-2xl font-bold font-mono tracking-tight text-foreground">{value}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>}
    </motion.button>
  );
}

export function DashboardPage() {
  const { stats, trends, severity, services, intelligence, systemHealth, isLoading, isError, refetch } = useDashboard();
  useRealtime();

  const { layouts } = useWidgetStore();
  const {
    activeWarRoom, warRoomVisible, setWarRoomVisible,
    agents, activityFeed, clearActivityFeed,
  } = useDashboardStore();

  const formattedMttr = React.useMemo(() => {
    if (!stats || !stats.averageResolutionTimeMs) return '14.2m';
    const mins = stats.averageResolutionTimeMs / 1000 / 60;
    if (mins >= 60) return `${(mins / 60).toFixed(1)}h`;
    return `${mins.toFixed(1)}m`;
  }, [stats]);

  const formattedConfidence = React.useMemo(() => {
    if (!stats || !stats.averageAiConfidence) return '98.6%';
    return `${stats.averageAiConfidence.toFixed(1)}%`;
  }, [stats]);

  const kpiMetrics = React.useMemo(() => [
    { title: 'Active Incidents', value: stats?.openIncidents ?? 0, icon: Activity, color: '#2563EB', trend: stats?.openIncidents && stats.openIncidents > 0 ? '+2' : '0', subtitle: 'Requiring attention' },
    { title: 'Critical', value: stats?.criticalIncidents ?? 0, icon: AlertTriangle, color: '#EF4444', trend: stats?.criticalIncidents && stats.criticalIncidents > 0 ? '+1' : '0', subtitle: 'Immediate action needed' },
    { title: 'AI Confidence', value: formattedConfidence, icon: Brain, color: '#A78BFA', trend: '+2.3%', subtitle: 'Decision accuracy' },
    { title: 'MTTR', value: formattedMttr, icon: Clock, color: '#F59E0B', trend: '-8%', subtitle: 'Mean time to resolve' },
    { title: 'SLA Health', value: '98.5%', icon: Shield, color: '#22C55E', trend: '+0.3%', subtitle: 'Service level agreement' },
    { title: 'Cost Saved', value: '$12.4K', icon: DollarSign, color: '#06B6D4', trend: '+22%', subtitle: 'Automation savings' },
    { title: 'Automation', value: '96.8%', icon: Zap, color: '#8B5CF6', trend: '+1.2%', subtitle: 'Auto-resolution rate' },
    { title: 'Risk Score', value: 'Low', icon: Shield, color: '#22C55E', trend: '-5%', subtitle: 'Current risk assessment' },
    { title: 'System Health', value: systemHealth ? `${systemHealth.filter((n) => n.status === 'OK').length}/${systemHealth.length}` : '8/8', icon: Server, color: '#3B82F6', subtitle: 'All nodes operational' },
    { title: 'Qdrant Accuracy', value: '94.2%', icon: Target, color: '#34D399', trend: '+1.8%', subtitle: 'Vector search accuracy' },
    { title: 'Groq Latency', value: '142ms', icon: Gauge, color: '#F59E0B', trend: '-12ms', subtitle: 'Avg inference latency' },
  ], [stats, formattedConfidence, formattedMttr, systemHealth]);

  if (isLoading) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <SkeletonCard />
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 col-span-2 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </motion.div>
    );
  }

  if (isError) {
    return (
      <motion.div
        className="flex flex-col h-[80svh] items-center justify-center space-y-5"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="relative">
          <div className="p-5 rounded-full bg-destructive/10">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <motion.div
            className="absolute -inset-2 rounded-full border border-destructive/20"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
        <div className="text-center space-y-2">
          <p className="text-base font-semibold text-foreground">Unable to load dashboard</p>
          <p className="text-sm text-muted-foreground">Connection interrupted. Our agents are investigating.</p>
        </div>
        <Button onClick={() => refetch()} className="cursor-pointer gap-2">
          <Activity className="w-4 h-4" />
          Retry Connection
        </Button>
      </motion.div>
    );
  }

  if (warRoomVisible && activeWarRoom) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <IncidentWarRoom incident={activeWarRoom} onClose={() => setWarRoomVisible(false)} />
      </motion.div>
    );
  }

  const emptyState = !stats && !isLoading && !isError;

  return (
    <motion.div
      className="space-y-6 relative"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Global Status Bar */}
      <motion.div variants={itemVariants}>
        <GlobalStatusBar />
      </motion.div>

      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Executive Command Center</h1>
          <p className="text-sm text-muted-foreground">Unified telemetry, intelligence, and operational control</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5 glass text-xs px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span className="text-emerald-400 font-semibold">All Systems Nominal</span>
          </Badge>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <FiltersPanel onRefresh={refetch} />
      </motion.div>

      {emptyState ? (
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center justify-center py-20 gap-5"
        >
          <div className="empty-state-illustration">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground">All Clear — Zero Active Incidents</h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Your infrastructure is healthy. AI agents are continuously monitoring for anomalies across all services.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="secondary" className="text-xs px-3 py-1">
              Last incident resolved 4h ago
            </Badge>
            <Button variant="outline" size="sm" className="text-xs cursor-pointer">
              View Recent Activity
            </Button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Row 1: KPI Metric Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {kpiMetrics.map((metric, i) => (
              <MetricCardSlim key={metric.title} {...metric} />
            ))}
          </motion.div>

          {/* Row 2: Executive KPIs + Charts */}
          <motion.div variants={itemVariants}>
            <ExecutiveKPIs />
          </motion.div>

          {/* Row 3: Trend Analytics */}
          <motion.div variants={itemVariants}>
            <TrendAnalytics trends={trends} mttr={stats?.averageResolutionTimeMs} aiConfidence={stats?.averageAiConfidence} />
          </motion.div>

          {/* Row 4: Heatmap */}
          <motion.div variants={itemVariants}>
            <SREHeatmap />
          </motion.div>

          {/* Row 5: Timeline + Logs */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AITimeline />
            <LogStream />
          </motion.div>

          {/* Row 6: Live Agent Pipeline */}
          <motion.div variants={itemVariants}>
            <Card className="bg-card border-border/50 rounded-xl overflow-hidden">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  Live Agent Pipeline
                </CardTitle>
                <Badge variant="outline" className="text-[10px] gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                  {agents.length} Active
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.map((agent) => (
                    <AgentPipelineCard key={agent.id} agent={agent} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Row 7: Infrastructure Nodes */}
          <motion.div variants={itemVariants}>
            <Card className="bg-card border-border/50 rounded-xl overflow-hidden">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-400" />
                  Infrastructure Nodes
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {systemHealth?.length ?? 0} Nodes
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemHealth.map((node) => (
                    <InfraNodeCard key={node.name} node={node} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Row 8: System Topology + Activity Feed */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SystemTopology />
            </div>
            <div className="lg:col-span-1">
              <Card className="bg-card border-border/50 rounded-xl h-[400px] flex flex-col overflow-hidden">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                    Real-Time Activity
                  </CardTitle>
                  <button
                    onClick={clearActivityFeed}
                    className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    Clear
                  </button>
                </CardHeader>
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                  {activityFeed.length > 0 ? (
                    activityFeed.map((event, idx) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="text-xs border-b border-border/30 pb-2 last:border-0 flex gap-2 py-1"
                      >
                        <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap tabular-nums">
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <p className="font-medium text-slate-200 text-[11px]">{event.message}</p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col h-full items-center justify-center text-xs text-muted-foreground gap-3">
                      <div className="p-3 rounded-full bg-accent/30">
                        <Radio className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground/60">Awaiting telemetry events...</p>
                      <p className="text-[10px] text-muted-foreground/40">WebSocket connected and listening</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Row 9: Widgets */}
          <motion.div variants={itemVariants} className="space-y-6">
            {layouts
              .filter((w) => w.visible && ['runbooks', 'notifications', 'incidents'].includes(w.id))
              .sort((a, b) => a.order - b.order)
              .map((w) => {
                switch (w.id) {
                  case 'incidents':
                    return (
                      <div key={w.id}>
                        <IncidentOverviewWidget trendsData={trends} severityData={severity} servicesData={services} />
                      </div>
                    );
                  case 'runbooks':
                    return <RunbooksWidget key={w.id} />;
                  case 'notifications':
                    return <NotificationCenterWidget key={w.id} />;
                  default:
                    return null;
                }
              })}
          </motion.div>
        </>
      )}

      <AIAssistantPanel />
    </motion.div>
  );
}

export default DashboardPage;
