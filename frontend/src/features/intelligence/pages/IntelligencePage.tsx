import { useQuery } from '@tanstack/react-query';
import { RecommendationCard } from '@/components/ai/RecommendationCard';
import { AIConfidenceCard } from '@/components/ai/AIConfidenceCard';
import { PromptViewer } from '@/components/ai/PromptViewer';
import { DecisionTimeline } from '@/components/ai/DecisionTimeline';
import { Skeleton } from '@/components/ui/skeleton';
import { intelligenceFeatureApi, type Recommendation } from '../api/intelligenceApi';

export function IntelligencePage() {
  const { data: dashboard, isLoading: loadingDashboard, isError: errorDashboard } = useQuery({
    queryKey: ['intelligence', 'dashboard'],
    queryFn: () => intelligenceFeatureApi.getDashboard(),
    refetchInterval: 30_000,
  });

  const { data: recommendations = [], isLoading: loadingRecs } = useQuery({
    queryKey: ['intelligence', 'recommendations'],
    queryFn: () => intelligenceFeatureApi.getRecommendations(),
    refetchInterval: 30_000,
  });

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['intelligence', 'history'],
    queryFn: () => intelligenceFeatureApi.getHistory(),
    refetchInterval: 30_000,
  });

  if (errorDashboard) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Intelligence & Recommendation Hub</h1>
          <p className="text-sm text-muted-foreground">Detailed insight into AI reasoning models and templates</p>
        </div>
        <div className="text-xs text-muted-foreground text-center py-12">
          Failed to load intelligence data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Intelligence & Recommendation Hub</h1>
        <p className="text-sm text-muted-foreground">Detailed insight into AI reasoning models and templates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {loadingRecs ? (
            <div className="space-y-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
          ) : recommendations.length > 0 ? (
            recommendations.slice(0, 1).map((rec: Recommendation) => (
              <RecommendationCard
                key={rec.id}
                title={rec.title}
                description={rec.description}
                riskLevel={rec.riskLevel}
                confidence={rec.confidence}
                actions={rec.actions?.map((a) => ({
                  label: a.label,
                  runbookId: a.runbookId,
                  onClick: a.runbookId
                    ? () => window.open(`/runbooks/${a.runbookId}`, '_blank')
                    : undefined,
                }))}
              />
            ))
          ) : dashboard ? (
            <RecommendationCard
              title={dashboard.recommendedAction}
              description={`Root causes identified: ${dashboard.possibleRootCauses.join(', ')}`}
              riskLevel={dashboard.riskLevel}
              confidence={Math.round(dashboard.confidence * 100) / 100}
              actions={dashboard.recommendedRunbooks.map((rb) => ({
                label: `Execute ${rb}`,
                runbookId: rb,
                onClick: () => window.open(`/runbooks/${rb}`, '_blank'),
              }))}
            />
          ) : (
            <div className="text-xs text-muted-foreground text-center py-12">
              No recommendations available.
            </div>
          )}

          <PromptViewer
            currentVersion={dashboard?.modelName || '1.0.0'}
            currentPrompt={
              dashboard
                ? `Recommended Action: ${dashboard.recommendedAction}\nRisk Level: ${dashboard.riskLevel}\nRoot Causes: ${dashboard.possibleRootCauses.join(', ')}\nApproval: ${dashboard.approvalRecommendation || 'MANUAL_REVIEW'}`
                : `You are an AI Incident Responder for SentinelFlow. Review the logs payload and determine root cause.\n- Highlight memory exhaustion points.\n- Map linked service clusters.`
            }
            previousVersion="1.1.0"
            previousPrompt={`Review logs payload and determine root cause.`}
          />
        </div>

        <div className="space-y-6">
          {loadingDashboard ? (
            <Skeleton className="h-48 w-full" />
          ) : dashboard ? (
            <AIConfidenceCard
              score={Math.round(dashboard.confidence * 100) / 100}
              breakdown={Object.entries(dashboard.confidenceBreakdown || {}).map(
                ([label, weight]) => ({
                  label,
                  weight: Math.round(weight * 100) / 100,
                })
              )}
            />
          ) : (
            <AIConfidenceCard score={0} />
          )}

          {loadingHistory ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <DecisionTimeline events={history} />
          )}
        </div>
      </div>
    </div>
  );
}

export default IntelligencePage;
