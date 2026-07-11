import { apiClient } from './client';
import { endpoints } from './endpoints';

export interface Runbook {
  id: string;
  name: string;
  description?: string;
  service: string;
  triggerEvent: string;
  severity: string;
  enabled: boolean;
  approvalRequired: boolean;
}

export interface RunbookExecution {
  id: string;
  runbookId: string;
  incidentId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime: string;
  endTime?: string;
  triggeredBy: string;
}

export const runbookApi = {
  listRunbooks: async (): Promise<Runbook[]> => {
    const res = await apiClient.get<Runbook[]>(endpoints.runbooks.list);
    return res.data;
  },

  executeRunbook: async (runbookId: string, incidentId: string): Promise<{ success: boolean; executionId: string }> => {
    const res = await apiClient.post<{ success: boolean; executionId: string }>(endpoints.runbooks.execute(runbookId), {
      incidentId,
      environment: 'production',
      triggeredBy: 'user',
    });
    return res.data;
  },

  executionHistory: async (runbookId: string): Promise<RunbookExecution[]> => {
    const res = await apiClient.get<{ history: RunbookExecution[] }>(endpoints.runbooks.history(runbookId));
    return res.data.history;
  },
};

export default runbookApi;
