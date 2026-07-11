import { apiClient } from './client';
import { endpoints } from './endpoints';

export interface TimelineEvent {
  id: string;
  incidentId: string;
  actor: string;
  action: string;
  newValue?: string;
  notes?: string;
  timestamp: string;
}

export interface Note {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  incidentId: string;
  actor: string;
  action: string;
  timestamp: string;
  details?: Record<string, any>;
}

export const timelineApi = {
  fetchTimeline: async (id: string): Promise<TimelineEvent[]> => {
    const res = await apiClient.get<{ success: boolean; data: TimelineEvent[] }>(endpoints.incidents.timeline(id));
    return res.data.data;
  },

  fetchNotes: async (id: string): Promise<Note[]> => {
    const res = await apiClient.get<{ success: boolean; data: Note[] }>(endpoints.incidents.notes(id));
    return res.data.data;
  },

  addNote: async (id: string, content: string): Promise<Note> => {
    const res = await apiClient.post<{ success: boolean; data: Note }>(endpoints.incidents.notes(id), {
      content,
      author: 'operator',
    });
    return res.data.data;
  },

  fetchAudit: async (id: string): Promise<AuditLogItem[]> => {
    const res = await apiClient.get<{ success: boolean; data: AuditLogItem[] }>(`/custom/v1/incidents/${id}/audit`);
    return res.data.data;
  },
};

export default timelineApi;
