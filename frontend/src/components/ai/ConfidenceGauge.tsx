import * as React from 'react';

interface ConfidenceGaugeProps {
  score: number;
}

export function ConfidenceGauge({ score }: ConfidenceGaugeProps) {
  const radius = 32;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center space-y-2 bg-muted/10 p-4 border rounded-md select-none">
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="rgba(255, 255, 255, 0.05)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="hsl(270, 75%, 60%)"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <span className="absolute font-mono font-bold text-xs text-slate-100">{score}%</span>
      </div>
      <div className="text-center">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono">Overall Score</span>
      </div>
    </div>
  );
}

export default ConfidenceGauge;
