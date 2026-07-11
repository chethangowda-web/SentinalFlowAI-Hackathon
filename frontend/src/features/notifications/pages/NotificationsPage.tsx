import { Card, CardContent } from '@/components/ui/card';

export function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground">Manage user subscriptions and platform alert dispatches</p>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-xs text-muted-foreground text-center">
          Notification alerts console is synchronized. No new notifications.
        </CardContent>
      </Card>
    </div>
  );
}
export default NotificationsPage;
