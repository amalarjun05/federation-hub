import { useState } from "react";
import { Settings, User, Bell, Shield, Palette, Moon, Sun, Save } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { ActionButton } from "./ActionButton";
import { FormInput } from "./FormInput";
import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  userData: {
    name: string;
    role: string;
    designation: string;
  };
}

export function SettingsView({ userData }: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({
    name: userData.name,
    email: "admin@akef.in",
    phone: "+91 98765 43210",
    department: "State Office"
  });

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

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
        </div>
      </div>
    </div>
  );
}
