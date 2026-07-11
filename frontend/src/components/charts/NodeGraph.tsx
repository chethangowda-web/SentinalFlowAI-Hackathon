import * as React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NodeData {
  id: string;
  name: string;
  value?: number;
  symbolSize?: number;
  category?: string;
}

interface EdgeData {
  source: string;
  target: string;
}

interface NodeGraphProps {
  title: string;
  nodes: NodeData[];
  edges: EdgeData[];
  className?: string;
  height?: number;
}

export function NodeGraph({
  title,
  nodes = [],
  edges = [],
  className,
  height = 300,
}: NodeGraphProps) {
  const option = {
    tooltip: {},
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: 'force',
        force: {
          repulsion: 150,
          edgeLength: 80,
        },
        data: nodes.map((node) => ({
          id: node.id,
          name: node.name,
          symbolSize: node.symbolSize || 15,
          value: node.value,
          itemStyle: {
            color: node.category === 'SERVICE' ? '#aa3bff' : '#00f2fe',
          },
        })),
        links: edges,
        roam: true,
        label: {
          show: true,
          position: 'right',
          color: '#f3f4f6',
          fontSize: 9,
        },
        lineStyle: {
          color: '#4b5563',
          width: 1.5,
          curveness: 0.1,
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

export default NodeGraph;
