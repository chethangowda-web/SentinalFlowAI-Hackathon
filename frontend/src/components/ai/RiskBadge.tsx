import { cn } from '@/lib/utils';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface RiskBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  level: RiskLevel;
}

export function RiskBadge({ level, className, ...props }: RiskBadgeProps) {
  const getBadgeStyles = (val: RiskLevel) => {
    switch (val) {
      case 'CRITICAL':
        return 'bg-red-500/15 text-red-400 border-red-500/20';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/20';
      case 'MEDIUM':
        return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20';
      case 'LOW':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border font-mono tracking-wider',
        getBadgeStyles(level),
        className
      )}
      {...props}
    >
      {level}
    </span>
  );
}

export default RiskBadge;
