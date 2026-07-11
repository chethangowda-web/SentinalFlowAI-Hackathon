import { GitCompare, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SimilarityCardProps {
  currentTitle: string;
  similarTitle: string;
  similarId: string;
  similarityScore: number; // percentage (0-100)
  matchDetails: string[];
  className?: string;
}

export function SimilarityCard({
  currentTitle,
  similarTitle,
  similarId,
  similarityScore,
  matchDetails = [],
  className,
}: SimilarityCardProps) {
  return (
    <Card className={cn('bg-card border-border', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between text-foreground">
          <span className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-purple-400" />
            Historical Similarity
          </span>
          <span className="flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-purple-400">
            <Flame className="w-3 h-3 fill-current" />
            {similarityScore}% Match
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comparison grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded bg-muted/40 border space-y-1">
            <div className="font-semibold text-muted-foreground">Active Incident</div>
            <div className="text-slate-200">{currentTitle}</div>
          </div>
          <div className="p-3 rounded bg-muted/40 border space-y-1">
            <div className="font-semibold text-purple-400">Similar Incident ({similarId})</div>
            <div className="text-slate-200">{similarTitle}</div>
          </div>
        </div>

        {/* Match indicators */}
        {matchDetails.length > 0 && (
          <div className="pt-2 space-y-1.5">
            <div className="text-[11px] font-semibold text-muted-foreground">Match Vector Points</div>
            <ul className="list-disc pl-4 space-y-1 text-xs text-slate-300">
              {matchDetails.map((detail, idx) => (
                <li key={idx} className="leading-normal">{detail}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SimilarityCard;
