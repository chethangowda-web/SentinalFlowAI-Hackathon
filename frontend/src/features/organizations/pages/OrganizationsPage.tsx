import { Card, CardContent } from '@/components/ui/card';

export function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Organizations</h1>
        <p className="text-sm text-muted-foreground">Manage multi-tenancy organization nodes and API keys</p>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-xs text-muted-foreground text-center">
          Active tenant organization context selected. Organization nodes online.
        </CardContent>
      </Card>
    </div>
  );
}
export default OrganizationsPage;
