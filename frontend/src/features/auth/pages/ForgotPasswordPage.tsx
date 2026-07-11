import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const { forgotPassword, isSendingResetLink, isResetLinkSent } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    forgotPassword(data);
  };

  return (
    <div className="flex items-center justify-center min-h-[80svh] px-4">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground font-mono">RECOVER ACCESS</CardTitle>
          <CardDescription>Retrieve account credentials</CardDescription>
        </CardHeader>
        {isResetLinkSent ? (
          <CardContent className="text-center py-6 text-xs text-muted-foreground space-y-4">
            <p className="text-emerald-400">A password recovery link has been dispatched to your email address.</p>
            <Link to="/login" className="text-purple-400 hover:underline block pt-2">
              Return to login
            </Link>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="bg-black/10 text-xs h-9"
                  placeholder="Enter email to get recovery link"
                />
                {errors.email && <span className="text-[10px] text-red-400">{errors.email.message}</span>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSendingResetLink}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white cursor-pointer h-9 text-xs"
              >
                {isSendingResetLink ? 'Sending Reset Link...' : 'Send Recovery Email'}
              </Button>
              
              <div className="text-[11px] text-center text-muted-foreground">
                <Link to="/login" className="text-purple-400 hover:underline">
                  Return to login
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

export default ForgotPasswordPage;
