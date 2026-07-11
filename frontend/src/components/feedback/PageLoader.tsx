import { LoadingSpinner } from './LoadingSpinner';

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-300">
      <LoadingSpinner size={40} />
      <span className="mt-4 text-sm text-muted-foreground font-medium animate-pulse">
        Loading SentinelFlow...
      </span>
    </div>
  );
}

export default PageLoader;
