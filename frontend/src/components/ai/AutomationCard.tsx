import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Cpu, CheckCircle } from 'lucide-react';

interface AutomationCardProps {
  probability: number;
}

export function AutomationCard({ probability }: AutomationCardProps) {
  return (
    <Card className="bg-card border-border shadow-sm select-none">
      <CardContent className="p-4 flex items-center space-x-3.5">
        <div className="p-2.5 bg-emerald-500/10 rounded-full text-emerald-400">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block font-mono">Automation Success Probability</span>
          <div className="flex items-center space-x-1.5 pt-0.5">
            <span className="font-mono font-bold text-sm text-slate-100">{probability}%</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AutomationCard;
