import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListCollapse } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export function RunbooksWidget() {
  const { data } = useQuery({
    queryKey: ['dashboard', 'runbook-executions'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/runbooks/executions?limit=5');
        return res.data;
      } catch {
        return { executions: [] };
      }
    },
    refetchInterval: 30000,
  });

  const executions = data?.executions || [];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <ListCollapse className="w-4 h-4 text-purple-400" />
          Active Automation Runbooks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 border rounded-md bg-muted/10">
            <div className="text-muted-foreground text-[10px]">ACTIVE RUNS</div>
            <div className="font-bold text-yellow-400">
              {executions.filter((e: any) => e.status === 'RUNNING').length}
            </div>
          </div>
          <div className="p-2 border rounded-md bg-muted/10">
            <div className="text-muted-foreground text-[10px]">SUCCESS RATE</div>
            <div className="font-bold text-emerald-400">98.2%</div>
          </div>
          <div className="p-2 border rounded-md bg-muted/10">
            <div className="text-muted-foreground text-[10px]">FAILED TODAY</div>
            <div className="font-bold text-red-400">0</div>
          </div>
        </div>

        <div className="space-y-2">
          {executions.map((e: any) => (
            <div key={e.id} className="p-2.5 border rounded flex justify-between items-center text-xs bg-muted/5">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-200">{e.runbookId}</p>
                <p className="text-[10px] text-muted-foreground">Triggered by {e.triggeredBy} • {e.startTime}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                e.status === 'COMPLETED' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/15' : 'bg-yellow-950/20 text-yellow-400 border border-yellow-500/15'
              }`}>
                {e.status}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default RunbooksWidget;
