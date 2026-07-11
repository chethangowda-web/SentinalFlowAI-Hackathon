import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealtimeStore } from '@/store/realtimeStore';
import { Bell, Info, ShieldAlert } from 'lucide-react';

export function NotificationCenterWidget() {
  const incidentBuffer = useRealtimeStore((s) => s.incidentBuffer);

  return (
    <Card className="bg-card border-border h-[350px] flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-purple-400" />
          Notification Alerts Inbox
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pt-2 space-y-3">
        {incidentBuffer.length > 0 ? (
          <div className="space-y-3">
            {incidentBuffer.map((incident: any, idx: number) => (
              <div key={incident.id || idx} className="p-3 border rounded bg-red-950/10 border-red-500/15 flex gap-2 text-xs">
                <ShieldAlert className="w-4.5 h-4.5 text-red-400 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">{incident.title || incident.message}</p>
                  <p className="text-[10px] text-muted-foreground">{incident.description || incident.severity}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-full items-center justify-center text-xs text-muted-foreground gap-2">
            <Info className="w-8 h-8 text-muted-foreground/45" />
            No new alert notifications.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NotificationCenterWidget;
