import * as React from 'react';
import { RecommendationCard } from '@/components/ai/RecommendationCard';
import { AIConfidenceCard } from '@/components/ai/AIConfidenceCard';
import { PromptViewer } from '@/components/ai/PromptViewer';
import { DecisionTimeline } from '@/components/ai/DecisionTimeline';

const MOCK_EVENTS = [
  { id: '1', timestamp: '2026-07-09T12:00:00Z', type: 'DECISION' as const, message: 'AI classified incident INC-101 as memory pool depletion', detail: 'Confidence rating 85%' },
  { id: '2', timestamp: '2026-07-09T12:05:00Z', type: 'FEEDBACK' as const, message: 'Operator approved recommendation execute database pool expansion runbook', detail: 'Operator Jane Approved', feedbackValue: 'APPROVE' as const, operatorName: 'Jane Operator' },
];

export function IntelligencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Intelligence & Recommendation Hub</h1>
        <p className="text-sm text-muted-foreground">Detailed insight into AI reasoning models and templates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecommendationCard
            title="Expand Database Pool Connections"
            description="Our analysis shows database connections peaked at 98% of maximum capability. Execute database expansion script to increase total pools."
            riskLevel="HIGH"
            confidence={92}
            actions={[
              { label: 'Scale db pools by 50% threshold limit', runbookId: 'rbk_scale_db', onClick: () => alert('Triggering Database scaling runbook...') },
              { label: 'Review logs details', onClick: () => alert('Showing logs...') }
            ]}
          />

          <PromptViewer
            currentVersion="1.2.0"
            currentPrompt={`You are an AI Incident Responder for SentinelFlow. Review the logs payload and determine root cause.
- Highlight memory exhaustion points.
- Map linked service clusters.`}
            previousVersion="1.1.0"
            previousPrompt={`Review logs payload and determine root cause.`}
          />
        </div>

        <div className="space-y-6">
          <AIConfidenceCard
            score={92}
            breakdown={[
              { label: 'History Correlation Signal', weight: 95 },
              { label: 'Qdrant Knowledge Base Context Match', weight: 88 },
            ]}
          />

          <DecisionTimeline events={MOCK_EVENTS} />
        </div>
      </div>
    </div>
  );
}

export default IntelligencePage;
