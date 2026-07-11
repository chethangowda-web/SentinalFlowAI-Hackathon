import * as React from 'react';
import { RootCauseTree, RootCauseNode } from './RootCauseTree';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Database, GitBranch, Terminal } from 'lucide-react';

interface RootCauseExplorerProps {
  possibleCauses: string[];
}

export function RootCauseExplorer({ possibleCauses }: RootCauseExplorerProps) {
  const [filterText, setFilterText] = React.useState('');

  const mockRootNode: RootCauseNode = {
    id: 'root',
    label: 'Database pool starvation on auth-db-primary',
    type: 'TRIGGER',
    status: 'FAIL',
    children: [
      {
        id: 'cause-1',
        label: 'Active SQL query transaction blocking pools (92% lock rate)',
        type: 'CAUSE',
        status: 'FAIL',
        children: [
          {
            id: 'subcause-1',
            label: 'Deployment hash v2.4.1 (SQL Migration index missing on table user_sessions)',
            type: 'CAUSE',
            status: 'FAIL',
          }
        ]
      },
      {
        id: 'cause-2',
        label: 'Kubernetes Pod connection limit cap warning threshold reached (1000 conns)',
        type: 'EFFECT',
        status: 'WARN',
      }
    ]
  };

  const filteredCauses = possibleCauses.filter(cause =>
    cause.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono">RCA Pathway Node Map</span>
        </div>
        <RootCauseTree rootNode={mockRootNode} />
      </div>

      <div className="space-y-4">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Telemetry Correlations</span>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter root causes..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-7 bg-black/10 text-xs h-8 border-border"
              />
            </div>

            <div className="space-y-3">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Ranked Root Causes</span>
              {filteredCauses.map((cause, idx) => (
                <div key={cause} className="p-2 border rounded bg-muted/10 flex items-start gap-2.5 text-xs">
                  <div className="h-5 w-5 rounded bg-purple-500/10 text-purple-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                    #{idx + 1}
                  </div>
                  <p className="text-slate-300 leading-snug">{cause}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Correlation Signals</span>
              
              <div className="flex items-center space-x-2 text-[11px] text-slate-300 py-1">
                <GitBranch className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">Deployment hash: <strong>v2.4.1 (Migration)</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-300 py-1">
                <Database className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">Prometheus DB: <strong>Peak active pool spikes</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-300 py-1">
                <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">K8s log: <strong>ConnectionPoolTimeoutException</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RootCauseExplorer;
