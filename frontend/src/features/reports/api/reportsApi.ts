import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { Incident } from '@/api/incident';

export interface ReportData {
  totalIncidents: number;
  resolvedIncidents: number;
  openIncidents: number;
  criticalIncidents: number;
  averageResolutionTimeMs: number;
  averageAiConfidence: number;
  incidents: Incident[];
  generatedAt: string;
  dateRange: { start: string; end: string };
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
}

export const reportsApi = {
  getReportData: async (filters: ReportFilters): Promise<ReportData> => {
    const [incidentsRes, intelligenceRes] = await Promise.all([
      apiClient.get<{ success: boolean; data: Incident[] }>(endpoints.incidents.list, {
        params: { startDate: filters.startDate, endDate: filters.endDate },
      }),
      apiClient.get<{ success: boolean; data: any }>(endpoints.intelligence.dashboard),
    ]);

    const incidents = incidentsRes.data.data;
    const intelligence = intelligenceRes.data.data;

    const resolved = incidents.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED');
    const open = incidents.filter((i) => i.status === 'OPEN' || i.status === 'ACKNOWLEDGED' || i.status === 'INVESTIGATING');
    const critical = incidents.filter((i) => i.severity === 'CRITICAL');

    let totalResolutionMs = 0;
    for (const inc of resolved) {
      if (inc.createdAt) {
        const resolvedAt = inc.createdAt;
        const created = new Date(inc.createdAt).getTime();
        const resolvedTime = new Date(resolvedAt).getTime();
        totalResolutionMs += resolvedTime - created;
      }
    }

    return {
      totalIncidents: incidents.length,
      resolvedIncidents: resolved.length,
      openIncidents: open.length,
      criticalIncidents: critical.length,
      averageResolutionTimeMs: resolved.length > 0 ? totalResolutionMs / resolved.length : 0,
      averageAiConfidence: intelligence?.confidence ?? 0,
      incidents,
      generatedAt: new Date().toISOString(),
      dateRange: { start: filters.startDate, end: filters.endDate },
    };
  },
};

export default reportsApi;
