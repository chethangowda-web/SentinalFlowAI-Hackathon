import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JsonViewer } from '@/components/data/JsonViewer';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { BrainCircuit, Sparkles, CheckCircle, XCircle, RotateCw, MessageSquare, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function IntelligenceDashboard() {
  const incidentId = new URLSearchParams(window.location.search).get('incidentId') || '';
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

  const evidenceData = decision?.evidenceData || null;

  const similarIncidents = decision?.similarIncidents || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" as const } },
  };

  if (isLoading || isLoadingRunbooks || isLoadingEngineers) {
    return (
      <div className="flex h-[80svh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <Sparkles className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading AI intelligence...</p>
        </div>
      </div>
    );
  }

  if (isError || !decision) {
    const errorMsg = (error && (error as any).message) || 'Failed to connect to decision intelligence stream';
    return (
      <div className="flex h-[80svh] flex-col items-center justify-center space-y-5">
        <div className="p-4 rounded-full bg-destructive/10">
          <XCircle className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">Unable to load AI diagnosis</p>
          <p className="text-xs text-muted-foreground font-mono">{errorMsg}</p>
        </div>
        <Button onClick={() => refetchDecision()} size="sm" variant="outline" className="cursor-pointer">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 select-none pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary" />
            AI Decision Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">Automated diagnostics, reasoning analysis, and agent action models</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
          Copilot Active
        </Badge>
      </motion.div>

      {/* AI Overview */}
      <motion.div variants={itemVariants}>
        <AIOverviewCard
          title={decision.recommendedAction}
          severity="CRITICAL"
          confidence={decision.confidence}
          impact="High capacity pool limit saturation causing database timeout warnings"
          eta="~10 minutes"
        />
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <motion.div variants={itemVariants}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-card border border-border/30 rounded-xl p-1 h-auto gap-0 flex-wrap">
                <TabsTrigger value="overview" className="text-xs px-3 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">Overview</TabsTrigger>
                <TabsTrigger value="root-cause" className="text-xs px-3 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">Root Cause</TabsTrigger>
                <TabsTrigger value="recommendations" className="text-xs px-3 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">Runbooks</TabsTrigger>
                <TabsTrigger value="assignments" className="text-xs px-3 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">Engineers</TabsTrigger>
                <TabsTrigger value="evidence" className="text-xs px-3 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">Evidence</TabsTrigger>
                <TabsTrigger value="reasoning" className="text-xs px-3 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">Reasoning</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="overview" className="space-y-6 outline-none mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      {similarIncidents.length > 0 ? (similarIncidents as { id: string; title: string; similarity: number; resolution: string; duration: string; runbookUsed: string; outcome: 'SUCCESS' | 'FAILED' }[]).map(inc => (
                        <IncidentSimilarityCard
                          key={inc.id}
                          incident={inc}
                          onCompare={() => toast.info(`Comparing ${incidentId} with ${inc.id}`)}
                        />
                      )) : (
                        <div className="col-span-2 flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <p className="text-sm">No similar incidents found</p>
                          <p className="text-xs">Similar incidents will appear here as the system learns</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="root-cause" className="outline-none mt-0">
                  <RootCauseExplorer possibleCauses={decision.possibleRootCauses} />
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4 outline-none mt-0">
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

                <TabsContent value="assignments" className="space-y-4 outline-none mt-0">
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

                <TabsContent value="evidence" className="space-y-4 outline-none mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Kubernetes Container State</span>
                      <div className="border border-border/40 rounded-xl bg-muted/10 p-4 overflow-auto max-h-[350px]">
                        <JsonViewer data={evidenceData?.kubernetes || { message: 'No Kubernetes evidence data available' }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Prometheus Connection Stats</span>
                      <div className="border border-border/40 rounded-xl bg-muted/10 p-4 overflow-auto max-h-[350px]">
                        <JsonViewer data={evidenceData?.prometheus || { message: 'No Prometheus evidence data available' }} />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reasoning" className="outline-none mt-0">
                  <ReasoningViewer
                    modelName={decision.modelName || 'SentinelFlow-Reasoner-v4'}
                    latencyMs={decision.latencyMs || 1420}
                    tokensUsed={decision.tokensUsed || 1024}
                    steps={decision.reasoningSteps || []}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>
        </div>

        {/* Right: Diagnostics Panel */}
        <motion.div variants={itemVariants} className="space-y-4">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Diagnostics Panel</span>

          <Card className="bg-card border-border/40 rounded-xl">
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Copilot Stream</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-400 font-mono uppercase text-[10px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Model Status</span>
                <span className="font-mono text-foreground font-semibold uppercase text-[10px]">HEALTHY</span>
              </div>
              <DecisionStatus status={decision.status} />
            </CardContent>
          </Card>

          <Card className="bg-card border-border/40 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-foreground">AI Chat</span>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[11px] text-foreground">What is the root cause of the database connection pool exhaustion?</p>
              </div>
              <div className="p-3 rounded-xl bg-accent/20 border border-border/30 ml-4">
                <p className="text-[11px] text-foreground">The database connection pool is saturated due to a memory leak in the auth service. The pool hit 998/1000 active connections, causing timeouts. Recommended action: scale pool and rollback auth service to previous version.</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Action Bar */}
      <motion.div
        variants={itemVariants}
        className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-2xl border-t border-border/40 p-4 flex justify-end gap-3 z-50"
      >
        <Button
          onClick={handleRecompute}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Recompute Diagnosis
        </Button>
        <Button
          onClick={handleReject}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs border-red-500/20 text-red-400 hover:bg-red-500/5 cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5" />
          Reject Plan
        </Button>
        <Button
          onClick={handleApprove}
          disabled={isApproving}
          size="sm"
          className="gap-1.5 text-xs cursor-pointer"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {isApproving ? 'Approving...' : 'Approve AI Plan'}
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default IntelligenceDashboard;
