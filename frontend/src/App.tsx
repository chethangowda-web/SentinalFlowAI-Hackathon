import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/providers/AppProviders';
import { router } from '@/routes/router';
import { PageLoader } from '@/components/feedback/PageLoader';
import { ErrorFallback } from '@/components/feedback/ErrorFallback';

export function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AppProviders>
        <React.Suspense fallback={<PageLoader />}>
          <RouterProvider router={router} />
        </React.Suspense>
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;
