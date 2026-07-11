import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataGrid } from '@/components/data/DataGrid';
import { SimilarityCard } from '@/components/ai/SimilarityCard';
import { AIConfidenceCard } from '@/components/ai/AIConfidenceCard';
import { ReasoningViewer } from '@/components/ai/ReasoningViewer';
import { RiskBadge } from '@/components/ai/RiskBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import incidentApi, { type Incident } from '@/api/incident';
import intelligenceApi from '@/api/intelligence';

export function IncidentsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const { data: incidents, isLoading, isError, error } = useQuery({
    queryKey: ['incidents'],
    queryFn: incidentApi.getIncidents,
    refetchInterval: 15000,
  });

  const { data: decision, isLoading: decisionLoading } = useQuery({
    queryKey: ['decision', selectedId],
    queryFn: () => intelligenceApi.getDecision(selectedId!),
    enabled: !!selectedId,
    refetchInterval: 15000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => incidentApi.acknowledgeIncident(id),
    onSuccess: () => {
      toast.success('Incident acknowledged');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: () => toast.error('Failed to acknowledge incident'),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => incidentApi.resolveIncident(id),
    onSuccess: () => {
      toast.success('Incident resolved');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: () => toast.error('Failed to resolve incident'),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => incidentApi.closeIncident(id),
    onSuccess: () => {
      toast.success('Incident closed');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: () => toast.error('Failed to close incident'),
  });

  const columns: ColumnDef<Incident>[] = [
    { accessorKey: 'id', header: 'ID', size: 120 },
    { accessorKey: 'title', header: 'Incident Summary', size: 300 },
    {
      accessorKey: 'severity',
      header: 'Severity',
      size: 100,
      cell: ({ row }) => <RiskBadge level={row.original.severity} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 130,
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700 bg-slate-800 text-slate-300">
          {row.original.status}
        </span>
      ),
    },
    { accessorKey: 'createdAt', header: 'Created', size: 160 },
  ];

  const selectedIncident = incidents?.find((i) => i.id === selectedId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Incident Log Manager</h1>
          <p className="text-sm text-muted-foreground">Trace, investigate and manage platform security faults</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Incident Log Manager</h1>
          <p className="text-sm text-muted-foreground">Trace, investigate and manage platform security faults</p>
        </div>
        <div className="text-center text-xs text-red-400 py-12 border rounded-lg bg-card/20">
          Failed to load incidents: {(error as Error)?.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  if (!incidents || incidents.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Incident Log Manager</h1>
          <p className="text-sm text-muted-foreground">Trace, investigate and manage platform security faults</p>
        </div>
        <div className="text-center text-xs text-muted-foreground py-12 border rounded-lg bg-card/20">
          No incidents found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Incident Log Manager</h1>
        <p className="text-sm text-muted-foreground">Trace, investigate and manage platform security faults</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <DataGrid columns={columns} data={incidents} onRowClick={(row) => setSelectedId(row.id)} height="400px" />
        </div>

        <div className="space-y-6">
          {selectedIncident && decisionLoading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : selectedIncident && decision ? (
            <>
              <div className="border p-4 rounded-lg bg-card space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-mono text-xs text-muted-foreground font-semibold">
                    {selectedIncident.id}
                  </span>
                  <RiskBadge level={selectedIncident.severity} />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">{selectedIncident.title}</h3>
                <div className="flex gap-2 pt-1">
                  {selectedIncident.status === 'OPEN' && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => acknowledgeMutation.mutate(selectedIncident.id)}>
                      Acknowledge
                    </Button>
                  )}
                  {(selectedIncident.status === 'ACKNOWLEDGED' || selectedIncident.status === 'INVESTIGATING') && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => resolveMutation.mutate(selectedIncident.id)}>
                      Resolve
                    </Button>
                  )}
                  {selectedIncident.status === 'RESOLVED' && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => closeMutation.mutate(selectedIncident.id)}>
                      Close
                    </Button>
                  )}
                </div>
              </div>

              <AIConfidenceCard
                score={decision.confidence}
                breakdown={Object.entries(decision.confidenceBreakdown || {}).map(([label, weight]) => ({
                  label,
                  weight,
                }))}
              />

              <ReasoningViewer
                reasoning={decision.possibleRootCauses?.length ? `#### Diagnostics Root Cause Identification\n${decision.possibleRootCauses.map((c) => `- ${c}`).join('\n')}` : undefined}
                steps={decision.reasoningSteps}
                modelName={decision.recommendedAction ? 'SentinelFlow-Reasoner-v4' : undefined}
              />

              {(decision as any).similarIncident && (
                <SimilarityCard
                  currentTitle={selectedIncident.title}
                  similarTitle={(decision as any).similarIncident.title}
                  similarId={(decision as any).similarIncident.id}
                  similarityScore={(decision as any).similarIncident.similarityScore}
                  matchDetails={(decision as any).similarIncident.matchDetails}
                />
              )}
            </>
          ) : (
            <div className="text-center text-xs text-muted-foreground py-12 border rounded-lg bg-card/20">
              Select an incident from the data table to review AI diagnostics
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IncidentsPage;
