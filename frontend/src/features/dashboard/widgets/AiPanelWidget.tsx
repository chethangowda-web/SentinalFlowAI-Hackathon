import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AIConfidenceCard } from '@/components/ai/AIConfidenceCard';
import { Brain } from 'lucide-react';

interface AiPanelWidgetProps {
  intelligenceData: any;
}

export function AiPanelWidget({ intelligenceData }: AiPanelWidgetProps) {
  const stats = intelligenceData?.stats;

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-purple-400" />
            Decision Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Learning Accuracy</span>
            <span className="font-bold text-slate-200">{stats.learningAccuracy}%</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Decision Confidence</span>
            <span className="font-bold text-slate-200">{stats.decisionConfidence}%</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Recommendation Success Rate</span>
            <span className="font-bold text-emerald-400">{stats.recommendationSuccessPct}%</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Hallucination Score</span>
            <span className="font-bold text-red-400">{stats.hallucinationScore}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="md:col-span-2">
        <AIConfidenceCard
          score={stats.decisionConfidence}
          breakdown={[
            { label: 'Qdrant RAG Context Correlation', weight: 95 },
            { label: 'Telemetry Signature Alignment', weight: 92 },
            { label: 'Operator Action Logs History Match', weight: 88 },
          ]}
        />
      </div>
    </div>
  );
}

export default AiPanelWidget;
