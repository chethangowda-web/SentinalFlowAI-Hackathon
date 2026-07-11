import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timelineApi } from '@/api/timeline';

export function useTimeline(incidentId: string) {
  const queryClient = useQueryClient();

  const timelineQuery = useQuery({
    queryKey: ['incidents', 'timeline', incidentId],
    queryFn: () => timelineApi.fetchTimeline(incidentId),
    enabled: !!incidentId,
  });

  const notesQuery = useQuery({
    queryKey: ['incidents', 'notes', incidentId],
    queryFn: () => timelineApi.fetchNotes(incidentId),
    enabled: !!incidentId,
  });

  const auditQuery = useQuery({
    queryKey: ['incidents', 'audit', incidentId],
    queryFn: () => timelineApi.fetchAudit(incidentId),
    enabled: !!incidentId,
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => timelineApi.addNote(incidentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents', 'notes', incidentId] });
      queryClient.invalidateQueries({ queryKey: ['incidents', 'timeline', incidentId] });
    },
  });

  return {
    timeline: timelineQuery.data || [],
    isLoadingTimeline: timelineQuery.isLoading,
    notes: notesQuery.data || [],
    isLoadingNotes: notesQuery.isLoading,
    auditLog: auditQuery.data || [],
    isLoadingAudit: auditQuery.isLoading,
    addNote: addNoteMutation.mutateAsync,
    isAddingNote: addNoteMutation.isPending,
  };
}

export default useTimeline;
