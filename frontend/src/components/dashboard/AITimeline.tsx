import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Container,
  Search,
  Brain,
  ShieldCheck,
  Bell,
  Check,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AITimelineEvent } from '@/features/dashboard/types';
import { useDashboardStore } from '@/features/dashboard/store/dashboardStore';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  BarChart3,
  Container,
  Search,
  Brain,
  ShieldCheck,
  Bell,
};

const colorMap: Record<string, string> = {
  Activity: 'bg-rose-500/15 text-rose-400',
  BarChart3: 'bg-blue-500/15 text-blue-400',
  Container: 'bg-cyan-500/15 text-cyan-400',
  Search: 'bg-violet-500/15 text-violet-400',
  Brain: 'bg-amber-500/15 text-amber-400',
  ShieldCheck: 'bg-emerald-500/15 text-emerald-400',
  Bell: 'bg-sky-500/15 text-sky-400',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

interface AITimelineProps {
  className?: string;
}

export function AITimeline({ className }: AITimelineProps) {
  const aiTimeline = useDashboardStore((s) => s.aiTimeline);

  return (
    <Card
      className={cn(
        'glass border-border/50 overflow-hidden',
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          AI Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-3">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative pl-7 pr-3"
        >
          {aiTimeline.map((event, index) => (
            <React.Fragment key={index}>
              <motion.div
                variants={item}
                className="relative py-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="font-mono text-[11px] text-muted-foreground w-10 text-right leading-5">
                      {event.time}
                    </span>
                  </div>

                  <div className="relative flex flex-col items-center shrink-0">
                    <div className="absolute top-3.5 bottom-0 w-px bg-border left-1/2 -translate-x-1/2" />
                    <div
                      className={cn(
                        'relative z-10 w-2.5 h-2.5 rounded-full border-2',
                        event.status === 'completed' && 'bg-emerald-500 border-emerald-500',
                        event.status === 'running' && 'bg-blue-500 border-blue-500',
                        event.status === 'pending' && 'bg-muted border-muted-foreground/40 border-dashed',
                        event.status === 'failed' && 'bg-red-500 border-red-500',
                      )}
                    >
                      {event.status === 'running' && (
                        <motion.span
                          className="absolute inset-0 rounded-full bg-blue-500"
                          animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        'rounded-md p-1.5 shrink-0',
                        colorMap[event.icon] || 'bg-muted text-muted-foreground'
                      )}
                    >
                      {React.createElement(
                        iconMap[event.icon] || HelpCircle,
                        { className: 'w-3.5 h-3.5' }
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm text-foreground truncate">
                          {event.title}
                        </span>
                        {event.status === 'completed' && (
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-emerald-500" />
                          </span>
                        )}
                        {event.status === 'failed' && (
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground block leading-tight">
                        {event.agent}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {index < aiTimeline.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />
                </div>
              )}
            </React.Fragment>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
}

export default AITimeline;
