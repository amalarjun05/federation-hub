import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, Receipt, BookOpen, CheckSquare, 
  Video, Users, CalendarDays, Settings, ChevronLeft, ChevronRight, Shield, LogOut, Loader2
} from "lucide-react";
import { useState } from "react";
import { UserAvatar } from "./UserAvatar";
import { StatusBadge } from "./StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userData: {
    name: string;
    role: string;
    designation: string;
  };
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "team", label: "Team", icon: Users },
  { id: "finance", label: "Finance", icon: Receipt },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "meetings", label: "Meetings", icon: Video },
  { id: "leave", label: "Leave", icon: CalendarDays },
];

export function Sidebar({ activeTab, setActiveTab, userData }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleBadgeVariant = (role: string): 'success' | 'warning' | 'default' => {
    if (role === 'super_admin') return 'success';
    if (role === 'state_member') return 'warning';
    return 'default';
  };

  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'state_member':
        return 'State Member';
      default:
        return 'Employee';
    }
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-full z-50 glass-dark border-r border-border/50 transition-all duration-300 ease-out flex flex-col",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center glow-primary flex-shrink-0">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight animate-fade-in">
              AKEF<span className="gradient-text">WORK</span>
            </span>
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className={cn(
        "p-4 border-b border-border/50",
        isCollapsed ? "flex justify-center" : ""
      )}>
        {isCollapsed ? (
          <UserAvatar name={userData.name} size="lg" status="online" src={profile?.avatar_url || undefined} />
        ) : (
          <div className="flex items-center gap-3 animate-fade-in">
            <UserAvatar name={userData.name} size="lg" status="online" src={profile?.avatar_url || undefined} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{userData.name}</p>
              <StatusBadge variant={getRoleBadgeVariant(userData.role)} size="sm">
                {getRoleDisplayName(userData.role)}
              </StatusBadge>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
              activeTab === item.id 
                ? "bg-primary text-primary-foreground glow-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              isCollapsed && "justify-center px-2"
            )}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <item.icon size={20} className={cn(
              "flex-shrink-0 transition-transform duration-200",
              activeTab !== item.id && "group-hover:scale-110"
            )} />
            {!isCollapsed && (
              <span className="animate-fade-in">{item.label}</span>
            )}
            {activeTab === item.id && !isCollapsed && (
              <div className="ml-auto w-1.5 h-1.5 bg-primary-foreground rounded-full" />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-border/50 space-y-1">
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
            activeTab === 'settings' 
              ? "bg-primary text-primary-foreground glow-primary" 
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
            isCollapsed && "justify-center px-2"
          )}
        >
          <Settings size={20} className="flex-shrink-0 group-hover:rotate-45 transition-transform duration-300" />
          {!isCollapsed && <span>Settings</span>}
        </button>
        
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200 disabled:opacity-50",
            isCollapsed && "justify-center px-2"
          )}
        >
          {isLoggingOut ? (
            <Loader2 size={20} className="animate-spin flex-shrink-0" />
          ) : (
            <LogOut size={20} className="flex-shrink-0" />
          )}
          {!isCollapsed && <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-secondary border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-200 shadow-lg"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
