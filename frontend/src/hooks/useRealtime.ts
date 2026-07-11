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

    return () => {
      unsubIncidents();
      unsubAgents();
    };
  }, [queryClient]);
}

export default useRealtime;
