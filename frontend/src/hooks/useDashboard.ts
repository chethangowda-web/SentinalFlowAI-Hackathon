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
        interface ReadinessReport {
          status: string;
          database: string;
          eventBus: string;
          groq: string;
          qdrant: string;
          websocket: string;
          notifications: string;
        }
        const res = await apiClient.get<ReadinessReport>('/health/ready');
        const r = res.data;
        const ok = (v: string) => v === 'healthy' ? 'OK' : 'ERROR';
        return [
          { name: 'Postgres DB', status: ok(r.database), usagePercentage: undefined },
          { name: 'Qdrant Vector Cluster', status: (r.qdrant === 'healthy' ? 'OK' : 'ERROR') as 'OK' | 'ERROR', usagePercentage: undefined },
          { name: 'Groq AI', status: ok(r.groq), usagePercentage: undefined },
          { name: 'WebSocket', status: ok(r.websocket), usagePercentage: undefined },
        ];
      } catch {
        return [
          { name: 'Postgres DB', status: 'ERROR' as const, usagePercentage: undefined },
          { name: 'Qdrant Vector Cluster', status: 'ERROR' as const, usagePercentage: undefined },
          { name: 'Groq AI', status: 'ERROR' as const, usagePercentage: undefined },
          { name: 'WebSocket', status: 'ERROR' as const, usagePercentage: undefined },
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
