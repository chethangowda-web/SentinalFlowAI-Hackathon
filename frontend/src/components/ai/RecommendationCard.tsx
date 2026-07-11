import { ArrowRight, CheckCircle2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiskBadge, type RiskLevel } from './RiskBadge';

interface RecommendationAction {
  label: string;
  runbookId?: string;
  onClick?: () => void;
}

interface RecommendationCardProps {
  title: string;
  description: string;
  riskLevel: RiskLevel;
  confidence: number;
  actions?: RecommendationAction[];
  className?: string;
}

export function RecommendationCard({
  title,
  description,
  riskLevel,
  confidence,
  actions = [],
  className,
}: RecommendationCardProps) {
  return (
    <Card className={cn('bg-card border-border hover:shadow-md transition-shadow duration-250', className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <RiskBadge level={riskLevel} />
          <span className="text-[11px] font-mono font-semibold text-muted-foreground px-2 py-0.5 border rounded bg-muted/30">
            Confidence: {confidence}%
          </span>
        </div>
        <CardTitle className="text-md font-semibold text-foreground mt-3">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-300 leading-normal">{description}</p>

        {actions.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t">
            {actions.map((act, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 p-2.5 rounded bg-muted/40 border text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-medium text-slate-200">{act.label}</span>
                </div>
                {act.runbookId ? (
                  <Button
                    onClick={act.onClick}
                    size="sm"
                    variant="default"
                    className="h-8 gap-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Execute Runbook
                  </Button>
                ) : (
                  <Button
                    onClick={act.onClick}
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 px-3 text-primary hover:text-primary-foreground"
                  >
                    Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecommendationCard;
