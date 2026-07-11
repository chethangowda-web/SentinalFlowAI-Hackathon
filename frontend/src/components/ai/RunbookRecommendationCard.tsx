import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ArrowRightLeft } from 'lucide-react';

interface RunbookRec {
  runbookId: string;
  name: string;
  description: string;
  confidence: number;
  previousSuccessRate: number;
  averageExecutionTime: string;
  safetyLevel: 'SAFE' | 'MODERATE' | 'CRITICAL';
  rollbackAvailable: boolean;
}

interface RunbookRecommendationCardProps {
  runbook: RunbookRec;
  onExecute: (id: string) => void;
  executing?: boolean;
}

export function RunbookRecommendationCard({ runbook, onExecute, executing = false }: RunbookRecommendationCardProps) {
  return (
    <Card className="bg-card border-border shadow-md select-none">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-xs font-bold text-slate-200">{runbook.name}</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">{runbook.description}</p>
          </div>
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
            runbook.safetyLevel === 'SAFE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            runbook.safetyLevel === 'MODERATE' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
            'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {runbook.safetyLevel}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 py-2.5 border-y text-[10px]">
          <div>
            <span className="text-muted-foreground block text-[9px]">Match Confidence</span>
            <span className="font-mono font-bold text-purple-300">{runbook.confidence}%</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[9px]">Success Rate</span>
            <span className="font-mono font-bold text-emerald-300">{runbook.previousSuccessRate}%</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[9px]">Avg Duration</span>
            <span className="font-mono font-bold text-slate-200">{runbook.averageExecutionTime}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-1 text-[10px]">
          <div className="flex items-center space-x-1.5 text-muted-foreground">
            {runbook.rollbackAvailable ? (
              <span className="flex items-center text-emerald-400">
                <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                Rollback support
              </span>
            ) : (
              <span className="text-muted-foreground">No rollback</span>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => onExecute(runbook.runbookId)}
            disabled={executing}
            className="h-8 bg-purple-600 hover:bg-purple-700 text-white gap-1.5 text-[11px] cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {executing ? 'Running...' : 'Execute Script'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default RunbookRecommendationCard;
