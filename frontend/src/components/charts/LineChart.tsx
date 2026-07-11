import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChartData {
  name: string;
  [key: string]: any;
}

interface LineChartProps {
  title: string;
  data: ChartData[];
  dataKeys: string[];
  colors?: string[];
  className?: string;
  height?: number;
}

export function LineChart({
  title,
  data = [],
  dataKeys = [],
  colors = ['#aa3bff', '#00f2fe', '#f22c3d'],
  className,
  height = 300,
}: LineChartProps) {
  return (
    <Card className={cn('bg-card border-border', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2028',
                borderColor: '#2e303a',
                color: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '11px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default LineChart;
