import { create } from 'zustand';

interface RealtimeState {
  connected: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'FAILED';
  incidentBuffer: any[];
  agentBuffer: Record<string, any>;
  setConnected: (connected: boolean) => void;
  setStatus: (status: 'CONNECTED' | 'DISCONNECTED' | 'FAILED') => void;
  addIncident: (incident: any) => void;
  updateAgent: (agentId: string, status: any) => void;
  clearBuffer: () => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  connected: false,
  status: 'DISCONNECTED',
  incidentBuffer: [],
  agentBuffer: {},

  setConnected: (connected) => set({ connected }),
  setStatus: (status) => set({ status, connected: status === 'CONNECTED' }),
  addIncident: (incident) =>
    set((state) => ({
      incidentBuffer: [incident, ...state.incidentBuffer].slice(0, 100),
    })),
  updateAgent: (agentId, status) =>
    set((state) => ({
      agentBuffer: { ...state.agentBuffer, [agentId]: status },
    })),
  clearBuffer: () => set({ incidentBuffer: [], agentBuffer: {} }),
}));

export default useRealtimeStore;
