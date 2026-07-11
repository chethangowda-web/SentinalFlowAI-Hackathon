import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play, CheckSquare, Clock, AlertTriangle, CheckCircle,
  History, Zap, Shield, ArrowRight, Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const RUNBOOKS = [
  { id: '1', name: 'Database Pool Auto-Scaling', duration: '3s', trigger: 'Auto', lastRun: '2m ago', success: true, executions: 156 },
  { id: '2', name: 'Restart Auth Cluster Pods', duration: '12s', trigger: 'Approval', lastRun: '1h ago', success: true, executions: 89 },
  { id: '3', name: 'Flush Redis Cache Sessions', duration: '1s', trigger: 'Auto', lastRun: '30m ago', success: true, executions: 234 },
  { id: '4', name: 'Scale Up API Gateway', duration: '8s', trigger: 'Auto', lastRun: '15m ago', success: true, executions: 67 },
  { id: '5', name: 'Certificate Renewal', duration: '45s', trigger: 'Approval', lastRun: '1d ago', success: false, executions: 23 },
  { id: '6', name: 'Rollback Deployments', duration: '25s', trigger: 'Manual', lastRun: '3d ago', success: true, executions: 12 },
];

const EXECUTION_HISTORY = [
  { id: 'e1', runbook: 'Database Pool Auto-Scaling', status: 'SUCCESS', duration: '3.2s', time: '2m ago', by: 'Auto-trigger' },
  { id: 'e2', runbook: 'Flush Redis Cache Sessions', status: 'SUCCESS', duration: '0.9s', time: '30m ago', by: 'Auto-trigger' },
  { id: 'e3', runbook: 'Scale Up API Gateway', status: 'SUCCESS', duration: '7.8s', time: '15m ago', by: 'Incident INC-203' },
  { id: 'e4', runbook: 'Restart Auth Cluster Pods', status: 'FAILED', duration: '12.1s', time: '1h ago', by: 'Manual — Alice' },
  { id: 'e5', runbook: 'Certificate Renewal', status: 'SUCCESS', duration: '44.5s', time: '1d ago', by: 'Scheduled' },
];

function RunbookCard({ runbook, index }: { runbook: typeof RUNBOOKS[0]; index: number }) {
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => setIsExecuting(false), 2000);
  };

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
            runbook.trigger === 'Auto' ? 'bg-emerald-500/10' : runbook.trigger === 'Approval' ? 'bg-amber-500/10' : 'bg-blue-500/10'
          )}>
            <CheckSquare className={cn(
              'w-4 h-4',
              runbook.trigger === 'Auto' ? 'text-emerald-400' : runbook.trigger === 'Approval' ? 'text-amber-400' : 'text-blue-400'
            )} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{runbook.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={cn(
                'text-[9px] px-1.5 py-0',
                runbook.trigger === 'Auto' ? 'border-emerald-500/20 text-emerald-400' :
                runbook.trigger === 'Approval' ? 'border-amber-500/20 text-amber-400' :
                'border-blue-500/20 text-blue-400'
              )}>
                {runbook.trigger}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{runbook.executions} runs</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">{runbook.duration}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground">Last {runbook.lastRun}</span>
        </div>
        <Button
          size="sm"
          onClick={handleExecute}
          disabled={isExecuting}
          className={cn(
            'gap-1.5 text-[11px] h-8 px-3 cursor-pointer transition-all',
            isExecuting && 'opacity-70'
          )}
        >
          {isExecuting ? (
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

  const filteredRunbooks = RUNBOOKS.filter(rb =>
    rb.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: RUNBOOKS.length,
    auto: RUNBOOKS.filter(r => r.trigger === 'Auto').length,
    approval: RUNBOOKS.filter(r => r.trigger === 'Approval').length,
    success: RUNBOOKS.filter(r => r.success).length,
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Runbooks</h1>
          <p className="text-sm text-muted-foreground">Automated remediation procedures and incident response playbooks</p>
        </div>
      </div>

      {/* Stats */}
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
            <div><p className="text-[10px] text-muted-foreground">Success Rate</p><p className="text-lg font-bold font-mono">{(stats.success / stats.total * 100).toFixed(0)}%</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <Input
          placeholder="Search runbooks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-card border-border/40 text-xs h-9 rounded-xl"
        />
      </div>

      {/* Runbooks Grid */}
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

      {/* Execution History */}
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
                {EXECUTION_HISTORY.map((exec) => (
                  <tr key={exec.id} className="hover:bg-accent/10 transition-colors">
                    <td className="font-medium text-foreground text-xs">{exec.runbook}</td>
                    <td>
                      <Badge variant={exec.status === 'SUCCESS' ? 'default' : 'destructive'} className={cn(
                        'text-[9px] px-1.5 py-0',
                        exec.status === 'SUCCESS' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15'
                      )}>
                        {exec.status}
                      </Badge>
                    </td>
                    <td className="font-mono text-xs">{exec.duration}</td>
                    <td className="text-muted-foreground text-xs">{exec.time}</td>
                    <td className="text-xs">{exec.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default RunbooksPage;
