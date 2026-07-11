import { Card, CardContent } from '@/components/ui/card';

export function MonitoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Live Monitoring</h1>
        <p className="text-sm text-muted-foreground">Real-time status updates and diagnostic streams</p>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-xs text-muted-foreground text-center">
          Active log listeners are listening. Awaiting socket events...
        </CardContent>
      </Card>
    </div>
  );
}
export default MonitoringPage;
