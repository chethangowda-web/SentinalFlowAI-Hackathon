import * as React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TreeNodeData {
  name: string;
  value?: string | number;
  children?: TreeNodeData[];
}

interface DependencyGraphProps {
  title: string;
  data: TreeNodeData;
  className?: string;
  height?: number;
}

export function DependencyGraph({
  title,
  data,
  className,
  height = 300,
}: DependencyGraphProps) {
  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
    },
    series: [
      {
        type: 'tree',
        data: [data],
        top: '1%',
        left: '7%',
        bottom: '1%',
        right: '20%',
        symbolSize: 7,
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          fontSize: 9,
          color: '#f3f4f6',
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left',
          },
        },
        emphasis: {
          focus: 'descendant',
        },
        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750,
        lineStyle: {
          color: '#4b5563',
          width: 1.5,
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

export default DependencyGraph;
