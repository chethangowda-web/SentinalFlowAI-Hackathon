import { Bell, Info, ShieldAlert } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface AlertItem {
  id: string;
  message: string;
  severity: 'CRITICAL' | 'WARN' | 'INFO';
  timestamp: string;
}

const MOCK_NOTIFICATIONS: AlertItem[] = [
  { id: '1', message: 'CPU spike detected on production-service-pod-02', severity: 'CRITICAL', timestamp: '2 mins ago' },
  { id: '2', message: 'Database backup finished successfully', severity: 'INFO', timestamp: '1 hour ago' },
  { id: '3', message: 'Mastra agent latency warning threshold exceeded', severity: 'WARN', timestamp: '2 hours ago' },
];

export function NotificationDrawer() {
  const { notificationDrawerOpen, setNotificationDrawerOpen } = useUIStore();

  const getAlertIcon = (sev: AlertItem['severity']) => {
    if (sev === 'CRITICAL') return <ShieldAlert className="w-4 h-4 text-red-400" />;
    return <Info className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <Sheet open={notificationDrawerOpen} onOpenChange={setNotificationDrawerOpen}>
      <SheetContent side="right" className="w-80 select-none bg-card text-foreground">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="w-4 h-4 text-purple-400" />
            Alert Notifications
          </SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-3">
          {MOCK_NOTIFICATIONS.map((item) => (
            <div key={item.id} className="p-3 border rounded-md bg-muted/20 flex gap-3 text-xs">
              <div className="shrink-0 pt-0.5">{getAlertIcon(item.severity)}</div>
              <div className="space-y-1">
                <p className="font-medium leading-normal text-slate-200">{item.message}</p>
                <span className="text-[10px] text-muted-foreground font-mono">{item.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default NotificationDrawer;
