import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] border rounded-lg bg-destructive/5 border-destructive/20 max-w-xl mx-auto my-12">
      <div className="p-3 bg-destructive/15 text-destructive rounded-full mb-4">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-bold tracking-tight mb-2 text-foreground">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-6">
        An unexpected error occurred in the application shell.
      </p>
      <div className="w-full text-left bg-black/40 border p-4 rounded-md mb-6 font-mono text-xs overflow-auto max-h-[200px] text-destructive-foreground">
        {error.message || 'Unknown error'}
        {error.stack && (
          <pre className="mt-2 text-[10px] text-muted-foreground whitespace-pre-wrap">
            {error.stack}
          </pre>
        )}
      </div>
      <Button onClick={resetErrorBoundary} className="gap-2">
        <RotateCcw className="w-4 h-4" />
        Reload Application
      </Button>
    </div>
  );
}

export default ErrorFallback;
