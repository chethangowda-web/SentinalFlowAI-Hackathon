import * as React from 'react';
import { realtimeService } from '@/services/websocket/RealtimeService';
import { useRealtimeStore } from '@/store/realtimeStore';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { setStatus, addIncident, updateAgent } = useRealtimeStore();

  React.useEffect(() => {
    realtimeService.connect();

    const unsubStatus = realtimeService.subscribeToConnectionStatus((data) => {
      setStatus(data.status);
    });

    const unsubIncidents = realtimeService.subscribeToIncidents((incident) => {
      addIncident(incident);
    });

    const unsubAgents = realtimeService.subscribeToAgentStatus((agent) => {
      updateAgent(agent.id, agent);
    });

    return () => {
      unsubStatus();
      unsubIncidents();
      unsubAgents();
    };
  }, [setStatus, addIncident, updateAgent]);

  return <>{children}</>;
}

export default SocketProvider;
