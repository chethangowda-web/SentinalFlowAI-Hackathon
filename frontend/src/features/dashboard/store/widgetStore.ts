import { create } from 'zustand';

export interface WidgetLayoutItem {
  id: string;
  title: string;
  visible: boolean;
  size: 'small' | 'medium' | 'large' | 'full';
  order: number;
}

interface WidgetState {
  layouts: WidgetLayoutItem[];
  toggleVisibility: (id: string) => void;
  updateSize: (id: string, size: WidgetLayoutItem['size']) => void;
  updateOrder: (layouts: WidgetLayoutItem[]) => void;
}

const defaultLayouts: WidgetLayoutItem[] = [
  { id: 'kpi', title: 'Top KPI summary stats', visible: true, size: 'full', order: 0 },
  { id: 'incidents', title: 'Incidents Overview', visible: true, size: 'large', order: 1 },
  { id: 'ai', title: 'AI Decision Panel', visible: true, size: 'medium', order: 2 },
  { id: 'runbooks', title: 'Runbooks Dashboard', visible: true, size: 'medium', order: 3 },
  { id: 'agents', title: 'Agent Topology Monitors', visible: true, size: 'large', order: 4 },
  { id: 'health', title: 'System Nodes Health', visible: true, size: 'large', order: 5 },
  { id: 'activity', title: 'Real-time Event Stream Feed', visible: true, size: 'medium', order: 6 },
  { id: 'notifications', title: 'Notification Alerts Inbox', visible: true, size: 'medium', order: 7 },
];

export const useWidgetStore = create<WidgetState>((set) => ({
  layouts: defaultLayouts,
  toggleVisibility: (id) =>
    set((state) => ({
      layouts: state.layouts.map((w) =>
        w.id === id ? { ...w, visible: !w.visible } : w
      ),
    })),
  updateSize: (id, size) =>
    set((state) => ({
      layouts: state.layouts.map((w) =>
        w.id === id ? { ...w, size } : w
      ),
    })),
  updateOrder: (layouts) => set({ layouts }),
}));

export default useWidgetStore;
