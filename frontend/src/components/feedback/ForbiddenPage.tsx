import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[500px]">
      <div className="p-4 bg-red-500/10 text-red-500 rounded-full mb-4">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">403 — Access Denied</h1>
      <p className="text-muted-foreground text-sm max-w-md mb-8">
        You do not have the required permissions or roles to view this page. If you believe this is in error, please contact your administrator.
      </p>
      <Button onClick={() => (window.location.href = '/')} variant="default">
        Return to Dashboard
      </Button>
    </div>
  );
}

export default ForbiddenPage;
