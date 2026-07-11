import * as React from 'react';
import { cn } from '@/lib/utils';

interface WidgetGridProps extends React.HTMLAttributes<HTMLDivElement> {}

export function WidgetGrid({ children, className, ...props }: WidgetGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default WidgetGrid;
