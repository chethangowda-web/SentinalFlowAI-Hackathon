import { apiClient } from './client';
import { endpoints } from './endpoints';

export interface DashboardStats {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  averageResolutionTimeMs: number;
  averageAiConfidence: number;
  incidentsToday: number;
  incidentsThisWeek: number;
  incidentsThisMonth: number;
}

export interface IncidentTrendItem {
  day: string;
  count: number;
}

export interface SeverityStatsItem {
  severity: string;
  priority: string;
  count: number;
}

export interface ServiceStatsItem {
  service: string;
  count: number;
}

export const dashboardApi = {
  getOverviewStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<{ success: boolean; data: DashboardStats }>(endpoints.dashboard.overview);
    return res.data.data;
  },

  getTrends: async (): Promise<IncidentTrendItem[]> => {
    const res = await apiClient.get<{ success: boolean; data: IncidentTrendItem[] }>(endpoints.dashboard.trends);
    return res.data.data;
  },

  getSeverity: async (): Promise<SeverityStatsItem[]> => {
    const res = await apiClient.get<{ success: boolean; data: SeverityStatsItem[] }>(endpoints.dashboard.severity);
    return res.data.data;
  },

  getServices: async (): Promise<ServiceStatsItem[]> => {
    const res = await apiClient.get<{ success: boolean; data: ServiceStatsItem[] }>(endpoints.dashboard.services);
    return res.data.data;
  },
};

export default dashboardApi;
