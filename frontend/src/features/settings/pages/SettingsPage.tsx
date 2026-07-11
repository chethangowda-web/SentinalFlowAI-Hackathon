import * as React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sun, Moon, User, Building2, Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" as const } },
};

const SETTINGS_TABS = [
  { value: 'profile', label: 'Profile', icon: User },
  { value: 'organization', label: 'Organization', icon: Building2 },
  { value: 'appearance', label: 'Appearance', icon: Palette },
];

export function SettingsPage() {
  const { user, activeOrganization, updateProfile } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [name, setName] = React.useState(user?.name || '');
  const [timezone, setTimezone] = React.useState(user?.timezone || 'UTC');
  const [language, setLanguage] = React.useState(user?.language || 'en');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, timezone, language } as any);
  };

  const timezones = ['UTC', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai'];

  return (
    <motion.div
      className="space-y-6 max-w-4xl"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account, organization, and platform preferences</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="profile">
          <TabsList className="bg-card border border-border/40 rounded-xl p-1 h-auto gap-0 flex-wrap">
            {SETTINGS_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-2 text-xs px-3 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card className="bg-card border-border/40 rounded-xl">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <form onSubmit={handleSaveProfile}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs">Email</Label>
                    <Input id="email" value={user?.email || ''} disabled className="bg-muted/30 text-xs h-9 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs">Full Name</Label>
                    <Input
                      id="username"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-background text-xs h-9 border-border/40 rounded-lg focus:border-primary/30"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="tz" className="text-xs">Timezone</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger className="h-9 text-xs bg-background border-border/40 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz} value={tz} className="text-xs">{tz}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lang" className="text-xs">Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="h-9 text-xs bg-background border-border/40 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en" className="text-xs">English</SelectItem>
                          <SelectItem value="es" className="text-xs">Spanish</SelectItem>
                          <SelectItem value="fr" className="text-xs">French</SelectItem>
                          <SelectItem value="de" className="text-xs">German</SelectItem>
                          <SelectItem value="ja" className="text-xs">Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="h-9 text-xs cursor-pointer rounded-lg">
                    Save Changes
                  </Button>
                </CardContent>
              </form>
            </Card>
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization" className="space-y-6 mt-6">
            <Card className="bg-card border-border/40 rounded-xl">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Organization</p>
                    <p className="text-sm font-semibold text-foreground">{activeOrganization?.name || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Role</p>
                    <Badge variant="secondary" className="text-[10px]">{activeOrganization?.role || user?.role || 'N/A'}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Slug</p>
                    <code className="text-sm font-mono text-primary">{activeOrganization?.slug || 'N/A'}</code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Status</p>
                    <p className="text-sm font-mono text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6 mt-6">
            <Card className="bg-card border-border/40 rounded-xl">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  Theme Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/20 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      theme === 'dark' ? 'bg-violet-500/10' : 'bg-amber-500/10'
                    )}>
                      {theme === 'dark' ? <Moon className="w-5 h-5 text-violet-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Interface Theme</p>
                      <p className="text-xs text-muted-foreground capitalize">{theme} mode — dark-first design</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="h-8 text-xs cursor-pointer rounded-lg"
                  >
                    Toggle {theme === 'dark' ? 'Light' : 'Dark'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

export default SettingsPage;
