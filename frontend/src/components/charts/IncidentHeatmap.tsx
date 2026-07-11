import * as React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HeatmapDataPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

interface IncidentHeatmapProps {
  title: string;
  data: HeatmapDataPoint[];
  year?: string;
  className?: string;
  height?: number;
}

export function IncidentHeatmap({
  title,
  data = [],
  year = '2026',
  className,
  height = 200,
}: IncidentHeatmapProps) {
  const chartData = data.map((item) => [item.date, item.count]);

  const option = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => `${params.value[0]}: ${params.value[1]} incidents`,
    },
    visualMap: {
      min: 0,
      max: 10,
      type: 'piecewise',
      orient: 'horizontal',
      left: 'center',
      top: 0,
      textStyle: {
        color: '#9ca3af',
      },
      pieces: [
        { min: 0, max: 0, label: 'No Incidents', color: '#1f2028' },
        { min: 1, max: 2, label: 'Low', color: '#1e3a8a' },
        { min: 3, max: 5, label: 'Medium', color: '#d97706' },
        { min: 6, max: 10, label: 'High', color: '#dc2626' },
      ],
    },
    calendar: {
      top: 40,
      left: 30,
      right: 30,
      cellSize: ['auto', 13],
      range: year,
      itemStyle: {
        borderWidth: 0.5,
        borderColor: '#2e303a',
      },
      splitLine: {
        show: false,
      },
      dayLabel: {
        color: '#9ca3af',
        fontSize: 9,
      },
      monthLabel: {
        color: '#9ca3af',
        fontSize: 9,
      },
      yearLabel: { show: false },
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: chartData,
    },
    backgroundColor: 'transparent',
  };

  return (
    <Card className={cn('bg-card border-border overflow-hidden', className)}>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent style={{ height }}>
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} lazyUpdate={true} />
      </CardContent>
    </Card>
  );
}

export default IncidentHeatmap;
