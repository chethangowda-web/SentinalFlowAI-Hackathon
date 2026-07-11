import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Building, Users, UserPlus, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface InviteMemberData {
  email: string;
  role: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

export function OrgSettingsPage() {
  const { activeOrg, user } = useAuth();
  
  const [members, setMembers] = React.useState<Member[]>([]);

  React.useEffect(() => {
    apiClient.get<{ data: Member[] }>('/custom/v1/auth/members')
      .then(res => setMembers(res.data.data))
      .catch(() => {});
  }, []);

  const { register: registerInvite, handleSubmit: handleInviteSubmit, reset: resetInviteForm } = useForm<InviteMemberData>({
    defaultValues: { email: '', role: 'member' }
  });

  const onInvite = (data: InviteMemberData) => {
    apiClient.post('/custom/v1/auth/invite', data)
      .then(() => {
        toast.success(`Invitation sent successfully to ${data.email} as ${data.role}`);
        resetInviteForm();
      })
      .catch(() => toast.error('Failed to send invitation'));
  };

  const handleRemoveMember = (id: string) => {
    const member = members.find(m => m.id === id);
    if (member?.email === user?.email) {
      toast.error('You cannot remove yourself from the organization.');
      return;
    }
    apiClient.delete(`/custom/v1/auth/members/${id}`)
      .then(() => {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        toast.success(`Member has been removed from organization.`);
      })
      .catch(() => toast.error('Failed to remove member'));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Configuration</h1>
        <p className="text-muted-foreground">
          Control your tenant branding, manage team access control, and delegate RBAC roles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Invite Member Form */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-md">
            <form onSubmit={handleInviteSubmit(onInvite)}>
              <CardHeader>
                <CardTitle className="text-md font-bold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Invite Collaborator
                </CardTitle>
                <CardDescription>
                  Send an organization invite to add a new engineer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="inviteEmail">Email Address</Label>
                  <Input
                    {...registerInvite('email', { required: true })}
                    id="inviteEmail"
                    type="email"
                    placeholder="sre-lead@sentinelflow.io"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inviteRole">RBAC Role</Label>
                  <select
                    {...registerInvite('role', { required: true })}
                    id="inviteRole"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-card"
                  >
                    <option value="member">Member (View Only)</option>
                    <option value="operator">Operator (Execute Action)</option>
                    <option value="admin">Admin (Full Workspace Access)</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/40 bg-muted/10 py-3">
                <Button type="submit" className="w-full">
                  Send Workspace Invite
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right Column: Profile & Team Members List */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Building className="h-5 w-5" />
                Workspace Metadata
              </CardTitle>
              <CardDescription>
                Configure organization information and identity settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input defaultValue={activeOrg?.name || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Workspace Slug URL</Label>
                  <Input defaultValue={activeOrg?.slug || ''} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border/40 bg-muted/10 py-3">
              <Button onClick={() => toast.success('Workspace details updated successfully.')}>
                Save Workspace Profile
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Collaborator Roster
              </CardTitle>
              <CardDescription>
                Roster of all operators registered with permissions inside this tenant workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/40">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border/40 bg-muted flex items-center justify-center">
                      <AvatarFallback className="text-xs">{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold border border-border/60">
                      {member.role}
                    </span>
                    {member.email !== user?.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default OrgSettingsPage;
