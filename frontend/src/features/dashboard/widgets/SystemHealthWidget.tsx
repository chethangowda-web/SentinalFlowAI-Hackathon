import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Circle } from 'lucide-react';

import { SystemHealthNode } from '../types';

export function SystemHealthWidget({ systemHealth }: { systemHealth: SystemHealthNode[] }) {

  const getStatusColor = (status: 'OK' | 'DEGRADED' | 'ERROR') => {
    if (status === 'OK') return 'text-emerald-400 fill-emerald-400';
    if (status === 'DEGRADED') return 'text-yellow-400 fill-yellow-400';
    return 'text-red-400 fill-red-400';
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-purple-400" />
          Infrastructure Nodes Health
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {systemHealth.map((node) => (
          <div key={node.name} className="p-3 border rounded-md bg-muted/10 flex justify-between items-center text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-slate-200">{node.name}</span>
              {node.usagePercentage !== undefined && (
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full"
                    style={{ width: `${node.usagePercentage}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              {node.usagePercentage !== undefined ? `${node.usagePercentage}%` : ''}
              <Circle className={`w-2.5 h-2.5 ${getStatusColor(node.status)}`} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default SystemHealthWidget;
