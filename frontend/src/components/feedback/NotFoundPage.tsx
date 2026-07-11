import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[500px]">
      <div className="p-4 bg-muted/40 text-muted-foreground rounded-full mb-4">
        <Compass className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">404 — Page Not Found</h1>
      <p className="text-muted-foreground text-sm max-w-md mb-8">
        The page you are looking for does not exist, has been removed, or is temporarily unavailable.
      </p>
      <Button onClick={() => (window.location.href = '/')} variant="default">
        Return to Dashboard
      </Button>
    </div>
  );
}

export default NotFoundPage;
