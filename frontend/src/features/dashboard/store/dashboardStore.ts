import { create } from 'zustand';
import {
  DashboardStats, AgentStatusItem, SystemHealthNode, ActivityEvent,
  WarRoomIncident, ExecutiveKPI, HeatmapItem, AITimelineEvent, LogEntry,
} from '../types';

interface DashboardState {
  stats: DashboardStats | null;
  agents: AgentStatusItem[];
  systemHealth: SystemHealthNode[];
  activityFeed: ActivityEvent[];
  unreadAlertsCount: number;
  activeWarRoom: WarRoomIncident | null;
  warRoomVisible: boolean;
  executiveKPIs: ExecutiveKPI[];
  heatmapData: HeatmapItem[];
  aiTimeline: AITimelineEvent[];
  logStream: LogEntry[];
  assistantOpen: boolean;
  lastUpdated: Record<string, string>;

  setStats: (stats: DashboardStats) => void;
  updateAgentStatus: (agent: Partial<AgentStatusItem> & { id: string }) => void;
  updateSystemHealth: (node: Partial<SystemHealthNode> & { name: string }) => void;
  addActivityEvent: (event: ActivityEvent) => void;
  setUnreadAlertsCount: (count: number) => void;
  clearActivityFeed: () => void;
  setActiveWarRoom: (incident: WarRoomIncident | null) => void;
  setWarRoomVisible: (visible: boolean) => void;
  setExecutiveKPIs: (kpis: ExecutiveKPI[]) => void;
  updateExecutiveKPI: (index: number, kpi: Partial<ExecutiveKPI>) => void;
  setHeatmapData: (data: HeatmapItem[]) => void;
  updateHeatmapItem: (service: string, item: Partial<HeatmapItem>) => void;
  setAiTimeline: (events: AITimelineEvent[]) => void;
  addAiTimelineEvent: (event: AITimelineEvent) => void;
  addLogEntry: (entry: LogEntry) => void;
  setLogStream: (entries: LogEntry[]) => void;
  setAssistantOpen: (open: boolean) => void;
  setLastUpdated: (key: string, time: string) => void;
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
  { name: 'PostgreSQL', status: 'OK', metrics: { connections: 8, cpu: 23, latency: 2, storage: 54, replication: 100 } },
  { name: 'Kubernetes', status: 'OK', metrics: { cpu: 35, memory: 62, pods: 23, nodes: 4, uptime: 99.9 } },
  { name: 'Qdrant Vector Cluster', status: 'OK', metrics: { collections: 3, pointsCount: 4520, latency: 4, storage: 38 } },
  { name: 'Redis Cache', status: 'OK', metrics: { hitRate: 94, memory: 22, connections: 15, latency: 1 } },
  { name: 'Groq AI', status: 'OK', metrics: { requestsPerMin: 45, latency: 180, tokensPerSec: 1200 } },
  { name: 'WebSocket Gateway', status: 'OK', metrics: { connections: 12, messagesPerSec: 340, latency: 5 } },
];

const initialExecKPIs: ExecutiveKPI[] = [
  { label: 'Revenue Protected', value: '$45,000', trend: 12, trendDirection: 'up', icon: 'DollarSign', color: '#22c55e' },
  { label: 'SLA Compliance', value: '99.96%', trend: 0.02, trendDirection: 'up', icon: 'ShieldCheck', color: '#06b6d4' },
  { label: 'Incidents Prevented', value: '132', trend: 18, trendDirection: 'up', icon: 'Ban', color: '#8b5cf6' },
  { label: 'Automation Savings', value: '214 hrs', trend: 24, trendDirection: 'up', icon: 'Clock', color: '#f59e0b' },
  { label: 'Predicted Outages', value: '12', trend: -3, trendDirection: 'down', icon: 'Eye', color: '#3b82f6' },
  { label: 'False Positives', value: '0.4%', trend: -0.1, trendDirection: 'down', icon: 'Target', color: '#ef4444' },
];

const initialHeatmap: HeatmapItem[] = [
  { service: 'API Gateway', health: 95, status: 'OK', latency: 12, errorRate: 0.3 },
  { service: 'Frontend', health: 100, status: 'OK', latency: 8, errorRate: 0.0 },
  { service: 'Payments', health: 68, status: 'DEGRADED', latency: 45, errorRate: 2.1 },
  { service: 'Database', health: 92, status: 'OK', latency: 3, errorRate: 0.1 },
  { service: 'Auth', health: 99, status: 'OK', latency: 5, errorRate: 0.0 },
  { service: 'AI Agents', health: 88, status: 'OK', latency: 180, errorRate: 0.5 },
];

const initialTimeline: AITimelineEvent[] = [
  { time: '10:20', title: 'CPU Spike Detected', agent: 'Monitoring Agent', icon: 'Activity', status: 'completed' },
  { time: '10:21', title: 'Telemetry Analyzed', agent: 'Monitoring Agent', icon: 'BarChart3', status: 'completed' },
  { time: '10:22', title: 'K8s Context Fetched', agent: 'Kubernetes Agent', icon: 'Container', status: 'completed' },
  { time: '10:23', title: 'Root Cause Identified', agent: 'Root Cause Agent', icon: 'Search', status: 'completed' },
  { time: '10:24', title: 'Decision Recommended', agent: 'Decision Agent', icon: 'Brain', status: 'completed' },
  { time: '10:25', title: 'Enkrypt Approved', agent: 'Governance', icon: 'ShieldCheck', status: 'completed' },
  { time: '10:26', title: 'Notification Sent', agent: 'Communication Agent', icon: 'Bell', status: 'completed' },
];

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  agents: initialAgents,
  systemHealth: initialHealth,
  activityFeed: [],
  unreadAlertsCount: 0,
  activeWarRoom: null,
  warRoomVisible: false,
  executiveKPIs: initialExecKPIs,
  heatmapData: initialHeatmap,
  aiTimeline: initialTimeline,
  logStream: [],
  assistantOpen: false,
  lastUpdated: {},

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
  setActiveWarRoom: (incident) => set({ activeWarRoom: incident }),
  setWarRoomVisible: (visible) => set({ warRoomVisible: visible }),
  setExecutiveKPIs: (kpis) => set({ executiveKPIs: kpis }),
  updateExecutiveKPI: (index, kpi) =>
    set((state) => ({
      executiveKPIs: state.executiveKPIs.map((k, i) => (i === index ? { ...k, ...kpi } : k)),
    })),
  setHeatmapData: (data) => set({ heatmapData: data }),
  updateHeatmapItem: (service, item) =>
    set((state) => ({
      heatmapData: state.heatmapData.map((h) =>
        h.service === service ? { ...h, ...item } : h
      ),
    })),
  setAiTimeline: (events) => set({ aiTimeline: events }),
  addAiTimelineEvent: (event) =>
    set((state) => ({
      aiTimeline: [...state.aiTimeline, event].slice(-20),
    })),
  addLogEntry: (entry) =>
    set((state) => ({
      logStream: [...state.logStream, entry].slice(-100),
    })),
  setLogStream: (entries) => set({ logStream: entries }),
  setAssistantOpen: (open) => set({ assistantOpen: open }),
  setLastUpdated: (key, time) =>
    set((state) => ({
      lastUpdated: { ...state.lastUpdated, [key]: time },
    })),
}));

export default useDashboardStore;
