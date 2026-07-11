import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Play, CheckSquare, Clock, CheckCircle,
  History, Zap, Shield, Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import runbookApi, { type Runbook, type RunbookExecution } from '@/api/runbook';

function RunbookCard({ runbook, index }: { runbook: Runbook; index: number }) {
  const queryClient = useQueryClient();

  const executeMutation = useMutation({
    mutationFn: () => runbookApi.executeRunbook(runbook.id, 'manual'),
    onSuccess: (_data) => {
      toast.success(`Runbook "${runbook.name}" triggered successfully`);
      queryClient.invalidateQueries({ queryKey: ['runbooks'] });
      queryClient.invalidateQueries({ queryKey: ['runbook-executions'] });
    },
    onError: () => toast.error(`Failed to execute "${runbook.name}"`),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="enterprise-card p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            runbook.severity === 'LOW' || runbook.triggerEvent === 'auto' ? 'bg-emerald-500/10' :
            runbook.approvalRequired ? 'bg-amber-500/10' : 'bg-blue-500/10'
          )}>
            <CheckSquare className={cn(
              'w-4 h-4',
              runbook.severity === 'LOW' || runbook.triggerEvent === 'auto' ? 'text-emerald-400' :
              runbook.approvalRequired ? 'text-amber-400' : 'text-blue-400'
            )} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{runbook.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={cn(
                'text-[9px] px-1.5 py-0',
                runbook.triggerEvent === 'auto' ? 'border-emerald-500/20 text-emerald-400' :
                runbook.approvalRequired ? 'border-amber-500/20 text-amber-400' :
                'border-blue-500/20 text-blue-400'
              )}>
                {runbook.approvalRequired ? 'Approval' : runbook.triggerEvent === 'auto' ? 'Auto' : 'Manual'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground">Service: {runbook.service}</span>
        </div>
        <Button
          size="sm"
          onClick={() => executeMutation.mutate()}
          disabled={executeMutation.isPending || !runbook.enabled}
          className={cn(
            'gap-1.5 text-[11px] h-8 px-3 cursor-pointer transition-all',
            executeMutation.isPending && 'opacity-70'
          )}
        >
          {executeMutation.isPending ? (
            <>
              <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              Execute
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

export function RunbooksPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: runbooks, isLoading, isError, error } = useQuery({
    queryKey: ['runbooks'],
    queryFn: runbookApi.listRunbooks,
    refetchInterval: 30000,
  });

  const { data: allExecutions } = useQuery({
    queryKey: ['runbook-executions'],
    queryFn: async () => {
      if (!runbooks || runbooks.length === 0) return [];
      const results = await Promise.allSettled(
        runbooks.slice(0, 5).map((rb) => runbookApi.executionHistory(rb.id))
      );
      return results
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => (r as PromiseFulfilledResult<RunbookExecution[]>).value)
        .slice(0, 10);
    },
    enabled: !!runbooks && runbooks.length > 0,
    refetchInterval: 30000,
  });

  const filteredRunbooks = (runbooks || []).filter((rb) =>
    rb.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Runbooks</h1>
          <p className="text-sm text-muted-foreground">Automated remediation procedures and incident response playbooks</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
        <Skeleton className="h-9 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </motion.div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Runbooks</h1>
          <p className="text-sm text-muted-foreground">Automated remediation procedures and incident response playbooks</p>
        </div>
        <div className="text-center text-xs text-red-400 py-12 border rounded-lg bg-card/20">
          Failed to load runbooks: {(error as Error)?.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  if (!runbooks || runbooks.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Runbooks</h1>
          <p className="text-sm text-muted-foreground">Automated remediation procedures and incident response playbooks</p>
        </div>
        <div className="text-center text-xs text-muted-foreground py-12 border rounded-lg bg-card/20">
          No runbooks found.
        </div>
      </div>
    );
  }

  const stats = {
    total: runbooks.length,
    auto: runbooks.filter((r) => r.triggerEvent === 'auto' || !r.approvalRequired).length,
    approval: runbooks.filter((r) => r.approvalRequired).length,
    enabled: runbooks.filter((r) => r.enabled).length,
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Runbooks</h1>
          <p className="text-sm text-muted-foreground">Automated remediation procedures and incident response playbooks</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><CheckSquare className="w-4 h-4 text-primary" /></div>
            <div><p className="text-[10px] text-muted-foreground">Total</p><p className="text-lg font-bold font-mono">{stats.total}</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><Zap className="w-4 h-4 text-emerald-400" /></div>
            <div><p className="text-[10px] text-muted-foreground">Auto</p><p className="text-lg font-bold font-mono">{stats.auto}</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><Shield className="w-4 h-4 text-amber-400" /></div>
            <div><p className="text-[10px] text-muted-foreground">Approval</p><p className="text-lg font-bold font-mono">{stats.approval}</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/40 rounded-xl">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle className="w-4 h-4 text-emerald-400" /></div>
            <div><p className="text-[10px] text-muted-foreground">Enabled</p><p className="text-lg font-bold font-mono">{stats.enabled}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <Input
          placeholder="Search runbooks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-card border-border/40 text-xs h-9 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRunbooks.map((rb, i) => (
          <RunbookCard key={rb.id} runbook={rb} index={i} />
        ))}
        {filteredRunbooks.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-16">
            <div className="empty-state-illustration">
              <Search className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">No runbooks match your search</p>
          </div>
        )}
      </div>

      <Card className="bg-card border-border/40 rounded-xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4" />
            Recent Executions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Runbook</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Time</th>
                  <th>Triggered By</th>
                </tr>
              </thead>
              <tbody>
                {allExecutions && allExecutions.length > 0 ? allExecutions.map((exec) => (
                  <tr key={exec.id} className="hover:bg-accent/10 transition-colors">
                    <td className="font-medium text-foreground text-xs">{exec.runbookId}</td>
                    <td>
                      <Badge variant={exec.status === 'COMPLETED' ? 'default' : exec.status === 'FAILED' ? 'destructive' : 'secondary'} className={cn(
                        'text-[9px] px-1.5 py-0',
                        exec.status === 'COMPLETED' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15',
                        exec.status === 'FAILED' && 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/15'
                      )}>
                        {exec.status}
                      </Badge>
                    </td>
                    <td className="font-mono text-xs">{exec.endTime ? `${Math.round((new Date(exec.endTime).getTime() - new Date(exec.startTime).getTime()) / 1000)}s` : '-'}</td>
                    <td className="text-muted-foreground text-xs">{new Date(exec.startTime).toLocaleString()}</td>
                    <td className="text-xs">{exec.triggeredBy}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="text-center text-xs text-muted-foreground py-8">No executions recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default RunbooksPage;
