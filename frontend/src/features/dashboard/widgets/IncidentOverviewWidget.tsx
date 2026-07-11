import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { IncidentTrendItem, SeverityStatsItem } from '../types';

interface IncidentOverviewWidgetProps {
  trendsData: IncidentTrendItem[];
  severityData: SeverityStatsItem[];
  servicesData: { service: string; count: number }[];
}

export function IncidentOverviewWidget({
  trendsData,
  severityData,
}: IncidentOverviewWidgetProps) {
  const pieData = React.useMemo(() => {
    return severityData.map((item) => ({
      name: item.severity.toUpperCase(),
      value: Number(item.count),
    }));
  }, [severityData]);

  const trendChartData = React.useMemo(() => {
    return trendsData.map((item) => ({
      name: new Date(item.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      incidents: Number(item.count),
    }));
  }, [trendsData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-card border-border md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Incident Frequency Trend (30d)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[250px]">
          {trendChartData.length > 0 ? (
            <AreaChart title="Anomalies detected" data={trendChartData} dataKeys={['incidents']} height={200} />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No historical incident telemetry
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Severity Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[250px]">
          {pieData.length > 0 ? (
            <PieChart title="Severity distribution" data={pieData} height={200} />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No severity telemetry data
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default IncidentOverviewWidget;
