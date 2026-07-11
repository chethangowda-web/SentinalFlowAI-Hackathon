import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intelligenceApi } from '@/api/intelligence';

export function useDecisionDetails(incidentId: string) {
  const queryClient = useQueryClient();

  const decisionQuery = useQuery({
    queryKey: ['intelligence', 'decision', incidentId],
    queryFn: () => intelligenceApi.getDecision(incidentId),
    enabled: !!incidentId,
  });

  const historyQuery = useQuery({
    queryKey: ['intelligence', 'history'],
    queryFn: () => intelligenceApi.getRecommendations(),
  });

  const approveMutation = useMutation({
    mutationFn: () => intelligenceApi.approveDecision(incidentId),
    onSuccess: (data) => {
      queryClient.setQueryData(['intelligence', 'decision', incidentId], data);
      queryClient.invalidateQueries({ queryKey: ['intelligence', 'history'] });
    },
  });

  return {
    decision: decisionQuery.data || null,
    isLoading: decisionQuery.isLoading,
    isError: decisionQuery.isError,
    error: decisionQuery.error,
    refetchDecision: decisionQuery.refetch,
    history: historyQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
    approveDecision: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
  };
}

export default useDecisionDetails;
