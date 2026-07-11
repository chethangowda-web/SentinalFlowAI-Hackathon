import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export interface Agent {
  id: string;
  name: string;
  status: 'IDLE' | 'BUSY' | 'ERROR' | 'OFFLINE';
  model: string;
  runsCount: number;
  successRate: number;
  lastActive: string;
}

export interface AgentMetrics {
  totalAgents: number;
  activeNow: number;
  avgSuccessRate: number;
  totalExecutions: number;
}

export const agentsApi = {
  list: async (): Promise<Agent[]> => {
    const res = await apiClient.get<{ success: boolean; data: Agent[] }>(endpoints.agents.list);
    return res.data.data;
  },

  getMetrics: async (): Promise<AgentMetrics> => {
    const res = await apiClient.get<{ success: boolean; data: AgentMetrics }>(endpoints.agents.metrics);
    return res.data.data;
  },
};

export default agentsApi;
