import * as React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TreemapDataPoint {
  name: string;
  value: number;
  children?: TreemapDataPoint[];
}

interface TreemapProps {
  title: string;
  data: TreemapDataPoint[];
  className?: string;
  height?: number;
}

export function Treemap({
  title,
  data = [],
  className,
  height = 300,
}: TreemapProps) {
  const option = {
    tooltip: {
      formatter: (info: any) => `${info.name}: ${info.value}`,
    },
    series: [
      {
        type: 'treemap',
        data: data,
        label: {
          show: true,
          formatter: '{b}',
          color: '#f3f4f6',
          fontSize: 9,
        },
        levels: [
          {
            itemStyle: {
              borderColor: '#2e303a',
              borderWidth: 1,
              gapWidth: 1,
            },
          },
        ],
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

export default Treemap;
