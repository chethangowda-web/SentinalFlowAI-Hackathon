import * as React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/providers/AppProviders';
import { router } from '@/routes/router';
import { PageLoader } from '@/components/feedback/PageLoader';

export function App() {
  return (
    <AppProviders>
      <React.Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </React.Suspense>
    </AppProviders>
  );
}

export default App;
