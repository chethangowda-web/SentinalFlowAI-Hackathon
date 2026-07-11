import * as React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricPoint {
  time: string;
  metric: number;
}

interface EventPoint {
  time: string;
  eventName: string;
  severity: string;
}

interface TimelineChartProps {
  title: string;
  metrics: MetricPoint[];
  events: EventPoint[];
  className?: string;
  height?: number;
}

export function TimelineChart({
  title,
  metrics = [],
  events = [],
  className,
  height = 300,
}: TimelineChartProps) {
  // Option maps line data for metric points, and markPoints for events overlay
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    xAxis: {
      type: 'category',
      data: metrics.map((m) => m.time),
      axisLine: {
        lineStyle: {
          color: '#4b5563',
        },
      },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 9,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#4b5563',
        },
      },
      splitLine: {
        lineStyle: {
          color: '#2e303a',
        },
      },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 9,
      },
    },
    series: [
      {
        name: 'Metric Level',
        type: 'line',
        data: metrics.map((m) => m.metric),
        smooth: true,
        lineStyle: {
          color: '#aa3bff',
          width: 2,
        },
        itemStyle: {
          color: '#aa3bff',
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 22,
          data: events.map((e) => {
            const timeIndex = metrics.findIndex((m) => m.time === e.time);
            return {
              name: e.eventName,
              value: e.severity === 'CRITICAL' ? 'CRIT' : 'WARN',
              coord: [timeIndex >= 0 ? timeIndex : 0, metrics[timeIndex >= 0 ? timeIndex : 0]?.metric || 50],
              itemStyle: {
                color: e.severity === 'CRITICAL' ? '#f22c3d' : '#ffaa00',
              },
            };
          }),
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

export default TimelineChart;
