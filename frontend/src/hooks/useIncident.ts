import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentApi } from '@/api/incident';

export function useIncident(id: string) {
  const queryClient = useQueryClient();

  const incidentQuery = useQuery({
    queryKey: ['incidents', 'detail', id],
    queryFn: () => incidentApi.getIncident(id),
    enabled: !!id,
  });

  const assignMutation = useMutation({
    mutationFn: (assigneeId: string) => incidentApi.assignIncident(id, assigneeId),
    onSuccess: (data) => {
      queryClient.setQueryData(['incidents', 'detail', id], data);
      queryClient.invalidateQueries({ queryKey: ['incidents', 'list'] });
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: () => incidentApi.acknowledgeIncident(id),
    onSuccess: (data) => {
      queryClient.setQueryData(['incidents', 'detail', id], data);
      queryClient.invalidateQueries({ queryKey: ['incidents', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (notes?: string) => incidentApi.resolveIncident(id, notes),
    onSuccess: (data) => {
      queryClient.setQueryData(['incidents', 'detail', id], data);
      queryClient.invalidateQueries({ queryKey: ['incidents', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (feedback?: string) => incidentApi.closeIncident(id, feedback),
    onSuccess: (data) => {
      queryClient.setQueryData(['incidents', 'detail', id], data);
      queryClient.invalidateQueries({ queryKey: ['incidents', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => incidentApi.deleteIncident(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    incident: incidentQuery.data || null,
    isLoading: incidentQuery.isLoading,
    isError: incidentQuery.isError,
    refetch: incidentQuery.refetch,
    assignIncident: assignMutation.mutateAsync,
    isAssigning: assignMutation.isPending,
    acknowledgeIncident: acknowledgeMutation.mutateAsync,
    isAcknowledging: acknowledgeMutation.isPending,
    resolveIncident: resolveMutation.mutateAsync,
    isResolving: resolveMutation.isPending,
    closeIncident: closeMutation.mutateAsync,
    isClosing: closeMutation.isPending,
    deleteIncident: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export default useIncident;
