import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard';
import { apiClient } from '@/api/client';
import { SystemHealthNode } from '@/features/dashboard/types';

export function useDashboard() {
  const overviewQuery = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => dashboardApi.getOverviewStats(),
    refetchInterval: 30000,
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
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: any }>('/custom/v1/intelligence/dashboard');
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  const healthQuery = useQuery<SystemHealthNode[]>({
    queryKey: ['dashboard', 'health'],
    queryFn: async (): Promise<SystemHealthNode[]> => {
      try {
        const res = await apiClient.get<{ status: string; dependencies: any }>('/health/ready');
        const deps = res.data.dependencies;
        return [
          { name: 'Postgres DB', status: (deps.postgres === 'healthy' ? 'OK' : 'ERROR') as 'OK' | 'ERROR', usagePercentage: undefined },
          { name: 'Qdrant Vector Cluster', status: (deps.qdrant === 'healthy' ? 'OK' : 'ERROR') as 'OK' | 'ERROR', usagePercentage: undefined },
          { name: 'Prometheus', status: (deps.prometheus === 'healthy' ? 'OK' : 'ERROR') as 'OK' | 'ERROR', usagePercentage: undefined },
          { name: 'Cache', status: (deps.cache === 'healthy' ? 'OK' : 'ERROR') as 'OK' | 'ERROR', usagePercentage: undefined },
        ];
      } catch {
        return [
          { name: 'Postgres DB', status: 'ERROR' as const, usagePercentage: undefined },
          { name: 'Qdrant Vector Cluster', status: 'ERROR' as const, usagePercentage: undefined },
          { name: 'Prometheus', status: 'ERROR' as const, usagePercentage: undefined },
          { name: 'Cache', status: 'ERROR' as const, usagePercentage: undefined },
        ];
      }
    },
    refetchInterval: 30000,
  });

  const isLoading =
    overviewQuery.isLoading ||
    trendsQuery.isLoading ||
    severityQuery.isLoading ||
    servicesQuery.isLoading ||
    intelligenceQuery.isLoading;

  const isError =
    overviewQuery.isError ||
    trendsQuery.isError ||
    severityQuery.isError ||
    servicesQuery.isError ||
    intelligenceQuery.isError;

  return {
    stats: overviewQuery.data || null,
    trends: trendsQuery.data || [],
    severity: severityQuery.data || [],
    services: servicesQuery.data || [],
    intelligence: intelligenceQuery.data || null,
    systemHealth: healthQuery.data || [],
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
