import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export interface AgentBackend {
  id: string;
  name: string;
  status: string;
  model: string;
  metrics: { runs: number; successRate: number; avgLatency: number };
  lastActive: string;
}

export interface Agent {
  id: string;
  name: string;
  status: 'IDLE' | 'BUSY' | 'ERROR' | 'OFFLINE';
  model: string;
  runsCount: number;
  successRate: number;
  lastActive: string;
}

export interface AgentMetricsBackend {
  totalAgents: number;
  activeAgents: number;
  totalRuns: number;
  averageSuccessRate: number;
  averageLatencyMs: number;
}

export interface AgentMetrics {
  totalAgents: number;
  activeNow: number;
  avgSuccessRate: number;
  totalExecutions: number;
}

function mapAgent(b: AgentBackend): Agent {
  return {
    id: b.id,
    name: b.name,
    status: b.status as Agent['status'],
    model: b.model,
    runsCount: b.metrics?.runs ?? 0,
    successRate: Math.round(b.metrics?.successRate ?? 100),
    lastActive: b.lastActive,
  };
}

export const agentsApi = {
  list: async (): Promise<Agent[]> => {
    const res = await apiClient.get<{ success: boolean; data: AgentBackend[] }>(endpoints.agents.list);
    return (res.data.data || []).map(mapAgent);
  },

  getMetrics: async (): Promise<AgentMetrics> => {
    const res = await apiClient.get<{ success: boolean; data: AgentMetricsBackend }>(endpoints.agents.metrics);
    const d = res.data.data;
    return {
      totalAgents: d?.totalAgents ?? 0,
      activeNow: d?.activeAgents ?? 0,
      avgSuccessRate: d?.averageSuccessRate ?? 100,
      totalExecutions: d?.totalRuns ?? 0,
    };
  },
};

export default agentsApi;
