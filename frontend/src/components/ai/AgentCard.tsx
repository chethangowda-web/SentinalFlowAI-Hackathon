import { Bot, CheckCircle, Activity, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type AgentStatus = 'IDLE' | 'BUSY' | 'ERROR' | 'OFFLINE';

interface AgentCardProps {
  name: string;
  status: AgentStatus;
  model: string;
  runsCount: number;
  successRate: number; // percentage (0-100)
  lastActive: string;
  className?: string;
}

export function AgentCard({
  name,
  status,
  model,
  runsCount,
  successRate,
  className,
  lastActive: _lastActive,
}: AgentCardProps) {
  const getStatusColor = (val: AgentStatus) => {
    switch (val) {
      case 'IDLE':
        return 'bg-emerald-500';
      case 'BUSY':
        return 'bg-blue-500 animate-pulse';
      case 'ERROR':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <Card className={cn('bg-card border-border hover:border-purple-500/30 transition-all duration-300', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between text-foreground">
          <span className="flex items-center gap-2">
            <Bot className="w-4.5 h-4.5 text-purple-400" />
            {name}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', getStatusColor(status))} />
            <span className="text-[10px] font-mono font-semibold text-muted-foreground">{status}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agent Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
          <div className="space-y-0.5">
            <div className="text-muted-foreground flex items-center gap-1">
              <Server className="w-3.5 h-3.5 shrink-0" />
              LLM Model
            </div>
            <div className="font-mono text-slate-200 font-semibold">{model}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-muted-foreground flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 shrink-0" />
              Executions
            </div>
            <div className="font-mono text-slate-200 font-semibold">{runsCount} runs</div>
          </div>
          <div className="space-y-0.5 col-span-2 pt-1.5 border-t">
            <div className="flex justify-between items-center mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                Success Rate
              </span>
              <span className="font-mono text-slate-200 font-semibold">{successRate}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-purple-500 transition-all"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AgentCard;
