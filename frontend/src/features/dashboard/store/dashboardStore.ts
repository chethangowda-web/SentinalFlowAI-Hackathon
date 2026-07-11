import { create } from 'zustand';
import { DashboardStats, AgentStatusItem, SystemHealthNode, ActivityEvent } from '../types';

interface DashboardState {
  stats: DashboardStats | null;
  agents: AgentStatusItem[];
  systemHealth: SystemHealthNode[];
  activityFeed: ActivityEvent[];
  unreadAlertsCount: number;
  setStats: (stats: DashboardStats) => void;
  updateAgentStatus: (agent: Partial<AgentStatusItem> & { id: string }) => void;
  updateSystemHealth: (node: Partial<SystemHealthNode> & { name: string }) => void;
  addActivityEvent: (event: ActivityEvent) => void;
  setUnreadAlertsCount: (count: number) => void;
  clearActivityFeed: () => void;
}

const initialAgents: AgentStatusItem[] = [
  { id: 'agent-1', name: 'Monitoring Agent', status: 'IDLE', health: 'HEALTHY', latencyMs: 120, tokenUsage: 2500, currentTask: 'Telemetry ingestion check', lastActive: 'Just now', model: 'gpt-4o' },
  { id: 'agent-2', name: 'Prediction Agent', status: 'IDLE', health: 'HEALTHY', latencyMs: 340, tokenUsage: 12000, currentTask: 'Anomaly forecast', lastActive: '2 mins ago', model: 'gpt-4o-mini' },
  { id: 'agent-3', name: 'Root Cause Agent', status: 'IDLE', health: 'HEALTHY', latencyMs: 180, tokenUsage: 8900, currentTask: 'Trace graph correlation', lastActive: '1 min ago', model: 'gpt-4o' },
  { id: 'agent-4', name: 'Learning Agent', status: 'IDLE', health: 'HEALTHY', latencyMs: 290, tokenUsage: 4500, currentTask: 'Qdrant vector updates', lastActive: '5 mins ago', model: 'gpt-4o-mini' },
  { id: 'agent-5', name: 'Decision Agent', status: 'IDLE', health: 'HEALTHY', latencyMs: 150, tokenUsage: 7800, currentTask: 'Runbook step validation', lastActive: 'Just now', model: 'gpt-4o' },
  { id: 'agent-6', name: 'Communication Agent', status: 'IDLE', health: 'HEALTHY', latencyMs: 95, tokenUsage: 1500, currentTask: 'Slack alert formatting', lastActive: '10 mins ago', model: 'gpt-4o-mini' },
];

const initialHealth: SystemHealthNode[] = [
  { name: 'CPU Load', status: 'OK', usagePercentage: 42 },
  { name: 'Memory', status: 'OK', usagePercentage: 68 },
  { name: 'Disk Storage', status: 'OK', usagePercentage: 54 },
  { name: 'Network Traffic', status: 'OK', usagePercentage: 35 },
  { name: 'Postgres DB', status: 'OK', metrics: { pools: 15, activeConnections: 8 } },
  { name: 'Qdrant Vector Cluster', status: 'OK', metrics: { collections: 3, pointsCount: 4520 } },
  { name: 'Redis Cache', status: 'OK', usagePercentage: 22 },
  { name: 'EventBus Queue', status: 'OK', metrics: { depth: 0 } },
  { name: 'WebSocket Gateway', status: 'OK', metrics: { connections: 12 } },
];

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  agents: initialAgents,
  systemHealth: initialHealth,
  activityFeed: [],
  unreadAlertsCount: 0,

  setStats: (stats) => set({ stats }),
  updateAgentStatus: (updated) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
    })),
  updateSystemHealth: (updated) =>
    set((state) => ({
      systemHealth: state.systemHealth.map((h) =>
        h.name === updated.name ? { ...h, ...updated } : h
      ),
    })),
  addActivityEvent: (event) =>
    set((state) => ({
      activityFeed: [event, ...state.activityFeed].slice(0, 100),
    })),
  setUnreadAlertsCount: (unreadAlertsCount) => set({ unreadAlertsCount }),
  clearActivityFeed: () => set({ activityFeed: [] }),
}));

export default useDashboardStore;
