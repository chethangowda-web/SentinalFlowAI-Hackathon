import { apiClient } from '@/api/client';
import { DashboardStats, IncidentTrendItem, SeverityStatsItem, ServiceStatsItem } from '../types';

export const dashboardApi = {
  getOverview: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<{ success: boolean; data: DashboardStats }>('/custom/v1/dashboard/overview');
    return res.data.data;
  },

  getTrends: async (): Promise<IncidentTrendItem[]> => {
    const res = await apiClient.get<{ success: boolean; data: IncidentTrendItem[] }>('/custom/v1/dashboard/trends');
    return res.data.data;
  },

  getSeverity: async (): Promise<SeverityStatsItem[]> => {
    const res = await apiClient.get<{ success: boolean; data: SeverityStatsItem[] }>('/custom/v1/dashboard/severity');
    return res.data.data;
  },

  getServices: async (): Promise<ServiceStatsItem[]> => {
    const res = await apiClient.get<{ success: boolean; data: ServiceStatsItem[] }>('/custom/v1/dashboard/services');
    return res.data.data;
  },

  getIntelligence: async (): Promise<any> => {
    const res = await apiClient.get<{ success: boolean; data: any }>('/custom/v1/intelligence/dashboard');
    return res.data.data;
  },

  getHealthStatus: async (): Promise<any> => {
    const res = await apiClient.get<any>('/health/ready');
    return res.data;
  },
};

export default dashboardApi;
