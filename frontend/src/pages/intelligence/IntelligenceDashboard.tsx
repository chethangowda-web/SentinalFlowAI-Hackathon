import * as React from 'react';
import { useDecisionDetails } from '@/hooks/useDecisionDetails';
import { useRecommendations } from '@/hooks/useRecommendations';
import { AIOverviewCard } from '@/components/ai/AIOverviewCard';
import { ConfidenceGauge } from '@/components/ai/ConfidenceGauge';
import { ConfidenceBreakdown } from '@/components/ai/ConfidenceBreakdown';
import { RiskMatrix } from '@/components/ai/RiskMatrix';
import { AutomationCard } from '@/components/ai/AutomationCard';
import { DecisionStatus } from '@/components/ai/DecisionStatus';
import { RecommendationScore } from '@/components/ai/RecommendationScore';
import { RootCauseExplorer } from '@/components/ai/RootCauseExplorer';
import { ReasoningViewer } from '@/components/ai/ReasoningViewer';
import { RunbookRecommendationCard } from '@/components/ai/RunbookRecommendationCard';
import { EngineerRecommendationCard } from '@/components/ai/EngineerRecommendationCard';
import { IncidentSimilarityCard } from '@/components/ai/IncidentSimilarityCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { JsonViewer } from '@/components/data/JsonViewer';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';

export function IntelligenceDashboard() {
  const incidentId = 'INC-101';
  const { decision, isLoading, isError, error, refetchDecision, approveDecision, isApproving } = useDecisionDetails(incidentId);
  const { runbooks, engineers, isLoadingRunbooks, isLoadingEngineers } = useRecommendations();

  const [activeTab, setActiveTab] = React.useState('overview');

  const handleApprove = async () => {
    await approveDecision();
    toast.success('AI Decision Approved successfully');
  };

  const handleReject = () => {
    toast.error('AI Decision Rejected');
  };

  const handleRecompute = () => {
    toast.info('Recomputing AI models diagnosis...');
  };

  const mockEvidenceData = {
    kubernetes: {
      pod: 'auth-db-primary-7c7f466b6b-k82x2',
      namespace: 'production',
      status: 'OOMKilled',
      restartCount: 4,
      logs: [
        '[2026-07-09T11:58:12Z] [ERROR] connection pool timeout after 30000ms',
        '[2026-07-09T11:59:01Z] [FATAL] java.lang.OutOfMemoryError: Java heap space'
      ]
    },
    prometheus: {
      active_connections: 998,
      connection_limit: 1000,
      memory_utilization_pct: 98.4
    }
  };

  const mockSimilarIncidents = [
    {
      id: 'INC-82',
      title: 'Database connection leakage under API load spikes',
      similarity: 94,
      resolution: 'Scaled pool capacity by 50% via config hot reload.',
      duration: '14m 20s',
      runbookUsed: 'rbk_scale_db',
      outcome: 'SUCCESS' as const
    }
  ];

  if (isLoading || isLoadingRunbooks || isLoadingEngineers) {
    return (
      <div className="flex h-[80svh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !decision) {
  const errorMsg = (error && (error as any).message) || 'Failed to connect to decision intelligence stream';
  return (
    <div className="flex h-[80svh] flex-col items-center justify-center space-y-4">
      <p className="text-xs text-red-400 font-mono">{errorMsg}</p>
      <button
        onClick={() => refetchDecision()}
        className="px-4 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs"
      >
        Retry
      </button>
    </div>
  );
}

  return (
    <div className="space-y-6 select-none pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 font-mono flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-purple-400" />
          AI Decision Intelligence Center
        </h1>
        <p className="text-xs text-muted-foreground">Automated diagnostics, reasoning analysis, and agent action models</p>
      </div>

      <AIOverviewCard
        title={decision.recommendedAction}
        severity="CRITICAL"
        confidence={decision.confidence}
        impact="High capacity pool limit saturation causing database timeout warnings"
        eta="~10 minutes"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-6 h-9 bg-black/10 text-xs shrink-0">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="root-cause">Root Cause</TabsTrigger>
              <TabsTrigger value="recommendations">Runbooks</TabsTrigger>
              <TabsTrigger value="assignments">Engineers</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="reasoning">Reasoning Viewer</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ConfidenceGauge score={decision.confidence} />
                <ConfidenceBreakdown breakdown={decision.confidenceBreakdown} />
                <RiskMatrix severity="CRITICAL" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AutomationCard probability={96} />
                <RecommendationScore accuracy={98.4} />
              </div>

              <div className="space-y-3">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Historically Similar Outages</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockSimilarIncidents.map(inc => (
                    <IncidentSimilarityCard
                      key={inc.id}
                      incident={inc}
                      onCompare={() => toast.info(`Comparing INC-101 with ${inc.id}`)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="root-cause" className="outline-none">
              <RootCauseExplorer possibleCauses={decision.possibleRootCauses} />
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4 outline-none">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Recommended Runbook Actions</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {runbooks.map(rb => (
                  <RunbookRecommendationCard
                    key={rb.runbookId}
                    runbook={rb}
                    onExecute={(id) => toast.success(`Triggered execution script: ${id}`)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4 outline-none">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Best Matched SRE Engineers</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {engineers.map(eng => (
                  <EngineerRecommendationCard
                    key={eng.engineerId}
                    engineer={eng}
                    onAssign={(id) => toast.success(`Assigned incident to engineer: ${id}`)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Kubernetes Container State</span>
                  <div className="border rounded bg-muted/10 p-3 overflow-auto max-h-[350px]">
                    <JsonViewer data={mockEvidenceData.kubernetes} />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Prometheus Connection Stats</span>
                  <div className="border rounded bg-muted/10 p-3 overflow-auto max-h-[350px]">
                    <JsonViewer data={mockEvidenceData.prometheus} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reasoning" className="outline-none">
              <ReasoningViewer
                modelName={decision.modelName || 'SentinelFlow-Reasoner-v4'}
                latencyMs={decision.latencyMs || 1420}
                tokensUsed={decision.tokensUsed || 1024}
                steps={decision.reasoningSteps || []}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Diagnostics Panel</span>

          <Card className="bg-card border-border">
            <CardContent className="p-3.5 space-y-3.5 text-xs select-none">
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Copilot Stream</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-400 font-mono uppercase text-[10px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Model Status</span>
                <span className="font-mono text-slate-200 font-semibold uppercase text-[10px]">HEALTHY</span>
              </div>

              <DecisionStatus status={decision.status} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur border-t p-4 flex justify-end gap-3 z-50">
        <button
          onClick={handleRecompute}
          className="h-9 px-3 border border-border text-slate-300 rounded text-xs cursor-pointer hover:bg-muted/30"
        >
          Recompute AI Diagnosis
        </button>
        <button
          onClick={handleReject}
          className="h-9 px-3 border border-red-500/20 text-red-400 hover:bg-red-500/5 rounded text-xs cursor-pointer font-bold"
        >
          Reject AI Plan
        </button>
        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs cursor-pointer font-bold disabled:opacity-50"
        >
          Approve AI Plan
        </button>
      </div>
    </div>
  );
}

export default IntelligenceDashboard;
