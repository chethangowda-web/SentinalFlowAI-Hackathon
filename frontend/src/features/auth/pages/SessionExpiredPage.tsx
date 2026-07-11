import * as React from 'react';
import { Link } from 'react-router-dom';
import { Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';

export function SessionExpiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-xl text-center p-6">
          <div className="flex justify-center mb-4">
            <Hourglass className="h-16 w-16 text-yellow-500 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold mb-2">Session Expired</CardTitle>
          <CardDescription className="mb-6">
            For security reasons, your active SRE session has timed out due to inactivity or token expiration.
          </CardDescription>
          <Button asChild className="w-full">
            <Link to="/login">Sign Back In</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
export default SessionExpiredPage;
