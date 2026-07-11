import * as React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useRealtimeDashboard } from '../hooks/useRealtimeDashboard';
import { FiltersPanel } from '../components/FiltersPanel';
import { KpiCard } from '../components/KpiCard';
import { IncidentOverviewWidget } from '../widgets/IncidentOverviewWidget';
import { AiPanelWidget } from '../widgets/AiPanelWidget';
import { RunbooksWidget } from '../widgets/RunbooksWidget';
import { AgentMonitorWidget } from '../widgets/AgentMonitorWidget';
import { SystemHealthWidget } from '../widgets/SystemHealthWidget';
import { ActivityFeedWidget } from '../widgets/ActivityFeedWidget';
import { NotificationCenterWidget } from '../widgets/NotificationCenterWidget';
import { useWidgetStore } from '../store/widgetStore';
import { useDashboardStore } from '../store/dashboardStore';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';

export function DashboardPage() {
  const { stats, trends, severity, services, intelligence, isLoading, isError, refetch } = useDashboard();
  const { systemHealth } = useDashboardStore();
  
  useRealtimeDashboard(refetch);

  const { layouts } = useWidgetStore();

  const formattedMttr = React.useMemo(() => {
    if (!stats || !stats.averageResolutionTimeMs) return '14.2m';
    const mins = stats.averageResolutionTimeMs / 1000 / 60;
    return `${mins.toFixed(1)}m`;
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex h-[80svh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-[80svh] items-center justify-center space-y-4">
        <p className="text-sm text-red-400 font-semibold font-mono">Failed to fetch operational stats</p>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const renderWidget = (id: string) => {
    switch (id) {
      case 'kpi':
        return (
          <div key={id} className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
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
              title="Mean Time to Resolve (MTTR)"
              value={formattedMttr}
              trendDirection="down"
              trend={-8}
            />
          </div>
        );
      case 'incidents':
        return (
          <div key={id} className="space-y-3">
            <IncidentOverviewWidget
              trendsData={trends}
              severityData={severity}
              servicesData={services}
            />
          </div>
        );
      case 'ai':
        return (
          <div key={id} className="space-y-3">
            <AiPanelWidget intelligenceData={intelligence} />
          </div>
        );
      case 'runbooks':
        return <RunbooksWidget key={id} />;
      case 'agents':
        return (
          <div key={id} className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mastra Agent Monitors
              </h2>
            </div>
            <AgentMonitorWidget />
          </div>
        );
      case 'health':
        return <SystemHealthWidget key={id} systemHealth={systemHealth} />;
      case 'activity':
        return <ActivityFeedWidget key={id} />;
      case 'notifications':
        return <NotificationCenterWidget key={id} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 font-mono">Enterprise Dashboard</h1>
        <p className="text-xs text-muted-foreground">Unified operational telemetry and intelligence hub</p>
      </div>

      <FiltersPanel onRefresh={refetch} />

      <div className="space-y-6">
        {layouts
          .filter((w) => w.visible)
          .sort((a, b) => a.order - b.order)
          .map((w) => renderWidget(w.id))}
      </div>
    </div>
  );
}

export default DashboardPage;
