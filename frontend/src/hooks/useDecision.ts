import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intelligenceApi } from '@/api/intelligence';

export function useDecision(incidentId: string) {
  const queryClient = useQueryClient();

  const decisionQuery = useQuery({
    queryKey: ['intelligence', 'decision', incidentId],
    queryFn: () => intelligenceApi.getDecision(incidentId),
    enabled: !!incidentId,
  });

  const approveMutation = useMutation({
    mutationFn: () => intelligenceApi.approveDecision(incidentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence', 'decision', incidentId] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });

  const recomputeMutation = useMutation({
    mutationFn: (customAnalysis?: Record<string, any>) =>
      intelligenceApi.recomputeDecision(incidentId, customAnalysis),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence', 'decision', incidentId] });
    },
  });

  return {
    decision: decisionQuery.data || null,
    isLoading: decisionQuery.isLoading,
    isError: decisionQuery.isError,
    approveDecision: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    recomputeDecision: recomputeMutation.mutateAsync,
    isRecomputing: recomputeMutation.isPending,
  };
}

export default useDecision;
