import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';

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
    <div className="flex items-center justify-center min-h-screen px-4 bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/25 mb-4"
          >
            <Shield className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up your organization</p>
        </div>

        <Card className="bg-card border-border/40 shadow-2xl shadow-black/20 rounded-2xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1.5">
                <Label htmlFor="organizationName" className="text-xs font-medium">Organization Name</Label>
                <Input
                  id="organizationName"
                  type="text"
                  placeholder="Acme Corp"
                  {...register('organizationName')}
                  className="bg-background text-xs h-10 border-border/40 rounded-xl focus:border-primary/30"
                />
                {errors.organizationName && <span className="text-[10px] text-red-400">{errors.organizationName.message}</span>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jane Smith"
                  {...register('fullName')}
                  className="bg-background text-xs h-10 border-border/40 rounded-xl focus:border-primary/30"
                />
                {errors.fullName && <span className="text-[10px] text-red-400">{errors.fullName.message}</span>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@acme.com"
                  {...register('email')}
                  className="bg-background text-xs h-10 border-border/40 rounded-xl focus:border-primary/30"
                />
                {errors.email && <span className="text-[10px] text-red-400">{errors.email.message}</span>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  {...register('password')}
                  className="bg-background text-xs h-10 border-border/40 rounded-xl focus:border-primary/30"
                />
                {errors.password && <span className="text-[10px] text-red-400">{errors.password.message}</span>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pb-6">
              <Button
                type="submit"
                disabled={isRegistering}
                className="w-full rounded-xl h-10 text-xs font-semibold cursor-pointer gap-2"
              >
                {isRegistering ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creating Workspace...
                  </>
                ) : (
                  <>
                    Create Workspace
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>

              <div className="text-[11px] text-center text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

export default RegisterPage;
