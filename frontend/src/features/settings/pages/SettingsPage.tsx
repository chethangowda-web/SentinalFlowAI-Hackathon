import * as React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function SettingsPage() {
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = React.useState(user?.name || '');
  const [timezone, setTimezone] = React.useState(user?.timezone || 'UTC');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, timezone });
    alert('Profile updated successfully');
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Account Settings</h1>
        <p className="text-sm text-muted-foreground">Manage profile information and timezone parameters</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">User Profile details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Full Name</Label>
              <Input
                id="username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-black/10 text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tz">Preferred Timezone</Label>
              <Input
                id="tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-black/10 text-xs h-9"
              />
            </div>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer h-9 text-xs">
              Save Configuration
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

export default SettingsPage;
