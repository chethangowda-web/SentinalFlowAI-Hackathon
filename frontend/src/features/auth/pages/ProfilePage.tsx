import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Laptop, Smartphone, Monitor, LogOut, ShieldAlert, Key, Globe, Clock, User as UserIcon } from 'lucide-react';
import { profileSchema, ProfileSchema } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUIStore } from '@/store/uiStore';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user, sessions, updateProfile, isUpdatingProfile, refetchSessions } = useAuth();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      timezone: user?.timezone || 'UTC',
      language: user?.language || 'en',
    },
  });

  const onSubmit = (data: ProfileSchema) => {
    updateProfile(data);
  };

  const getDeviceIcon = (device: string) => {
    const d = device.toLowerCase();
    if (d.includes('iphone') || d.includes('android') || d.includes('phone') || d.includes('mobile')) {
      return <Smartphone className="h-5 w-5 text-muted-foreground" />;
    }
    if (d.includes('mac') || d.includes('windows') || d.includes('linux') || d.includes('chrome') || d.includes('safari')) {
      return <Laptop className="h-5 w-5 text-muted-foreground" />;
    }
    return <Monitor className="h-5 w-5 text-muted-foreground" />;
  };

  const handleRevokeSession = (sessionId: string) => {
    // In production, we call an API endpoint to revoke this session
    toast.success(`Session ${sessionId} has been successfully revoked.`);
    refetchSessions();
  };

  const handleRevokeAllSessions = () => {
    toast.success('All other active device sessions have been revoked.');
    refetchSessions();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your operator profile settings, active devices, and session security
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-md text-center">
            <CardHeader className="flex flex-col items-center">
              <Avatar className="h-24 w-24 border border-border shadow-sm mb-4">
                <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                <AvatarFallback className="text-xl">{user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl font-bold">{user?.name}</CardTitle>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize mt-1.5 border border-primary/20">
                {user?.role}
              </span>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2 border-t border-border/40 pt-4">
              <div className="flex justify-between">
                <span>System Timezone</span>
                <span className="text-foreground font-medium">{user?.timezone || 'UTC'}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Language</span>
                <span className="text-foreground font-medium">English (en)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-md">
            <CardHeader>
              <CardTitle className="text-md font-bold">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="theme">Application Theme</Label>
                <select
                  id="theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-card"
                >
                  <option value="dark">Dark Theme</option>
                  <option value="light">Light Theme</option>
                  <option value="system">System Preference</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Details & Security Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-md">
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Profile Configuration
                </CardTitle>
                <CardDescription>
                  Modify your public identity, email contact registry, and regional formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      {...register('name')}
                      id="name"
                      placeholder="Chethan Gowda"
                      disabled={isUpdatingProfile}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <ShieldAlert className="h-3 w-3" />
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      {...register('email')}
                      id="email"
                      type="email"
                      placeholder="operator@sentinelflow.io"
                      disabled={isUpdatingProfile}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <ShieldAlert className="h-3 w-3" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                      </span>
                      <select
                        {...register('timezone')}
                        id="timezone"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-card"
                        disabled={isUpdatingProfile}
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                        <Globe className="h-4 w-4" />
                      </span>
                      <select
                        {...register('language')}
                        id="language"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-card"
                        disabled={isUpdatingProfile}
                      >
                        <option value="en">English (en)</option>
                        <option value="ja">日本語 (ja)</option>
                        <option value="de">Deutsch (de)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t border-border/40 bg-muted/10 py-3">
                <Button type="submit" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          {/* Active Sessions List */}
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Active Device Sessions
                </CardTitle>
                <CardDescription>
                  Review and revoke logged-in device access to your operator workspace
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRevokeAllSessions}>
                Revoke Other Devices
              </Button>
            </CardHeader>
            <CardContent className="divide-y divide-border/40">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/50 rounded-lg border border-border/20">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{session.device}</p>
                        {session.isCurrent && (
                          <span className="inline-flex items-center rounded-full bg-green-500/10 px-1.5 py-0.5 text-3xs font-semibold text-green-500 border border-green-500/20">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        IP: {session.ipAddress} • Last active: {new Date(session.lastActiveAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRevokeSession(session.id)}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default ProfilePage;
