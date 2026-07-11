import { BrainCircuit, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/utils/formatters';

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'DECISION' | 'FEEDBACK' | 'SYSTEM_ACTION';
  message: string;
  detail?: string;
  feedbackValue?: 'APPROVE' | 'REJECT';
  operatorName?: string;
}

interface DecisionTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function DecisionTimeline({ events = [], className }: DecisionTimelineProps) {
  const getEventIcon = (event: TimelineEvent) => {
    if (event.type === 'FEEDBACK') {
      return event.feedbackValue === 'APPROVE' ? (
        <ThumbsUp className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/10" />
      ) : (
        <ThumbsDown className="w-3.5 h-3.5 text-red-400 fill-red-500/10" />
      );
    }
    if (event.type === 'SYSTEM_ACTION') {
      return <MessageSquare className="w-3.5 h-3.5 text-blue-400" />;
    }
    return <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />;
  };

  const getEventBg = (event: TimelineEvent) => {
    if (event.type === 'FEEDBACK') {
      return event.feedbackValue === 'APPROVE' ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-red-500/15 border-red-500/30';
    }
    if (event.type === 'SYSTEM_ACTION') {
      return 'bg-blue-500/15 border-blue-500/30';
    }
    return 'bg-purple-500/15 border-purple-500/30';
  };

  return (
    <Card className={cn('bg-card border-border', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">Decision & Collaboration History</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No chronological decisions recorded.</p>
        ) : (
          <div className="relative pl-6 border-l border-border space-y-6 ml-2.5 py-2">
            {events.map((evt) => (
              <div key={evt.id} className="relative group">
                {/* Visual Bullet Icon */}
                <div
                  className={cn(
                    'absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border bg-card text-foreground transition-all group-hover:scale-110',
                    getEventBg(evt)
                  )}
                >
                  {getEventIcon(evt)}
                </div>

                {/* Event Content */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-xs font-semibold text-slate-200">{evt.message}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {formatDateTime(evt.timestamp)}
                    </span>
                  </div>
                  {evt.detail && <p className="text-xs text-muted-foreground leading-normal">{evt.detail}</p>}
                  {evt.operatorName && (
                    <div className="text-[10px] text-purple-400 font-mono flex items-center gap-1 mt-1">
                      <span>Operator:</span>
                      <span className="font-semibold text-slate-300">{evt.operatorName}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DecisionTimeline;
