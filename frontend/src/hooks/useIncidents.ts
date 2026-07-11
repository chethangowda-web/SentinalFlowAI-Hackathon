import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentApi, Incident } from '@/api/incident';

export function useIncidents(filters?: Record<string, any>) {
  const queryClient = useQueryClient();

  const incidentsQuery = useQuery({
    queryKey: ['incidents', 'list', filters],
    queryFn: () => incidentApi.getIncidents(filters),
    refetchInterval: 10000,
    retry: 3,
    retryDelay: 2000,
  });

  const createIncidentMutation = useMutation({
    mutationFn: (payload: Omit<Incident, 'id' | 'createdAt' | 'status'>) =>
      incidentApi.createIncident(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    incidents: incidentsQuery.data || [],
    isLoading: incidentsQuery.isLoading,
    isError: incidentsQuery.isError,
    refetch: incidentsQuery.refetch,
    createIncident: createIncidentMutation.mutateAsync,
    isCreating: createIncidentMutation.isPending,
  };
}

export default useIncidents;
