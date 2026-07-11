import { Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeBlock } from '@/components/data/CodeBlock';

interface PromptViewerProps {
  currentVersion: string;
  currentPrompt: string;
  previousVersion?: string;
  previousPrompt?: string;
  className?: string;
}

export function PromptViewer({
  currentVersion,
  currentPrompt,
  previousVersion,
  previousPrompt,
  className,
}: PromptViewerProps) {
  return (
    <Card className={cn('bg-card border-border', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between text-foreground">
          <span className="flex items-center gap-2">
            <Code className="w-4 h-4 text-purple-400" />
            Prompt Templates & Configurations
          </span>
          <span className="text-[11px] font-mono font-semibold text-muted-foreground px-2 py-0.5 border rounded bg-muted/30">
            Active: v{currentVersion}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {previousPrompt && previousVersion ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground flex justify-between">
                <span>Previous Template</span>
                <span className="font-mono text-[10px]">v{previousVersion}</span>
              </div>
              <CodeBlock value={previousPrompt} language="markdown" height="250px" />
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-purple-400 flex justify-between">
                <span>Active Template</span>
                <span className="font-mono text-[10px] text-purple-400">v{currentVersion}</span>
              </div>
              <CodeBlock value={currentPrompt} language="markdown" height="250px" />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground">Template Configuration</div>
            <CodeBlock value={currentPrompt} language="markdown" height="250px" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PromptViewer;
