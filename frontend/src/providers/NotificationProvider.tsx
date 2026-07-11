import * as React from 'react';
import { toast } from 'sonner';
import { useRealtimeStore } from '@/store/realtimeStore';
import { Toaster } from '@/components/ui/sonner';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { incidentBuffer } = useRealtimeStore();

  React.useEffect(() => {
    if (incidentBuffer.length > 0) {
      const latest = incidentBuffer[0];
      toast(`New Incident Alert [${latest.severity}]`, {
        description: latest.title,
        action: {
          label: 'View details',
          onClick: () => {
            window.location.href = `/incidents?id=${latest.id}`;
          },
        },
      });
    }
  }, [incidentBuffer]);

  return (
    <>
      <Toaster position="top-right" closeButton richColors />
      {children}
    </>
  );
}

export default NotificationProvider;
