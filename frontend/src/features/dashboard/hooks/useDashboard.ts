import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import { useDashboardStore } from '../store/dashboardStore';

export function useDashboard() {
  const { setStats, updateSystemHealth } = useDashboardStore();

  const overviewQuery = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const data = await dashboardApi.getOverview();
      setStats(data);
      return data;
    },
    refetchInterval: 60000,
  });

  const trendsQuery = useQuery({
    queryKey: ['dashboard', 'trends'],
    queryFn: () => dashboardApi.getTrends(),
    refetchInterval: 60000,
  });

  const severityQuery = useQuery({
    queryKey: ['dashboard', 'severity'],
    queryFn: () => dashboardApi.getSeverity(),
    refetchInterval: 60000,
  });

  const servicesQuery = useQuery({
    queryKey: ['dashboard', 'services'],
    queryFn: () => dashboardApi.getServices(),
    refetchInterval: 60000,
  });

  const intelligenceQuery = useQuery({
    queryKey: ['dashboard', 'intelligence'],
    queryFn: () => dashboardApi.getIntelligence(),
    refetchInterval: 60000,
  });

  const healthQuery = useQuery({
    queryKey: ['dashboard', 'health'],
    queryFn: async () => {
      const data = await dashboardApi.getHealthStatus();
      if (data && data.dependencies) {
        Object.entries(data.dependencies).forEach(([name, status]) => {
          updateSystemHealth({
            name: name === 'postgres' ? 'Postgres DB' : name === 'prometheus' ? 'Prometheus Metrics' : name,
            status: status === 'ok' ? 'OK' : 'ERROR',
          });
        });
      }
      return data;
    },
    refetchInterval: 30000,
  });

  const isLoading =
    overviewQuery.isLoading ||
    trendsQuery.isLoading ||
    severityQuery.isLoading ||
    servicesQuery.isLoading ||
    intelligenceQuery.isLoading ||
    healthQuery.isLoading;

  const isError =
    overviewQuery.isError ||
    trendsQuery.isError ||
    severityQuery.isError ||
    servicesQuery.isError ||
    intelligenceQuery.isError ||
    healthQuery.isError;

  return {
    stats: overviewQuery.data || null,
    trends: trendsQuery.data || [],
    severity: severityQuery.data || [],
    services: servicesQuery.data || [],
    intelligence: intelligenceQuery.data || null,
    health: healthQuery.data || null,
    isLoading,
    isError,
    refetch: () => {
      overviewQuery.refetch();
      trendsQuery.refetch();
      severityQuery.refetch();
      servicesQuery.refetch();
      intelligenceQuery.refetch();
      healthQuery.refetch();
    },
  };
}

export default useDashboard;
