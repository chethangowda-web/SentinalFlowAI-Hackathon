import { useQuery } from '@tanstack/react-query';
import { learningApi } from '@/api/learning';

export function useLearning() {
  const overviewQuery = useQuery({
    queryKey: ['learning', 'overview'],
    queryFn: () => learningApi.getOverview(),
    refetchInterval: 30000,
  });

  const growthQuery = useQuery({
    queryKey: ['learning', 'growth'],
    queryFn: () => learningApi.getGrowth(),
    refetchInterval: 60000,
  });

  const isLoading = overviewQuery.isLoading || growthQuery.isLoading;
  const isError = overviewQuery.isError || growthQuery.isError;

  return {
    overview: overviewQuery.data || null,
    growth: growthQuery.data || [],
    isLoading,
    isError,
    refetch: () => {
      overviewQuery.refetch();
      growthQuery.refetch();
    },
  };
}

export default useLearning;
