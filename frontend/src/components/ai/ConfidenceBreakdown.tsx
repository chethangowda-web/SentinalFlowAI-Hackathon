import * as React from 'react';

interface ConfidenceBreakdownProps {
  breakdown: Record<string, number>;
}

export function ConfidenceBreakdown({ breakdown }: ConfidenceBreakdownProps) {
  return (
    <div className="space-y-3 bg-muted/5 p-4 border rounded-md select-none">
      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono">Confidence breakdown</span>
      <div className="space-y-2.5">
        {Object.entries(breakdown).map(([label, score]) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">{label}</span>
              <span className="text-purple-300 font-bold">{score}%</span>
            </div>
            <div className="h-1.5 bg-black/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConfidenceBreakdown;
