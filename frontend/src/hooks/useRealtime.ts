import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/websocket/RealtimeService';

export function useRealtime() {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const unsubIncidents = realtimeService.subscribeToIncidents(() => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    const unsubAgents = realtimeService.subscribeToAgentStatus(() => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    const unsubDashboard = realtimeService.subscribeToDashboardUpdate((stats) => {
      queryClient.setQueryData(['dashboard', 'overview'], stats);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    return () => {
      unsubIncidents();
      unsubAgents();
      unsubDashboard();
    };
  }, [queryClient]);
}

export default useRealtime;
