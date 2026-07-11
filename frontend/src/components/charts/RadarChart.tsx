import {
  ResponsiveContainer,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RadarData {
  subject: string;
  A: number;
  B?: number;
  fullMark: number;
}

interface RadarChartProps {
  title: string;
  data: RadarData[];
  className?: string;
  height?: number;
}

export function RadarChart({
  title,
  data = [],
  className,
  height = 300,
}: RadarChartProps) {
  return (
    <Card className={cn('bg-card border-border', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#2e303a" />
            <PolarAngleAxis dataKey="subject" stroke="#6b7280" fontSize={10} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#6b7280" fontSize={8} />
            <Radar name="Active Metrics" dataKey="A" stroke="#aa3bff" fill="#aa3bff" fillOpacity={0.2} />
            {data[0]?.B !== undefined && (
              <Radar name="Baseline Metrics" dataKey="B" stroke="#00f2fe" fill="#00f2fe" fillOpacity={0.1} />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2028',
                borderColor: '#2e303a',
                color: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '11px',
              }}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default RadarChart;
