import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export interface HealthMetric {
  label: string;
  value: string;
  data: number[];
}

export interface RealtimeStatistics {
  connectedClients: number;
  messagesPerSecond: number;
  uptime: string;
}

export const monitoringApi = {
  getHealthMetrics: async (): Promise<HealthMetric[]> => {
    const res = await apiClient.get<{ success: boolean; data: HealthMetric[] }>(endpoints.health.metrics);
    return res.data.data;
  },

  getRealtimeStats: async (): Promise<RealtimeStatistics> => {
    const res = await apiClient.get<{ success: boolean; data: RealtimeStatistics }>('/custom/v1/realtime/statistics');
    return res.data.data;
  },
};

export default monitoringApi;
