import { useQuery } from '@tanstack/react-query';
import { intelligenceApi } from '@/api/intelligence';

export function useRecommendations() {
  const runbooksQuery = useQuery({
    queryKey: ['recommendations', 'runbooks'],
    queryFn: () => intelligenceApi.getRecommendationsRunbooks(),
  });

  const engineersQuery = useQuery({
    queryKey: ['recommendations', 'engineers'],
    queryFn: () => intelligenceApi.getRecommendationsEngineers(),
  });

  return {
    runbooks: runbooksQuery.data || [],
    isLoadingRunbooks: runbooksQuery.isLoading,
    engineers: engineersQuery.data || [],
    isLoadingEngineers: engineersQuery.isLoading,
  };
}

export default useRecommendations;
