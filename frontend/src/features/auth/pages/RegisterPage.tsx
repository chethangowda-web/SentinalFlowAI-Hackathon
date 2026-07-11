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

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { register: registerOrg, isRegistering } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      organizationName: '',
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerOrg({
      organizationName: data.organizationName,
      organizationSlug: data.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      industry: 'Technology',
      companySize: '1-10',
      country: 'US',
      timezone: 'UTC',
      ownerName: data.fullName,
      email: data.email,
      password: data.password,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[80svh] px-4">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground font-mono">SENTINELFLOW</CardTitle>
          <CardDescription>Setup your organization</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                type="text"
                {...register('organizationName')}
                className="bg-black/10 text-xs h-9"
              />
              {errors.organizationName && <span className="text-[10px] text-red-400">{errors.organizationName.message}</span>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                {...register('fullName')}
                className="bg-black/10 text-xs h-9"
              />
              {errors.fullName && <span className="text-[10px] text-red-400">{errors.fullName.message}</span>}
            </div>

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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className="bg-black/10 text-xs h-9"
              />
              {errors.password && <span className="text-[10px] text-red-400">{errors.password.message}</span>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={isRegistering}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white cursor-pointer h-9 text-xs"
            >
              {isRegistering ? 'Creating Workspace...' : 'Register Workspace'}
            </Button>
            
            <div className="text-[11px] text-center text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default RegisterPage;
