import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModelMetrics } from './ModelMetrics';
import { Sparkles, Copy, FileDown, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Citation {
  id: string;
  title: string;
  sourceName: string;
}

interface ReasoningStep {
  step: string;
  thought: string;
  confidence: number;
}

interface ReasoningViewerProps {
  reasoning?: string;
  citations?: Citation[];

  modelName?: string;
  latencyMs?: number;
  tokensUsed?: number;
  steps?: ReasoningStep[];
}

export function ReasoningViewer({
  reasoning,
  citations,
  modelName = 'SentinelFlow-Reasoner-v4',
  latencyMs = 1420,
  tokensUsed = 1024,
  steps,
}: ReasoningViewerProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const text = steps
      ? steps.map(s => `[${s.step} - ${s.confidence}%]: ${s.thought}`).join('\n')
      : reasoning || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('AI Reasoning copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const text = steps
      ? steps.map(s => `[${s.step} - ${s.confidence}%]: ${s.thought}`).join('\n')
      : reasoning || '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-reasoning-trace.txt`;
    link.click();
    toast.success('AI Reasoning trace exported');
  };

  if (reasoning) {
    return (
      <Card className="bg-card border rounded-md p-4 space-y-3 select-none text-xs">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">AI Reasoning Trace</span>
        <div className="text-slate-300 leading-relaxed font-sans whitespace-pre-line">{reasoning}</div>
        {citations && citations.length > 0 && (
          <div className="pt-2 border-t space-y-1.5">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Citations & Context</span>
            {citations.map((c) => (
              <div key={c.id} className="text-[10px] text-slate-400">
                [{c.id}] <span className="text-slate-200">{c.title}</span> ({c.sourceName})
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  const activeSteps = steps || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono">Model Thought Pathway Steps</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 text-[10px] gap-1 cursor-pointer">
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              Copy Trace
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="h-7 text-[10px] gap-1 cursor-pointer">
              <FileDown className="w-3 h-3" />
              Export
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {activeSteps.map((item) => (
            <Card key={item.step} className="bg-card border-border overflow-hidden">
              <CardContent className="p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>{item.step}</span>
                  </div>
                  <span className="font-mono text-[10px] text-purple-300 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded">
                    {item.confidence}% confidence
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-5 font-sans">
                  {item.thought}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-mono block">Telemetry & Parameters</span>
        <ModelMetrics
          modelName={modelName}
          latencyMs={latencyMs}
          tokensUsed={tokensUsed}
        />
      </div>
    </div>
  );
}

export default ReasoningViewer;
