import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RiskBadge } from './RiskBadge';
import { Shield, Clock, AlertTriangle, Activity } from 'lucide-react';

interface AIOverviewCardProps {
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impact: string;
  eta: string;
  title: string;
}

export function AIOverviewCard({ confidence, severity, impact, eta, title }: AIOverviewCardProps) {
  return (
    <Card className="bg-card border-border shadow-md">
      <CardContent className="p-4 space-y-4 select-none">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono">Incident Summary</span>
          <h3 className="text-sm font-semibold text-slate-200 mt-0.5">{title}</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-red-500/10 rounded">
              <Shield className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Risk Level</span>
              <RiskBadge level={severity} />
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-purple-500/10 rounded">
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">AI Confidence</span>
              <span className="font-mono font-bold text-xs text-purple-300">{confidence}%</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-500/10 rounded">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Business Impact</span>
              <span className="font-semibold text-xs text-amber-300">{impact}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-500/10 rounded">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Estimated resolution</span>
              <span className="font-semibold text-xs text-blue-300">{eta}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AIOverviewCard;
