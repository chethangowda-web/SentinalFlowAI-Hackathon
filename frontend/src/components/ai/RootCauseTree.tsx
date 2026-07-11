import * as React from 'react';
import { ShieldAlert, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface RootCauseNode {
  id: string;
  label: string;
  type: 'CAUSE' | 'TRIGGER' | 'EFFECT';
  status: 'FAIL' | 'WARN' | 'OK';
  children?: RootCauseNode[];
}

interface RootCauseTreeProps {
  rootNode: RootCauseNode;
  className?: string;
}

export function RootCauseTree({ rootNode, className }: RootCauseTreeProps) {
  return (
    <Card className={cn('bg-card border-border', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <ShieldAlert className="w-4 h-4 text-purple-400" />
          AI Root Cause Failure Analysis Pathway
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto py-2">
          <TreeNode node={rootNode} />
        </div>
      </CardContent>
    </Card>
  );
}

function TreeNode({ node }: { node: RootCauseNode }) {
  const [isOpen, setIsOpen] = React.useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const getStatusIcon = (val: RootCauseNode['status']) => {
    if (val === 'FAIL') return <ShieldAlert className="w-3.5 h-3.5 text-red-400" />;
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  };

  const getTypeBadge = (type: RootCauseNode['type']) => {
    switch (type) {
      case 'CAUSE':
        return <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border bg-red-500/5 text-red-400 border-red-500/20">CAUSE</span>;
      case 'TRIGGER':
        return <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border bg-amber-500/5 text-amber-400 border-amber-500/20">TRIGGER</span>;
      default:
        return <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border bg-blue-500/5 text-blue-400 border-blue-500/20">EFFECT</span>;
    }
  };

  return (
    <div className="pl-4 relative flex flex-col gap-1.5">
      {/* Connector lines */}
      <div className="absolute left-0 top-0.5 bottom-0 border-l border-border" />
      <div className="absolute left-0 top-3.5 w-3.5 border-t border-border" />

      {/* Node contents */}
      <div className="flex items-center gap-2 py-1 px-2.5 rounded bg-muted/40 border border-border w-fit max-w-[280px] sm:max-w-[400px]">
        {hasChildren && (
          <button onClick={() => setIsOpen(!isOpen)} className="text-muted-foreground hover:text-foreground cursor-pointer">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        )}
        <div className="shrink-0">{getStatusIcon(node.status)}</div>
        <span className="text-xs font-medium text-slate-200 truncate">{node.label}</span>
        <div className="flex items-center gap-1.5 ml-auto pl-4">
          {getTypeBadge(node.type)}
        </div>
      </div>

      {/* Children Recursion */}
      {isOpen && hasChildren && node.children && (
        <div className="flex flex-col gap-1.5 ml-2 mt-1.5">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export default RootCauseTree;
