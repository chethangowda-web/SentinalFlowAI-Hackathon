import { apiClient } from './client';
import { endpoints } from './endpoints';

export interface Incident {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  service: string;
  environment: string;
  assignedTeam?: string;
  assigneeId?: string;
}

export const incidentApi = {
  getIncidents: async (filters?: Record<string, any>): Promise<Incident[]> => {
    const res = await apiClient.get<{ success: boolean; data: Incident[] }>(endpoints.incidents.list, {
      params: filters,
    });
    return res.data.data;
  },

  getIncident: async (id: string): Promise<Incident> => {
    const res = await apiClient.get<{ success: boolean; data: Incident }>(endpoints.incidents.byId(id));
    return res.data.data;
  },

  createIncident: async (payload: Omit<Incident, 'id' | 'createdAt' | 'status'>): Promise<Incident> => {
    const res = await apiClient.post<{ success: boolean; incident: Incident }>(endpoints.incidents.create, payload);
    return res.data.incident;
  },

  updateIncident: async (id: string, payload: Partial<Incident>): Promise<Incident> => {
    const res = await apiClient.patch<{ success: boolean; data: Incident }>(`/custom/v1/incidents/${id}`, payload);
    return res.data.data;
  },

  assignIncident: async (id: string, assigneeId: string): Promise<Incident> => {
    const res = await apiClient.patch<{ success: boolean; data: Incident }>(`/custom/v1/incidents/${id}/assign`, {
      assigneeId,
      assignedBy: 'operator',
      version: 1,
    });
    return res.data.data;
  },

  acknowledgeIncident: async (id: string): Promise<Incident> => {
    const res = await apiClient.patch<{ success: boolean; data: Incident }>(`/custom/v1/incidents/${id}/status`, {
      status: 'ACKNOWLEDGED',
      updatedBy: 'operator',
      version: 1,
    });
    return res.data.data;
  },

  resolveIncident: async (id: string, notes?: string): Promise<Incident> => {
    const res = await apiClient.patch<{ success: boolean; data: Incident }>(endpoints.incidents.resolve(id), {
      notes: notes || 'Resolved via Operator Dashboard',
      resolvedBy: 'operator',
      version: 1,
    });
    return res.data.data;
  },

  closeIncident: async (id: string, feedback?: string): Promise<Incident> => {
    const res = await apiClient.patch<{ success: boolean; data: Incident }>(endpoints.incidents.close(id), {
      feedback: feedback || 'Closed via Operator Dashboard',
      closedBy: 'operator',
      version: 1,
    });
    return res.data.data;
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
