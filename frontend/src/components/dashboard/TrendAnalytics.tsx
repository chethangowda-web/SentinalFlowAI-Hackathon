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

const defaultTrends: { day: string; count: number }[] = [
  { day: 'Jun 12', count: 23 },
  { day: 'Jun 13', count: 18 },
  { day: 'Jun 14', count: 31 },
  { day: 'Jun 15', count: 27 },
  { day: 'Jun 16', count: 15 },
  { day: 'Jun 17', count: 22 },
  { day: 'Jun 18', count: 29 },
  { day: 'Jun 19', count: 34 },
  { day: 'Jun 20', count: 26 },
  { day: 'Jun 21', count: 19 },
  { day: 'Jun 22', count: 24 },
  { day: 'Jun 23', count: 21 },
  { day: 'Jun 24', count: 17 },
  { day: 'Jun 25', count: 28 },
  { day: 'Jun 26', count: 33 },
  { day: 'Jun 27', count: 25 },
  { day: 'Jun 28', count: 20 },
  { day: 'Jun 29', count: 16 },
  { day: 'Jun 30', count: 14 },
  { day: 'Jul 01', count: 19 },
  { day: 'Jul 02', count: 22 },
  { day: 'Jul 03', count: 27 },
  { day: 'Jul 04', count: 30 },
  { day: 'Jul 05', count: 24 },
  { day: 'Jul 06', count: 18 },
  { day: 'Jul 07', count: 21 },
  { day: 'Jul 08', count: 15 },
  { day: 'Jul 09', count: 12 },
  { day: 'Jul 10', count: 10 },
  { day: 'Jul 11', count: 8 },
];

const mttrMockData = [
  { day: 'Week 1', mttr: 4.2 },
  { day: 'Week 2', mttr: 3.8 },
  { day: 'Week 3', mttr: 4.5 },
  { day: 'Week 4', mttr: 3.2 },
  { day: 'Week 5', mttr: 2.9 },
  { day: 'Week 6', mttr: 3.1 },
];

const rootCauseData = [
  { name: 'Deployment', value: 45 },
  { name: 'Config', value: 22 },
  { name: 'Resource', value: 18 },
  { name: 'Network', value: 10 },
  { name: 'Other', value: 5 },
];

const rootCauseColors = ['#aa3bff', '#f59e0b', '#3b82f6', '#ef4444', '#6b7280'];

const slaCompliance = 98.5;
const automationSuccessRate = 98.2;
const costSavings = 12450;

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
  const resolvedTrends = useMemo(() => trends ?? defaultTrends, [trends]);
  const resolvedMttr = useMemo(() => mttr ?? 3.2, [mttr]);
  const resolvedAiConfidence = useMemo(() => aiConfidence ?? 94.7, [aiConfidence]);

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
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mttrMockData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mttrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={axisTickStyle}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={axisTickStyle}
                    width={32}
                    domain={[0, 6]}
                  />
                  <RechartsTooltip
                    contentStyle={customTooltipStyle}
                    formatter={(value: any) => [`${value}h`, 'MTTR']}
                  />
                  <Area
                    type="monotone"
                    dataKey="mttr"
                    stroke="none"
                    fill="url(#mttrGradient)"
                    fillOpacity={1}
                  />
                  <Line
                    type="monotone"
                    dataKey="mttr"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#f59e0b', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: '#f59e0b', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Current MTTR:</span>
                <span className="font-mono font-semibold text-foreground">{resolvedMttr}h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">-14%</span>
              </div>
            </div>
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
            <CircularProgress value={slaCompliance} label="Compliance" color="#22c55e" />
            <div className="mt-3 text-[11px] text-muted-foreground text-center">
              <span className="text-emerald-500 font-semibold">+0.3%</span> vs last month
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
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rootCauseData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={axisTickStyle} hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={axisTickStyle} width={65} />
                  <RechartsTooltip
                    contentStyle={customTooltipStyle}
                    formatter={(value: any) => [`${value}%`, 'Share']}
                  />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={14}>
                    {rootCauseData.map((entry, index) => (
                      <Cell key={entry.name} fill={rootCauseColors[index % rootCauseColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex flex-wrap gap-2 justify-center">
              {rootCauseData.map((entry, index) => (
                <span key={entry.name} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rootCauseColors[index] }} />
                  {entry.name} {entry.value}%
                </span>
              ))}
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
                  strokeDasharray={`${(automationSuccessRate / 100) * 201} 201`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-lg font-bold font-mono text-foreground">{automationSuccessRate}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-medium">+0.8%</span>
              <span>vs last month</span>
            </div>
            <div className="w-full max-w-[160px] h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-1000 ease-out"
                style={{ width: `${automationSuccessRate}%` }}
              />
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
              ${costSavings.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">this month</div>
            <div className="flex items-center gap-1.5 mt-3">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-semibold text-sm">+$2,340</span>
              <span className="text-[11px] text-muted-foreground">vs last month</span>
            </div>
            <div className="mt-3 w-full max-w-[160px]">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Last month</span>
                <span>$10,110</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: '81%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
