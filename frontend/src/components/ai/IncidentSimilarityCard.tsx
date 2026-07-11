import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitCompare, Flame } from 'lucide-react';

interface SimilarIncident {
  id: string;
  title: string;
  similarity: number;
  resolution: string;
  duration: string;
  runbookUsed?: string;
  outcome: 'SUCCESS' | 'FAILED';
}

interface IncidentSimilarityCardProps {
  incident: SimilarIncident;
  onCompare: (id: string) => void;
}

export function IncidentSimilarityCard({ incident, onCompare }: IncidentSimilarityCardProps) {
  return (
    <Card className="bg-card border border-border shadow-sm select-none">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <span className="font-mono text-[9px] text-muted-foreground block">{incident.id}</span>
            <h4 className="text-xs font-bold text-slate-200 truncate">{incident.title}</h4>
          </div>
          <div className="flex items-center text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/10 rounded">
            <Flame className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            {incident.similarity}% match
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-2 border-y text-[10px] font-mono">
          <div>
            <span className="text-muted-foreground block text-[9px]">Resolution Time</span>
            <span className="font-bold text-slate-200">{incident.duration}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[9px]">Runbook Applied</span>
            <span className="font-bold text-purple-300 truncate block max-w-[140px]">
              {incident.runbookUsed || 'None (Manual)'}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-1 text-[10px]">
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
            incident.outcome === 'SUCCESS'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            RESOLVED {incident.outcome}
          </span>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCompare(incident.id)}
            className="h-8 text-[11px] gap-1 cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5" />
            Compare Diff
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default IncidentSimilarityCard;
