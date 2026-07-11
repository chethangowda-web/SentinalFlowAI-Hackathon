import * as React from 'react';
import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LogEntry } from '@/features/dashboard/types';
import { useDashboardStore } from '@/features/dashboard/store/dashboardStore';

interface LogStreamProps {
  className?: string;
}

const levelStyles: Record<LogEntry['level'], string> = {
  INFO: 'bg-blue-500/10 text-blue-400',
  SUCCESS: 'bg-emerald-500/10 text-emerald-400',
  WARNING: 'bg-yellow-500/10 text-yellow-400',
  ERROR: 'bg-red-500/10 text-red-400',
};

const formatTime = (time: string): string => {
  const match = time.match(/\d{2}:\d{2}:\d{2}/);
  return match ? match[0] : time;
};

export function LogStream({ className }: LogStreamProps) {
  const logStream = useDashboardStore((state) => state.logStream);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [logStream]);

  return (
    <Card className={cn('border-border bg-card', className)}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">Live Log Stream</CardTitle>
        </div>
        <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
          {logStream.length} entries
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-60">
          <div
            ref={viewportRef}
            className="h-full w-full p-3 font-mono text-[11px] bg-black/40 overflow-auto"
          >
            {logStream.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Awaiting log events...
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {logStream.map((entry, index) => (
                  <motion.div
                    key={`${entry.time}-${index}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={cn(
                      'flex items-start gap-2 py-1',
                      index < logStream.length - 1 && 'border-b border-border/20'
                    )}
                  >
                    <span className="text-muted-foreground shrink-0">
                      [{formatTime(entry.time)}]
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold leading-none',
                        levelStyles[entry.level]
                      )}
                    >
                      {entry.level}
                    </span>
                    <span className="text-foreground/90 break-words">
                      {entry.message}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default LogStream;
