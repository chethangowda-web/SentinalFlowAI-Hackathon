import { Bell, Info, ShieldAlert, AlertTriangle, X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
  { id: '4', message: 'Certificate expiry in 7 days for api.sentinelflow.ai', severity: 'WARN', timestamp: '3 hours ago' },
  { id: '5', message: 'Deployment v2.4.1 rolled out to production', severity: 'INFO', timestamp: '5 hours ago' },
];

export function NotificationDrawer() {
  const { notificationDrawerOpen, setNotificationDrawerOpen } = useUIStore();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleAlerts = MOCK_NOTIFICATIONS.filter(n => !dismissed.has(n.id));

  const getAlertIcon = (sev: AlertItem['severity']) => {
    switch (sev) {
      case 'CRITICAL': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'WARN': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'INFO': return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSeverityBorder = (sev: AlertItem['severity']) => {
    switch (sev) {
      case 'CRITICAL': return 'border-l-red-500/50';
      case 'WARN': return 'border-l-amber-500/50';
      case 'INFO': return 'border-l-blue-500/50';
    }
  };

  return (
    <Sheet open={notificationDrawerOpen} onOpenChange={setNotificationDrawerOpen}>
      <SheetContent side="right" className="w-96 select-none bg-card text-foreground border-l border-border/40 p-0">
        <SheetHeader className="border-b border-border/40 px-5 py-4">
          <SheetTitle className="flex items-center justify-between text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notifications
              <span className="text-[10px] text-muted-foreground font-mono bg-accent/30 px-1.5 py-0.5 rounded">
                {visibleAlerts.length}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>
        <div className="py-3 px-3 space-y-2 overflow-y-auto max-h-[calc(100vh-5rem)]">
          <AnimatePresence>
            {visibleAlerts.length > 0 ? (
              visibleAlerts.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'p-3.5 rounded-xl bg-accent/20 border border-border/30 border-l-2 text-xs space-y-1.5 group',
                    getSeverityBorder(item.severity),
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="shrink-0 pt-0.5">{getAlertIcon(item.severity)}</div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium leading-normal text-foreground text-[11px]">{item.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-muted-foreground font-mono">{item.timestamp}</span>
                        <button
                          onClick={() => setDismissed(prev => new Set(prev).add(item.id))}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center gap-3"
              >
                <div className="p-3 rounded-full bg-accent/30">
                  <Bell className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">All caught up!</p>
                <p className="text-[10px] text-muted-foreground/60">No new notifications</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default NotificationDrawer;
