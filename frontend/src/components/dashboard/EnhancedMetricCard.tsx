import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface EnhancedMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string; color?: string }>;
  color: string;
  trend?: number;
  trendLabel?: string;
  status?: 'healthy' | 'warning' | 'critical';
  statusLabel?: string;
  sparklineData?: { value: number }[];
  lastUpdated?: string;
  loading?: boolean;
  onClick?: () => void;
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours}h ago`;
}

function getSparklineColor(trend?: number): string {
  if (trend === undefined) return 'hsl(var(--primary))';
  if (trend > 0) return '#22c55e';
  if (trend < 0) return '#ef4444';
  return '#6b7280';
}

export function EnhancedMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  trendLabel,
  status,
  statusLabel,
  sparklineData,
  lastUpdated,
  loading = false,
  onClick,
}: EnhancedMetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const trendColor =
    trend === undefined ? '' : trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground';

  const TrendIcon =
    trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  const statusVariant =
    status === 'warning'
      ? 'warning'
      : status === 'critical'
        ? 'destructive'
        : 'default';

  const statusClasses =
    status === 'warning'
      ? 'bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/30'
      : status === 'critical'
        ? ''
        : 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30';

  const sparkColor = getSparklineColor(trend);
  const progressValue = trend !== undefined ? Math.min(Math.abs(trend), 100) : 0;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'glass rounded-xl border border-border/50',
        'hover:border-primary/20 transition-all duration-200',
        onClick && 'cursor-pointer',
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="bg-transparent border-0 shadow-none">
        <CardContent className="p-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {title}
                  </span>
                  <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                    {value}
                  </div>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                  )}
                </div>
                <div
                  className="rounded-lg p-2"
                  style={{ backgroundColor: color + '15' }}
                >
                  <Icon className="h-4 w-4" color={color} />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                {sparklineData && sparklineData.length > 0 && (
                  <div className="h-8 w-16 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparklineData}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={sparkColor}
                          strokeWidth={1.5}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {TrendIcon && (
                    <span className={cn('inline-flex items-center gap-1', trendColor)}>
                      <TrendIcon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">
                        {trend! > 0 ? '+' : ''}
                        {trend}%
                      </span>
                    </span>
                  )}

                  {trendLabel && (
                    <span className="text-[10px] text-muted-foreground">
                      {trendLabel}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {status && (
                    <Badge
                      variant={statusVariant as 'default' | 'destructive' | 'outline' | 'secondary'}
                      className={cn(
                        'text-[10px] px-1.5 py-0 font-medium',
                        status === 'warning' && 'bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/30',
                        status === 'critical' && 'bg-red-500/15 text-red-500 hover:bg-red-500/20 border-red-500/30',
                        status === 'healthy' && 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30',
                      )}
                    >
                      {statusLabel || (status === 'healthy' ? 'Healthy' : status === 'warning' ? 'Warning' : 'Critical')}
                    </Badge>
                  )}

                  {lastUpdated && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimeAgo(lastUpdated)}
                    </span>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  'mt-3 h-1 w-full rounded-full bg-muted overflow-hidden transition-opacity duration-200',
                  isHovered ? 'opacity-100' : 'opacity-0',
                )}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressValue}%`,
                    backgroundColor: sparkColor,
                  }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
