import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle, Eye, FileText, Activity,
  TrendingUp, Ban, ThumbsUp, Lock, Fingerprint, Gauge,
  Database, ShieldAlert, Users, Search as SearchIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useGovernance } from '@/hooks/useGovernance';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

function ScoreRing({ value, label, color, icon: Icon, subtitle }: {
  value: number; label: string; color: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <motion.div
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/40"
      whileHover={{ y: -2, borderColor: `${color}30` }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative flex items-center justify-center w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <motion.circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            initial={false}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <Icon className="w-5 h-5 mb-1" style={{ color }} />
          <motion.span
            className="text-2xl font-bold font-mono text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {value}%
          </motion.span>
        </div>
      </div>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {subtitle && <span className="text-[9px] text-muted-foreground/60">{subtitle}</span>}
    </motion.div>
  );
}

function DetectorCard({ detector }: { detector: any }) {
  return (
    <motion.div
      className="flex items-center justify-between p-3 rounded-xl bg-accent/20 border border-border/40 hover:bg-accent/30 transition-all"
      whileHover={{ x: 2 }}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-2 h-2 rounded-full',
          detector.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
        )} />
        <div>
          <p className="text-xs font-medium text-foreground">{detector.name}</p>
          <p className="text-[10px] text-muted-foreground font-mono">Last run: {detector.lastRun}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-[10px] px-2 py-0">
          {detector.totalFlags} flags
        </Badge>
        <span className="text-[10px] font-mono text-emerald-400 font-semibold">{detector.accuracy}%</span>
      </div>
    </motion.div>
  );
}

export function GovernancePage() {
  const { overview, detectors, history, isLoading, isError, refetch } = useGovernance();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card border-border/50">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center space-y-4">
        <Shield className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Failed to load governance data</p>
        <Button onClick={() => refetch()} size="sm" variant="outline" className="cursor-pointer">
          Retry
        </Button>
      </div>
    );
  }

  const overviewData = overview || {
    trustScore: 92, riskScore: 8, complianceScore: 88, piiDetections: 12,
    secretsDetected: 3, injectionAttempts: 47, toxicityFlags: 5,
    policyViolations: 2, safetyScore: 95, totalDecisions: 1234,
    blockedResponses: 89, approvedResponses: 1145, threatsThisWeek: 23,
  };

  const detectorsData = detectors.length > 0 ? detectors : [
    { name: 'PII Detection', status: 'ACTIVE', enabled: true, lastRun: '2m ago', totalFlags: 156, accuracy: 98 },
    { name: 'Secrets Detection', status: 'ACTIVE', enabled: true, lastRun: '1m ago', totalFlags: 42, accuracy: 99 },
    { name: 'Prompt Injection', status: 'ACTIVE', enabled: true, lastRun: '30s ago', totalFlags: 89, accuracy: 96 },
    { name: 'Toxicity Check', status: 'ACTIVE', enabled: true, lastRun: '45s ago', totalFlags: 23, accuracy: 97 },
    { name: 'Policy Enforcement', status: 'ACTIVE', enabled: true, lastRun: '1m ago', totalFlags: 67, accuracy: 95 },
  ];

  const historyData = history.length > 0 ? history : [
    { date: 'Mon', score: 88, threats: 12 },
    { date: 'Tue', score: 91, threats: 8 },
    { date: 'Wed', score: 89, threats: 15 },
    { date: 'Thu', score: 93, threats: 6 },
    { date: 'Fri', score: 92, threats: 10 },
    { date: 'Sat', score: 94, threats: 4 },
    { date: 'Sun', score: 92, threats: 7 },
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Enkrypt AI Governance</h1>
          <p className="text-sm text-muted-foreground">AI safety monitoring, compliance, and threat detection platform</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
          All Systems Operational
        </Badge>
      </motion.div>

      {/* Security Score Rings */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ScoreRing value={overviewData.trustScore} label="Trust Score" color="#2563EB" icon={Shield} subtitle="AI trustworthiness" />
        <ScoreRing value={100 - overviewData.riskScore} label="Safety Score" color="#22C55E" icon={CheckCircle} subtitle="Overall safety" />
        <ScoreRing value={overviewData.complianceScore} label="Compliance" color="#A78BFA" icon={FileText} subtitle="Policy adherence" />
        <ScoreRing value={overviewData.safetyScore} label="AI Safety" color="#06B6D4" icon={Activity} subtitle="Model safety" />
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-500/10">
              <Ban className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Blocked</p>
              <p className="text-xl font-bold font-mono text-foreground">{overviewData.blockedResponses}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10">
              <ThumbsUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Approved</p>
              <p className="text-xl font-bold font-mono text-foreground">{overviewData.approvedResponses}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10">
              <Eye className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">PII Detected</p>
              <p className="text-xl font-bold font-mono text-foreground">{overviewData.piiDetections}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Secrets</p>
              <p className="text-xl font-bold font-mono text-foreground">{overviewData.secretsDetected}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Threat Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-3 flex items-center gap-3">
            <Fingerprint className="w-4 h-4 text-red-400" />
            <div>
              <p className="text-[10px] text-muted-foreground">Injection Attempts</p>
              <p className="text-lg font-bold font-mono text-foreground">{overviewData.injectionAttempts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-3 flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-muted-foreground">Policy Violations</p>
              <p className="text-lg font-bold font-mono text-foreground">{overviewData.policyViolations}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <div>
              <p className="text-[10px] text-muted-foreground">Threats This Week</p>
              <p className="text-lg font-bold font-mono text-foreground">{overviewData.threatsThisWeek}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-3 flex items-center gap-3">
            <Database className="w-4 h-4 text-violet-400" />
            <div>
              <p className="text-[10px] text-muted-foreground">Total Decisions</p>
              <p className="text-lg font-bold font-mono text-foreground">{overviewData.totalDecisions}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History Chart */}
        <Card className="lg:col-span-2 bg-card border-border/40 rounded-xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Trust Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="trustGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]} />
                  <RechartsTooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} fill="url(#trustGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detectors */}
        <Card className="bg-card border-border/40 rounded-xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Active Detectors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {detectorsData.map((detector: any) => (
                <DetectorCard key={detector.name} detector={detector} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom: Threat Timeline */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card border-border/40 rounded-xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Threat Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <p className="text-[10px] text-muted-foreground">Prompt Injection</p>
                <p className="text-lg font-bold font-mono text-red-400">{overviewData.injectionAttempts}</p>
                <p className="text-[9px] text-muted-foreground/60">attempts blocked</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <p className="text-[10px] text-muted-foreground">Toxicity Flags</p>
                <p className="text-lg font-bold font-mono text-amber-400">{overviewData.toxicityFlags}</p>
                <p className="text-[9px] text-muted-foreground/60">content violations</p>
              </div>
              <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                <p className="text-[10px] text-muted-foreground">PII Exposures</p>
                <p className="text-lg font-bold font-mono text-rose-400">{overviewData.piiDetections}</p>
                <p className="text-[9px] text-muted-foreground/60">detected & masked</p>
              </div>
              <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                <p className="text-[10px] text-muted-foreground">Secrets Leaked</p>
                <p className="text-lg font-bold font-mono text-violet-400">{overviewData.secretsDetected}</p>
                <p className="text-[9px] text-muted-foreground/60">rotated & secured</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-[10px] text-muted-foreground">Policy OK</p>
                <p className="text-lg font-bold font-mono text-emerald-400">{overviewData.totalDecisions - overviewData.policyViolations}</p>
                <p className="text-[9px] text-muted-foreground/60">compliant decisions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default GovernancePage;
