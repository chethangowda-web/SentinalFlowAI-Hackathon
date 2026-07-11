import * as React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Eye, FileText, Activity, TrendingUp, Ban, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGovernance } from '@/hooks/useGovernance';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';

function ScoreCircle({ value, label, color, icon: Icon }: { value: number; label: string; color: string; icon: React.ComponentType<{ className?: string }> }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center" style={{ color }}>
          <Icon className="w-5 h-5 mb-0.5" />
          <span className="text-xl font-bold font-mono">{value}%</span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export function GovernancePage() {
  const { overview, detectors, history, isLoading, isError, refetch } = useGovernance();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
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
        <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 cursor-pointer">
          Retry
        </button>
      </div>
    );
  }

  const overviewData = overview || {
    trustScore: 92,
    riskScore: 8,
    complianceScore: 88,
    piiDetections: 12,
    secretsDetected: 3,
    injectionAttempts: 47,
    toxicityFlags: 5,
    policyViolations: 2,
    safetyScore: 95,
    totalDecisions: 1234,
    blockedResponses: 89,
    approvedResponses: 1145,
    threatsThisWeek: 23,
  };

  const detectorsData = detectors.length > 0 ? detectors : [
    { name: 'PII Detection', status: 'ACTIVE', enabled: true, lastRun: '2m ago', totalFlags: 156, accuracy: 98 },
    { name: 'Secrets Detection', status: 'ACTIVE', enabled: true, lastRun: '1m ago', totalFlags: 42, accuracy: 99 },
    { name: 'Prompt Injection', status: 'ACTIVE', enabled: true, lastRun: '30s ago', totalFlags: 89, accuracy: 96 },
    { name: 'Toxicity Check', status: 'ACTIVE', enabled: true, lastRun: '45s ago', totalFlags: 23, accuracy: 97 },
    { name: 'Policy Enforcement', status: 'ACTIVE', enabled: true, lastRun: '1m ago', totalFlags: 67, accuracy: 95 },
  ] as any[];

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Enkrypt AI Governance</h1>
          <p className="text-sm text-muted-foreground">AI safety monitoring, compliance, and threat detection</p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          All Systems Operational
        </Badge>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCircle value={overviewData.trustScore} label="Trust Score" color="#2563eb" icon={Shield} />
        <ScoreCircle value={100 - overviewData.riskScore} label="Safety Score" color="#22c55e" icon={CheckCircle} />
        <ScoreCircle value={overviewData.complianceScore} label="Compliance" color="#8b5cf6" icon={FileText} />
        <ScoreCircle value={overviewData.safetyScore} label="AI Safety" color="#06b6d4" icon={Activity} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Blocked</p>
              <p className="text-xl font-bold font-mono">{overviewData.blockedResponses}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Approved</p>
              <p className="text-xl font-bold font-mono">{overviewData.approvedResponses}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">PII Detected</p>
              <p className="text-xl font-bold font-mono">{overviewData.piiDetections}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Secrets</p>
              <p className="text-xl font-bold font-mono">{overviewData.secretsDetected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History Chart */}
        <Card className="lg:col-span-2 bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Trust Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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

        {/* Detector Status */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Detectors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {detectorsData.map((detector: any) => (
                <div key={detector.name} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${detector.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-sm">{detector.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">{detector.accuracy}%</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {detector.totalFlags}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

export default GovernancePage;
