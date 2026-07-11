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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'operator@sentinelflow.io',
      password: 'password123',
      rememberMe: false,
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    login({
      email: data.email,
      password: data.password,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[80svh] px-4">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground font-mono">SENTINELFLOW</CardTitle>
          <CardDescription>Sign in to your portal</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className="bg-black/10 text-xs h-9"
              />
              {errors.email && <span className="text-[10px] text-red-400">{errors.email.message}</span>}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-[10px] text-purple-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className="bg-black/10 text-xs h-9"
              />
              {errors.password && <span className="text-[10px] text-red-400">{errors.password.message}</span>}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                id="rememberMe"
                type="checkbox"
                {...register('rememberMe')}
                className="h-3.5 w-3.5 rounded border-border bg-black/10 accent-purple-600 cursor-pointer"
              />
              <Label htmlFor="rememberMe" className="text-[11px] font-normal cursor-pointer select-none">
                Remember this device
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white cursor-pointer h-9 text-xs"
            >
              {isLoggingIn ? 'Authenticating...' : 'Authenticate Session'}
            </Button>
            
            <div className="text-[11px] text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-purple-400 hover:underline">
                Create organization
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;
