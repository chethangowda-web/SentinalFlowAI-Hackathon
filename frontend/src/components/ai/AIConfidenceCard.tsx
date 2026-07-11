import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfidenceBreakdown {
  label: string;
  weight: number; // percentage (0-100)
}

interface AIConfidenceCardProps {
  score: number; // percentage (0-100)
  breakdown?: ConfidenceBreakdown[];
  className?: string;
}

export function AIConfidenceCard({ score, breakdown = [], className }: AIConfidenceCardProps) {
  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (val >= 50) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const getProgressColor = (val: number) => {
    if (val >= 80) return 'bg-emerald-500';
    if (val >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={cn('bg-card border-border overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
          AI Confidence Rating
          <span className={cn('px-2 py-0.5 rounded text-xs border font-mono font-bold', getScoreColor(score))}>
            {score}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Progress Indicator */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={cn('h-2 rounded-full transition-all duration-500', getProgressColor(score))}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Breakdown Breakdown */}
        {breakdown.length > 0 && (
          <div className="pt-2 border-t space-y-2">
            <h4 className="text-xs font-semibold text-foreground mb-1">Confidence Breakdown</h4>
            {breakdown.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono text-foreground font-semibold">{item.weight}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1">
                  <div
                    className={cn('h-1 rounded-full', getProgressColor(item.weight))}
                    style={{ width: `${item.weight}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AIConfidenceCard;
