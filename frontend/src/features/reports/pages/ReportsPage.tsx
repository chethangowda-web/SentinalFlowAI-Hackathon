import { Card, CardContent } from '@/components/ui/card';

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Incident Reports</h1>
        <p className="text-sm text-muted-foreground">Export and analyze platform security diagnostics metrics</p>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-xs text-muted-foreground text-center">
          No reports generated for the current organization billing cycle.
        </CardContent>
      </Card>
    </div>
  );
}
export default ReportsPage;
