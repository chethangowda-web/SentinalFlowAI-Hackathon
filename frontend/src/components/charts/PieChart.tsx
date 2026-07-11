import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PieData {
  name: string;
  value: number;
}

interface PieChartProps {
  title: string;
  data: PieData[];
  colors?: string[];
  className?: string;
  height?: number;
}

export function PieChart({
  title,
  data = [],
  colors = ['#aa3bff', '#00f2fe', '#f22c3d', '#ffaa00', '#10b981'],
  className,
  height = 300,
}: PieChartProps) {
  return (
    <Card className={cn('bg-card border-border', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2028',
                borderColor: '#2e303a',
                color: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '11px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default PieChart;
