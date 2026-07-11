import * as React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-xl text-center p-6">
          <div className="flex justify-center mb-4">
            <ShieldX className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive mb-2">Access Denied</CardTitle>
          <CardDescription className="mb-6">
            You do not possess the necessary RBAC permissions or organization scope to view this interface page.
          </CardDescription>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Switch Credentials</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
export default UnauthorizedPage;
