import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const { resetPassword, isResettingPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    resetPassword({
      token,
      password: data.password,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[80svh] px-4">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground font-mono">NEW CREDENTIALS</CardTitle>
          <CardDescription>Setup new login credentials</CardDescription>
        </CardHeader>
        {!token ? (
          <CardContent className="text-center py-6 text-xs text-red-400 space-y-4">
            <p>Invalid or expired recovery parameter token. Please request another link.</p>
            <Link to="/forgot-password" className="text-purple-400 hover:underline block pt-2">
              Forgot password
            </Link>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  className="bg-black/10 text-xs h-9"
                />
                {errors.password && <span className="text-[10px] text-red-400">{errors.password.message}</span>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  className="bg-black/10 text-xs h-9"
                />
                {errors.confirmPassword && <span className="text-[10px] text-red-400">{errors.confirmPassword.message}</span>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={isResettingPassword}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white cursor-pointer h-9 text-xs"
              >
                {isResettingPassword ? 'Updating Password...' : 'Reset Password'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

export default ResetPasswordPage;
