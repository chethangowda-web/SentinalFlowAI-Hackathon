import * as React from 'react';
import { realtimeService } from '@/services/websocket/RealtimeService';
import { useDashboardStore } from '../store/dashboardStore';
import { ActivityEvent } from '../types';

export function useRealtimeDashboard(refetchCallback?: () => void) {
  const { addActivityEvent, updateAgentStatus, setUnreadAlertsCount } = useDashboardStore();

  React.useEffect(() => {
    const unsubIncidents = realtimeService.subscribeToIncidents((incident) => {
      const event: ActivityEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: incident.status === 'RESOLVED' ? 'INCIDENT_UPDATED' : 'INCIDENT_CREATED',
        message: `Incident [${incident.id}] ${incident.title} status changed to ${incident.status}`,
        details: incident,
      };
      addActivityEvent(event);
      if (incident.severity === 'CRITICAL' && incident.status === 'OPEN') {
        const currentCount = useDashboardStore.getState().unreadAlertsCount;
        setUnreadAlertsCount(currentCount + 1);
      }
      if (refetchCallback) refetchCallback();
    });

    const unsubAgents = realtimeService.subscribeToAgentStatus((agent) => {
      updateAgentStatus({
        id: agent.id,
        status: agent.status,
        health: agent.health || 'HEALTHY',
        latencyMs: agent.latencyMs || 100,
        tokenUsage: agent.tokenUsage || 1000,
        currentTask: agent.currentTask,
      });

      const event: ActivityEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'AGENT_COMPLETED',
        message: `Agent ${agent.name} is now ${agent.status}`,
        details: agent,
      };
      addActivityEvent(event);
    });

    const simulatedChannel = setInterval(() => {
      if (Math.random() > 0.85) {
        if (refetchCallback) refetchCallback();
      }
    }, 15000);

    return () => {
      unsubIncidents();
      unsubAgents();
      clearInterval(simulatedChannel);
    };
  }, [addActivityEvent, updateAgentStatus, setUnreadAlertsCount, refetchCallback]);
}

export default useRealtimeDashboard;
