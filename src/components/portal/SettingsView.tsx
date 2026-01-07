import { useState, useEffect } from "react";
import { Settings, User, Bell, Shield, Palette, Moon, Sun, Save, Users, Check, X, Loader2 } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { ActionButton } from "./ActionButton";
import { FormInput } from "./FormInput";
import { UserAvatar } from "./UserAvatar";
import { StatusBadge } from "./StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  userData: {
    name: string;
    role: string;
    designation: string;
  };
}

interface PendingUser {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  is_approved: boolean;
  created_at: string;
  role: string | null;
  email?: string;
}

export function SettingsView({ userData }: SettingsViewProps) {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({
    name: userData.name,
    email: "admin@akef.in",
    phone: "+91 98765 43210",
    department: "State Office"
  });
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    ...(isSuperAdmin ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
  ];

  const fetchUsers = async () => {
    if (!isSuperAdmin) return;
    
    setIsLoadingUsers(true);
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

      const usersWithRoles = (profilesData || []).map(p => ({
        id: p.id,
        full_name: p.full_name,
        phone_number: (p as any).phone_number || null,
        is_approved: (p as any).is_approved ?? false,
        created_at: p.created_at,
        role: rolesMap.get(p.id) || 'employee',
      }));

      setPendingUsers(usersWithRoles.filter(u => !u.is_approved));
      setAllUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin && activeSection === 'users') {
      fetchUsers();
    }
  }, [isSuperAdmin, activeSection]);

  const handleApproveUser = async (userId: string) => {
    setProcessingUser(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true } as any)
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'User approved successfully' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve user',
        variant: 'destructive',
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!confirm('Are you sure you want to reject and remove this user?')) return;
    
    setProcessingUser(userId);
    try {
      // Delete from profiles (this will cascade due to foreign key)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'User rejected and removed' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject user',
        variant: 'destructive',
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke access for this user?')) return;
    
    setProcessingUser(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: false } as any)
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Access revoked' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke access',
        variant: 'destructive',
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const getRoleDisplayName = (role: string | null): string => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'state_member': return 'State Member';
      case 'district_member': return 'District Member';
      case 'employee': return 'Employee';
      default: return 'Employee';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Settings className="text-primary" /> Settings
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <GlassCard className="p-2">
            <nav className="space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeSection === section.id 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <section.icon size={18} />
                  {section.label}
                  {section.id === 'users' && pendingUsers.length > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                      {pendingUsers.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </GlassCard>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && (
            <GlassCard className="animate-fade-in">
              <h3 className="text-lg font-bold text-foreground mb-6">Profile Settings</h3>
              
              {/* Avatar Section */}
              <div className="flex items-center gap-6 mb-8 pb-6 border-b border-border">
                <UserAvatar name={userData.name} size="xl" />
                <div>
                  <h4 className="font-bold text-foreground">{userData.name}</h4>
                  <p className="text-sm text-muted-foreground">{userData.designation}</p>
                  <ActionButton variant="secondary" size="sm" className="mt-2">
                    Change Photo
                  </ActionButton>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput 
                    label="Full Name"
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                  />
                  <FormInput 
                    label="Email"
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile({...profile, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput 
                    label="Phone"
                    value={profile.phone}
                    onChange={e => setProfile({...profile, phone: e.target.value})}
                  />
                  <FormInput 
                    label="Department"
                    value={profile.department}
                    onChange={e => setProfile({...profile, department: e.target.value})}
                  />
                </div>
                <div className="pt-4">
                  <ActionButton>
                    <Save size={16} /> Save Changes
                  </ActionButton>
                </div>
              </div>
            </GlassCard>
          )}

          {activeSection === 'notifications' && (
            <GlassCard className="animate-fade-in">
              <h3 className="text-lg font-bold text-foreground mb-6">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: "Email Notifications", desc: "Receive email updates for important events" },
                  { label: "Push Notifications", desc: "Get browser push notifications" },
                  { label: "Meeting Reminders", desc: "Receive reminders before scheduled meetings" },
                  { label: "Task Deadlines", desc: "Get notified about upcoming task deadlines" },
                  { label: "Expense Updates", desc: "Notifications when expense claims are processed" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={i < 3} />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {activeSection === 'security' && (
            <GlassCard className="animate-fade-in">
              <h3 className="text-lg font-bold text-foreground mb-6">Security Settings</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-foreground mb-4">Change Password</h4>
                  <div className="space-y-4 max-w-md">
                    <FormInput label="Current Password" type="password" />
                    <FormInput label="New Password" type="password" />
                    <FormInput label="Confirm New Password" type="password" />
                    <ActionButton>Update Password</ActionButton>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium text-foreground mb-4">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border max-w-md">
                    <div>
                      <p className="font-medium text-foreground">2FA Status</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <ActionButton variant="secondary" size="sm">Enable</ActionButton>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {activeSection === 'appearance' && (
            <GlassCard className="animate-fade-in">
              <h3 className="text-lg font-bold text-foreground mb-6">Appearance Settings</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-foreground mb-4">Theme</h4>
                  <div className="grid grid-cols-3 gap-4 max-w-md">
                    <button className="p-4 bg-secondary rounded-lg border-2 border-primary flex flex-col items-center gap-2">
                      <Moon size={24} className="text-primary" />
                      <span className="text-sm font-medium">Dark</span>
                    </button>
                    <button className="p-4 bg-secondary rounded-lg border border-border flex flex-col items-center gap-2 opacity-50">
                      <Sun size={24} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Light</span>
                    </button>
                    <button className="p-4 bg-secondary rounded-lg border border-border flex flex-col items-center gap-2 opacity-50">
                      <Settings size={24} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">System</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">* Light and System themes coming soon</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium text-foreground mb-4">Accent Color</h4>
                  <div className="flex gap-3">
                    {['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-rose-500', 'bg-amber-500'].map((color, i) => (
                      <button 
                        key={i}
                        className={cn(
                          "w-8 h-8 rounded-full transition-transform hover:scale-110",
                          color,
                          i === 0 && "ring-2 ring-offset-2 ring-offset-background ring-primary"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {activeSection === 'users' && isSuperAdmin && (
            <div className="space-y-6 animate-fade-in">
              {/* Pending Approvals */}
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Pending Approvals</h3>
                  <StatusBadge variant={pendingUsers.length > 0 ? 'warning' : 'success'} size="sm">
                    {pendingUsers.length} pending
                  </StatusBadge>
                </div>
                
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : pendingUsers.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No pending approvals</p>
                ) : (
                  <div className="space-y-3">
                    {pendingUsers.map(user => (
                      <div 
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.full_name || 'User'} size="md" />
                          <div>
                            <p className="font-medium text-foreground">{user.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.phone_number && `${user.phone_number} • `}
                              {getRoleDisplayName(user.role)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            disabled={processingUser === user.id}
                            className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50"
                          >
                            {processingUser === user.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Check size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectUser(user.id)}
                            disabled={processingUser === user.id}
                            className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* All Users */}
              <GlassCard>
                <h3 className="text-lg font-bold text-foreground mb-4">All Users</h3>
                
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">USER</th>
                          <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">PHONE</th>
                          <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">ROLE</th>
                          <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">STATUS</th>
                          <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.filter(u => u.is_approved).map(user => (
                          <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <UserAvatar name={user.full_name || 'User'} size="sm" />
                                <span className="text-sm font-medium text-foreground">{user.full_name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-sm text-muted-foreground">{user.phone_number || '-'}</td>
                            <td className="py-3 px-2 text-sm text-foreground">{getRoleDisplayName(user.role)}</td>
                            <td className="py-3 px-2">
                              <StatusBadge variant="success" size="sm">Active</StatusBadge>
                            </td>
                            <td className="py-3 px-2">
                              <button
                                onClick={() => handleRevokeAccess(user.id)}
                                disabled={processingUser === user.id}
                                className="text-xs text-destructive hover:underline disabled:opacity-50"
                              >
                                Revoke Access
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {allUsers.filter(u => u.is_approved).length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">No approved users yet</p>
                    )}
                  </div>
                )}
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}