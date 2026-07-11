import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Zap,
  Activity,
  Shield,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface TrendAnalyticsProps {
  trends?: { day: string; count: number }[];
  mttr?: number;
  aiConfidence?: number;
  className?: string;
}

const rootCauseColors = ['#aa3bff', '#f59e0b', '#3b82f6', '#ef4444', '#6b7280'];

const customTooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '11px',
  color: 'hsl(var(--foreground))',
};

const axisTickStyle = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' };

function CircularProgress({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle
          cx="45"
          cy="45"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="6"
        />
        <circle
          cx="45"
          cy="45"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 45 45)"
          className="transition-all duration-1000 ease-out"
        />
        <text
          x="45"
          y="42"
          textAnchor="middle"
          dominantBaseline="central"
          fill="hsl(var(--foreground))"
          fontSize="16"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {value}%
        </text>
        <text
          x="45"
          y="58"
          textAnchor="middle"
          dominantBaseline="central"
          fill="hsl(var(--muted-foreground))"
          fontSize="8"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

export default function TrendAnalytics({
  trends,
  mttr,
  aiConfidence,
  className,
}: TrendAnalyticsProps) {
  const resolvedTrends = useMemo(() => trends ?? [], [trends]);
  const resolvedMttr = useMemo(() => mttr ?? null, [mttr]);
  const resolvedAiConfidence = useMemo(() => aiConfidence ?? null, [aiConfidence]);

  const chartTrends = useMemo(
    () =>
      resolvedTrends.map((d) => ({
        ...d,
        movingAvg: d.count,
      })),
    [resolvedTrends],
  );

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-4', className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="lg:col-span-2"
      >
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              Incident Trends (30 Days)
            </CardTitle>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Activity className="w-3.5 h-3.5" />
              <span>MTTR: {resolvedMttr}h</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span>AI Confidence: {resolvedAiConfidence}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartTrends}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#aa3bff" stopOpacity={0.35} />
                      <stop offset="40%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={axisTickStyle}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={axisTickStyle}
                    width={32}
                  />
                  <RechartsTooltip
                    contentStyle={customTooltipStyle}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#aa3bff"
                    strokeWidth={2}
                    fill="url(#trendGradient)"
                    activeDot={{ r: 4, fill: '#aa3bff', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="border-border/50 bg-card h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              MTTR Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resolvedMttr ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[{ day: 'Current', mttr: resolvedMttr }]} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={axisTickStyle} />
                      <YAxis axisLine={false} tickLine={false} tick={axisTickStyle} width={32} />
                      <RechartsTooltip contentStyle={customTooltipStyle} formatter={(value: any) => [`${value.toFixed(1)}h`, 'MTTR']} />
                      <Area type="monotone" dataKey="mttr" stroke="none" fill="url(#mttrGradient)" fillOpacity={1} />
                      <Line type="monotone" dataKey="mttr" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5, fill: '#f59e0b' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Current MTTR:</span>
                    <span className="font-mono font-semibold text-foreground">{resolvedMttr.toFixed(1)}h</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <p className="text-xs">No MTTR data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="lg:col-span-1"
      >
        <Card className="border-border/50 bg-card h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              SLA Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <CircularProgress value={100} label="Compliance" color="#22c55e" />
            <div className="mt-3 text-[11px] text-muted-foreground text-center">
              No SLA data yet
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="lg:col-span-1"
      >
        <Card className="border-border/50 bg-card h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              Root Cause Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-36 flex items-center justify-center text-muted-foreground">
              <p className="text-xs">Root cause data will appear after incidents are analyzed</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="lg:col-span-1"
      >
        <Card className="border-border/50 bg-card h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              Automation Success
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-4">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${100 * 2.01} 201`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-lg font-bold font-mono text-foreground">--%</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              No automation data yet
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="lg:col-span-1"
      >
        <Card className="border-border/50 bg-card h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Cost Savings
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <div className="text-3xl font-bold font-mono tracking-tight text-foreground">
              $0
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">this month</div>
            <div className="text-[11px] text-muted-foreground mt-3">
              Cost savings data will appear as automation runs
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
