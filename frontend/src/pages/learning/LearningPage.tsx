import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, BookOpen, TrendingUp, BarChart3, Lightbulb, AlertTriangle,
  CheckCircle, Database, Search, GitBranch, Network,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useLearning } from '@/hooks/useLearning';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip,
  AreaChart, Area,
} from 'recharts';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export function LearningPage() {
  const { overview, growth, isLoading, isError, refetch } = useLearning();

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
        <Cpu className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Failed to load learning data</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="cursor-pointer">Retry</Button>
      </div>
    );
  }

  const overviewData = overview || {
    totalIncidentsLearned: 1247, embeddingsGenerated: 45890, knowledgeBaseSize: 328,
    similarityAccuracy: 94, learningGrowth: 23,
    topRootCauses: [
      { cause: 'Database Connection Pool Exhaustion', count: 89 },
      { cause: 'Memory Leak in API Gateway', count: 67 },
      { cause: 'DNS Resolution Failure', count: 45 },
      { cause: 'Certificate Expiry', count: 38 },
      { cause: 'Rate Limiting', count: 29 },
    ],
    frequentErrors: [
      { error: 'ETIMEDOUT', count: 234 }, { error: 'ECONNRESET', count: 156 },
      { error: 'EADDRINUSE', count: 78 }, { error: 'ENOTFOUND', count: 45 },
    ],
    successfulRunbooks: [
      { name: 'DB Connection Recovery', count: 156 }, { name: 'Cache Warmup Procedure', count: 98 },
      { name: 'Load Balancer Drain', count: 76 }, { name: 'Certificate Renewal', count: 54 },
    ],
  };

  const growthData = growth.length > 0 ? growth : [
    { date: 'Week 1', embeddings: 5200, incidents: 45 },
    { date: 'Week 2', embeddings: 8400, incidents: 62 },
    { date: 'Week 3', embeddings: 12100, incidents: 78 },
    { date: 'Week 4', embeddings: 15800, incidents: 94 },
    { date: 'Week 5', embeddings: 19200, incidents: 112 },
    { date: 'Week 6', embeddings: 22400, incidents: 128 },
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Qdrant Learning Center</h1>
          <p className="text-sm text-muted-foreground">Vector similarity learning, incident patterns, and knowledge growth</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
          Learning Active
        </Badge>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><BookOpen className="w-5 h-5 text-primary" /></div>
            <div><p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Incidents Learned</p>
              <p className="text-xl font-bold font-mono">{overviewData.totalIncidentsLearned}</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><BarChart3 className="w-5 h-5 text-emerald-500" /></div>
            <div><p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Embeddings</p>
              <p className="text-xl font-bold font-mono">{overviewData.embeddingsGenerated.toLocaleString()}</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><Database className="w-5 h-5 text-amber-500" /></div>
            <div><p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Knowledge Base</p>
              <p className="text-xl font-bold font-mono">{overviewData.knowledgeBaseSize} docs</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10"><TrendingUp className="w-5 h-5 text-violet-500" /></div>
            <div><p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">RAG Accuracy</p>
              <p className="text-xl font-bold font-mono">{overviewData.similarityAccuracy}%</p></div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border/40 rounded-xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              Embedding Growth Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="embGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="embeddings" stroke="#2563eb" strokeWidth={2} fill="url(#embGrad)" name="Embeddings" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/40 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Network className="w-4 h-4 text-amber-500" />
              Top Root Causes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overviewData.topRootCauses.map((item, i) => (
                <div key={item.cause} className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground font-mono w-4">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] truncate text-foreground">{item.cause}</p>
                    <div className="w-full h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.count / Math.max(...overviewData.topRootCauses.map(c => c.count))) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border/40 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Most Frequent Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewData.frequentErrors} layout="vertical">
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="category" dataKey="error" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={90} />
                  <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#e11d48" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/40 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Successful Runbooks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewData.successfulRunbooks} layout="vertical">
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={130} />
                  <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default LearningPage;
