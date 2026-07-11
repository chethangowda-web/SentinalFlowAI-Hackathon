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



export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  agents: [],
  systemHealth: [],
  activityFeed: [],
  unreadAlertsCount: 0,
  activeWarRoom: null,
  warRoomVisible: false,
  executiveKPIs: [],
  heatmapData: [],
  aiTimeline: [],
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
