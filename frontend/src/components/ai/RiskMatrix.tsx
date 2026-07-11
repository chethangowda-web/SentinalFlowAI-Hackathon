import * as React from 'react';

interface RiskMatrixProps {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function RiskMatrix({ severity }: RiskMatrixProps) {
  const getSeverityCoords = () => {
    switch (severity) {
      case 'CRITICAL':
        return { r: 0, c: 2 };
      case 'HIGH':
        return { r: 1, c: 2 };
      case 'MEDIUM':
        return { r: 1, c: 1 };
      case 'LOW':
      default:
        return { r: 2, c: 0 };
    }
  };

  const active = getSeverityCoords();
  const matrix = [
    ['P3', 'P2', 'P1'],
    ['P4', 'P3', 'P2'],
    ['P5', 'P4', 'P3'],
  ];

  return (
    <div className="bg-muted/5 p-4 border rounded-md select-none space-y-3">
      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono">Risk Matrix (P1-P5)</span>
      <div className="grid grid-cols-3 gap-1">
        {matrix.map((row, rIdx) =>
          row.map((val, cIdx) => {
            const isActive = active.r === rIdx && active.c === cIdx;
            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`h-8 flex items-center justify-center rounded text-[10px] font-mono border font-bold ${
                  isActive
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-black/15 border-border/30 text-muted-foreground'
                }`}
              >
                {val}
              </div>
            );
          })
        )}
      </div>
      <div className="flex justify-between text-[8px] text-muted-foreground uppercase font-mono">
        <span>Low Impact</span>
        <span>High Impact</span>
      </div>
    </div>
  );
}

export default RiskMatrix;
