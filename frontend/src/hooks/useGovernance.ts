import { useQuery } from '@tanstack/react-query';
import { governanceApi } from '@/api/governance';

export function useGovernance() {
  const overviewQuery = useQuery({
    queryKey: ['governance', 'overview'],
    queryFn: () => governanceApi.getOverview(),
    refetchInterval: 30000,
  });

  const detectorsQuery = useQuery({
    queryKey: ['governance', 'detectors'],
    queryFn: () => governanceApi.getDetectors(),
    refetchInterval: 60000,
  });

  const historyQuery = useQuery({
    queryKey: ['governance', 'history'],
    queryFn: () => governanceApi.getHistory(),
    refetchInterval: 60000,
  });

  const isLoading = overviewQuery.isLoading || detectorsQuery.isLoading || historyQuery.isLoading;
  const isError = overviewQuery.isError || detectorsQuery.isError || historyQuery.isError;

  return {
    overview: overviewQuery.data || null,
    detectors: detectorsQuery.data || [],
    history: historyQuery.data || [],
    isLoading,
    isError,
    refetch: () => {
      overviewQuery.refetch();
      detectorsQuery.refetch();
      historyQuery.refetch();
    },
  };
}

export default useGovernance;
