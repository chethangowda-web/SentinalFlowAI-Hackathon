import { Card, CardContent } from '@/components/ui/card';

export function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Member Directory</h1>
        <p className="text-sm text-muted-foreground">Manage organization user accounts and role permissions</p>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-xs text-muted-foreground text-center">
          Active roster updated. Total of 12 registered platform members.
        </CardContent>
      </Card>
    </div>
  );
}
export default UsersPage;
