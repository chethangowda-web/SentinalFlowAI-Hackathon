import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[500px]">
      <div className="p-4 bg-destructive/10 text-destructive rounded-full mb-4">
        <AlertCircle className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">500 — Server Error</h1>
      <p className="text-muted-foreground text-sm max-w-md mb-8">
        We encountered a internal server error while processing your request. Please try reloading or contact support.
      </p>
      <Button onClick={() => window.location.reload()} variant="default">
        Reload Page
      </Button>
    </div>
  );
}

export default ErrorPage;
