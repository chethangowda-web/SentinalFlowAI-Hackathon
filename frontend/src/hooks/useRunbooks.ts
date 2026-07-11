import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runbookApi } from '@/api/runbook';

export function useRunbooks(runbookId?: string) {
  const queryClient = useQueryClient();

  const runbooksQuery = useQuery({
    queryKey: ['runbooks', 'list'],
    queryFn: () => runbookApi.listRunbooks(),
  });

  const historyQuery = useQuery({
    queryKey: ['runbooks', 'history', runbookId],
    queryFn: () => runbookApi.executionHistory(runbookId || ''),
    enabled: !!runbookId,
  });

  const executeMutation = useMutation({
    mutationFn: ({ runbookId, incidentId }: { runbookId: string; incidentId: string }) =>
      runbookApi.executeRunbook(runbookId, incidentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runbooks', 'history'] });
    },
  });

  return {
    runbooks: runbooksQuery.data || [],
    isLoadingRunbooks: runbooksQuery.isLoading,
    history: historyQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
    executeRunbook: executeMutation.mutateAsync,
    isExecuting: executeMutation.isPending,
  };
}

export default useRunbooks;
