import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  sparklineData?: { value: number }[];
  loading?: boolean;
  onClick?: () => void;
}

export function KpiCard({
  title,
  value,
  trend,
  trendDirection = 'neutral',
  sparklineData,
  loading = false,
  onClick,
}: KpiCardProps) {
  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-4 w-24 bg-muted/40" />
          <Skeleton className="h-8 w-16 bg-muted/45" />
          <Skeleton className="h-3 w-32 bg-muted/40" />
        </CardContent>
      </Card>
    );
  }

  const isUp = trendDirection === 'up';
  const isDown = trendDirection === 'down';

  return (
    <Card
      onClick={onClick}
      className={`bg-card border-border hover:border-purple-500/40 hover:bg-muted/10 transition-all duration-200 cursor-pointer ${
        onClick ? 'active:scale-[0.98]' : ''
      }`}
    >
      <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {title}
          </span>
          {trend !== undefined && (
            <div
              className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                isUp
                  ? 'text-emerald-400 bg-emerald-950/20 border-emerald-500/15'
                  : isDown
                  ? 'text-red-400 bg-red-950/20 border-red-500/15'
                  : 'text-muted-foreground bg-muted/20 border-border'
              }`}
            >
              {isUp ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : isDown ? (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              ) : (
                <Minus className="w-3 h-3 mr-0.5" />
              )}
              {trend > 0 ? `+${trend}` : trend}%
            </div>
          )}
        </div>

        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {value}
          </span>

          {sparklineData && sparklineData.length > 0 && (
            <div className="w-16 h-8 opacity-75">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={isUp ? '#34d399' : isDown ? '#f87171' : '#a78bfa'}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default KpiCard;
