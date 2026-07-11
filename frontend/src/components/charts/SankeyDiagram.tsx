import * as React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

interface SankeyDiagramProps {
  title: string;
  nodes: SankeyNode[];
  links: SankeyLink[];
  className?: string;
  height?: number;
}

export function SankeyDiagram({
  title,
  nodes = [],
  links = [],
  className,
  height = 300,
}: SankeyDiagramProps) {
  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
    },
    series: [
      {
        type: 'sankey',
        data: nodes,
        links: links,
        emphasis: {
          focus: 'adjacency',
        },
        lineStyle: {
          color: 'source',
          curveness: 0.5,
        },
        label: {
          color: '#f3f4f6',
          fontSize: 9,
        },
      },
    ],
    backgroundColor: 'transparent',
  };

  return (
    <Card className={cn('bg-card border-border overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent style={{ height }}>
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} lazyUpdate={true} />
      </CardContent>
    </Card>
  );
}

export default SankeyDiagram;
