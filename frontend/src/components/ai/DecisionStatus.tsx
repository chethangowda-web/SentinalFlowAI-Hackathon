import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

interface DecisionStatusProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export function DecisionStatus({ status }: DecisionStatusProps) {
  const getBadgeColors = () => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'PENDING':
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'APPROVED':
        return <ShieldCheck className="w-3.5 h-3.5 mr-1" />;
      case 'REJECTED':
        return <ShieldAlert className="w-3.5 h-3.5 mr-1" />;
      case 'PENDING':
      default:
        return <Clock className="w-3.5 h-3.5 mr-1" />;
    }
  };

  return (
    <div className="flex items-center space-x-1.5 select-none bg-muted/10 p-3.5 border rounded-md">
      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono">Decision Status:</span>
      <Badge variant="outline" className={`h-6 text-[10px] uppercase font-mono font-bold ${getBadgeColors()}`}>
        {getIcon()}
        {status}
      </Badge>
    </div>
  );
}

export default DecisionStatus;
