import * as React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { apiClient } from '@/api/client';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');

  React.useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    apiClient.post('/custom/v1/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-xl text-center p-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <CardTitle className="text-xl font-bold mb-2">Verifying Email Address</CardTitle>
              <CardDescription>
                Confirming your credentials with the SentinelFlow security registry...
              </CardDescription>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center py-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <CardTitle className="text-2xl font-bold mb-2">Email Verified!</CardTitle>
              <CardDescription className="mb-6">
                Your email registry check completed successfully. You can now login.
              </CardDescription>
              <Button asChild className="w-full">
                <Link to="/login">Proceed to Sign In</Link>
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center py-6">
              <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
              <CardTitle className="text-2xl font-bold text-destructive mb-2">Verification Failed</CardTitle>
              <CardDescription className="mb-6">
                The verification token is invalid or has expired. Please check your recovery inbox or request a new link.
              </CardDescription>
              <Button asChild className="w-full">
                <Link to="/login">Back to Sign In</Link>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
export default VerifyEmailPage;
