import * as React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GraphNode {
  name: string;
  category: number;
  value?: number;
  symbolSize?: number;
}

interface GraphLink {
  source: string;
  target: string;
}

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  categories?: string[];
  className?: string;
}

export function KnowledgeGraph({
  nodes = [],
  links = [],
  categories = [],
  className,
}: KnowledgeGraphProps) {
  const option = {
    title: {
      show: false,
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}',
    },
    legend: [
      {
        data: categories,
        textStyle: {
          color: '#9ca3af',
          fontSize: 10,
        },
        orient: 'horizontal',
        bottom: 10,
      },
    ],
    series: [
      {
        name: 'Knowledge base relationships',
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        categories: categories.map((name) => ({ name })),
        roam: true,
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
          color: '#f3f4f6',
          fontSize: 10,
        },
        force: {
          repulsion: 100,
          edgeLength: 60,
        },
        lineStyle: {
          color: '#4b5563',
          width: 1.5,
          curveness: 0.1,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 3,
          },
        },
      },
    ],
    backgroundColor: 'transparent',
  };

  return (
    <Card className={cn('bg-card border-border overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          Knowledge Base Connectivity Diagram
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] p-0 relative">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          lazyUpdate={true}
        />
      </CardContent>
    </Card>
  );
}

export default KnowledgeGraph;
