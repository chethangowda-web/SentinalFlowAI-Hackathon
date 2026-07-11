import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Award, ArrowUpRight } from 'lucide-react';

interface RecommendationScoreProps {
  accuracy: number;
}

export function RecommendationScore({ accuracy }: RecommendationScoreProps) {
  return (
    <Card className="bg-card border border-border shadow-sm select-none">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-500/10 rounded text-purple-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-mono">Model Recommendation Accuracy</span>
            <span className="font-mono font-bold text-sm text-slate-200">{accuracy}%</span>
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export default RecommendationScore;
