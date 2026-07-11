import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealtimeStore } from '@/store/realtimeStore';
import { useDashboardStore } from '../store/dashboardStore';
import { Radio, ScrollText } from 'lucide-react';

export function ActivityFeedWidget() {
  const { activityFeed, clearActivityFeed } = useDashboardStore();
  const incidentBuffer = useRealtimeStore((s) => s.incidentBuffer);

  const events = React.useMemo(() => {
    const incidents = incidentBuffer.map((inc: any) => ({
      id: inc.id || `inc-${Date.now()}-${Math.random()}`,
      timestamp: inc.createdAt || new Date().toISOString(),
      message: inc.title || inc.message || 'Unknown incident',
    }));
    return [...incidents, ...activityFeed].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 50);
  }, [incidentBuffer, activityFeed]);

  return (
    <Card className="bg-card border-border h-[350px] flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-red-400 animate-pulse" />
          Real-Time Activity Feed
        </CardTitle>
        <button
          onClick={clearActivityFeed}
          className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
        >
          Clear
        </button>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pt-2 space-y-3">
        {events.length > 0 ? (
          events.map((event) => (
            <div key={event.id} className="text-xs border-b pb-2 border-border/40 last:border-0 flex gap-2">
              <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <div>
                <p className="font-medium text-slate-200">{event.message}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col h-full items-center justify-center text-xs text-muted-foreground gap-2">
            <ScrollText className="w-8 h-8 text-muted-foreground/45" />
            No recent activity
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityFeedWidget;
