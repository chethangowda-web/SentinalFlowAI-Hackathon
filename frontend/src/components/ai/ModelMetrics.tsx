import * as React from 'react';
import { Cpu, Zap, Coins } from 'lucide-react';

interface ModelMetricsProps {
  modelName: string;
  latencyMs: number;
  tokensUsed: number;
}

export function ModelMetrics({ modelName, latencyMs, tokensUsed }: ModelMetricsProps) {
  return (
    <div className="bg-card border rounded-md p-4 space-y-3 select-none text-xs">
      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Model Reasoning Metrics</span>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center py-1 border-b border-border/50">
          <div className="flex items-center text-muted-foreground">
            <Cpu className="w-3.5 h-3.5 mr-1.5" />
            <span>Reasoner LLM</span>
          </div>
          <span className="font-mono text-slate-200 font-semibold">{modelName}</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-border/50">
          <div className="flex items-center text-muted-foreground">
            <Zap className="w-3.5 h-3.5 mr-1.5 text-yellow-400" />
            <span>Response Latency</span>
          </div>
          <span className="font-mono text-yellow-300 font-bold">{(latencyMs / 1000).toFixed(2)}s</span>
        </div>

        <div className="flex justify-between items-center py-1">
          <div className="flex items-center text-muted-foreground">
            <Coins className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            <span>Tokens Consumed</span>
          </div>
          <span className="font-mono text-cyan-300 font-bold">{tokensUsed} tokens</span>
        </div>
      </div>
    </div>
  );
}

export default ModelMetrics;
