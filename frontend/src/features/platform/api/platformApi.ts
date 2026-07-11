import { apiClient } from '@/api/client';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  uptime?: number;
  version?: string;
}

export interface DependencyHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'offline';
  latency?: number;
  message?: string;
  lastChecked: string;
}

export interface RealtimeMetric {
  service: string;
  value: number;
  unit: string;
  timestamp: string;
}

export const PLATFORM_SERVICES = [
  'PostgreSQL',
  'Mastra',
  'Qdrant',
  'Groq',
  'Enkrypt AI',
  'WebSocket',
  'Prometheus',
  'Grafana',
  'Loki',
  'Jaeger',
] as const;

export const platformApi = {
  getReady: async (): Promise<HealthStatus> => {
    const res = await apiClient.get<HealthStatus>('/health/ready');
    return res.data;
  },

  getDependencies: async (): Promise<DependencyHealth[]> => {
    const res = await apiClient.get<{ success: boolean; data: DependencyHealth[] } | DependencyHealth[]>('/health/dependencies');
    if (Array.isArray(res.data)) return res.data;
    return (res.data as { success: boolean; data: DependencyHealth[] }).data;
  },

  getRealtimeMetrics: async (): Promise<RealtimeMetric[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: RealtimeMetric[] }>('/custom/v1/realtime/metrics');
      return res.data.data;
    } catch {
      const res = await apiClient.get<{ success: boolean; data: RealtimeMetric[] }>('/custom/v1/realtime/health');
      return res.data.data;
    }
  },
};

export default platformApi;
