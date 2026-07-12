import { apiClient } from './client';
import { endpoints } from './endpoints';

export interface BackendIncident {
  incidentId: string;
  service: string;
  application: string;
  environment: string;
  severity: string;
  priority: string;
  status: string;
  title: string;
  summary: string;
  description: string;
  rawLogs: string;
  confidenceScore: number;
  rootCause: string;
  aiReport: Record<string, unknown> | null;
  recommendations: Record<string, unknown> | null;
  similarIncidents: Record<string, unknown>[] | null;
  metadata: Record<string, unknown> | null;
  assignedEngineer: string | null;
  resolution: string | null;
  timeline: Record<string, unknown>[] | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
}

export interface Incident {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED' | 'CLOSED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  service: string;
  environment: string;
  assignedTeam?: string;
  assigneeId?: string;
  summary?: string;
  rootCause?: string;
  confidenceScore?: number;
  version?: number;
}

function mapBackendToFrontend(b: BackendIncident): Incident {
  return {
    id: b.incidentId,
    title: b.title,
    description: b.description,
    status: b.status as Incident['status'],
    severity: b.severity.toUpperCase() as Incident['severity'],
    createdAt: b.createdAt,
    service: b.service,
    environment: b.environment,
    assignedTeam: b.assignedEngineer || undefined,
    assigneeId: b.assignedEngineer || undefined,
    summary: b.summary,
    rootCause: b.rootCause,
    confidenceScore: b.confidenceScore,
    version: b.version,
  };
}

export const incidentApi = {
  getIncidents: async (filters?: Record<string, any>): Promise<Incident[]> => {
    const res = await apiClient.get<{ success: boolean; data: BackendIncident[] }>(endpoints.incidents.list, {
      params: filters,
    });
    return (res.data.data || []).map(mapBackendToFrontend);
  },

  getIncident: async (id: string): Promise<Incident> => {
    const res = await apiClient.get<{ success: boolean; data: BackendIncident }>(endpoints.incidents.byId(id));
    return mapBackendToFrontend(res.data.data);
  },

  createIncident: async (payload: Record<string, any>): Promise<Incident> => {
    const res = await apiClient.post<{ success: boolean; incident: BackendIncident }>(endpoints.incidents.create, payload);
    return mapBackendToFrontend(res.data.incident);
  },

  assignIncident: async (id: string, engineerId: string): Promise<Incident> => {
    const res = await apiClient.patch<{ success: boolean; data: Incident }>(`/custom/v1/incidents/${id}/assign`, {
      engineerId,
      engineerName: engineerId,
      assignedBy: 'operator',
      version: 1,
    });
    return res.data.data as any;
  },

  acknowledgeIncident: async (id: string): Promise<Incident> => {
    const res = await apiClient.patch<{ success: boolean; data: BackendIncident }>(`/custom/v1/incidents/${id}/status`, {
      status: 'INVESTIGATING',
      actor: 'operator',
      version: 1,
    });
    return mapBackendToFrontend(res.data.data);
  },

  resolveIncident: async (id: string, notes?: string): Promise<Incident> => {
    const res = await apiClient.patch<{ success: boolean; data: BackendIncident }>(endpoints.incidents.resolve(id), {
      resolvedBy: 'operator',
      summary: notes || 'Resolved via Operator Dashboard',
      rootCause: notes || 'Diagnosed and remediated',
      correctiveActions: 'Applied fix',
      preventiveActions: 'Added monitoring alert',
      version: 1,
    });
    return mapBackendToFrontend(res.data.data);
  },

  closeIncident: async (id: string, notes?: string): Promise<Incident> => {
    const res = await apiClient.patch<{ success: boolean; data: BackendIncident }>(endpoints.incidents.close(id), {
      closedBy: 'operator',
      notes: notes || 'Closed via Operator Dashboard',
      version: 1,
    });
    return mapBackendToFrontend(res.data.data);
  },

  deleteIncident: async (id: string): Promise<void> => {
    await apiClient.delete(`/custom/v1/incidents/${id}`, {
      data: {
        deletedBy: 'operator',
        version: 1,
      }
    });
  },
};

export default incidentApi;
