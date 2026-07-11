import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WidgetContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  actions?: React.ReactNode;
}

export function WidgetContainer({
  title,
  actions,
  children,
  className,
  ...props
}: WidgetContainerProps) {
  return (
    <Card className={cn('h-full bg-card border-border flex flex-col', className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </CardTitle>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

export default WidgetContainer;
