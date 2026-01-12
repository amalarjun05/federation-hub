import { cn } from "@/lib/utils";
import { 
  Bell, Menu, X, Shield, Search, Settings,
  LayoutDashboard, Receipt, BookOpen, CheckSquare, 
  Video, Users, CalendarDays, LogOut, Loader2
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { UserAvatar } from "./UserAvatar";
import { StatusBadge } from "./StatusBadge";
import { DEFAULT_NOTIFICATIONS, Notification } from "@/lib/data";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface NavbarProps {
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

export function Navbar({ activeTab, setActiveTab, userData }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => 
    loadFromStorage('akef_notifications', DEFAULT_NOTIFICATIONS)
  );
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveToStorage('akef_notifications', updated);
  };

  const getNotifIcon = (type: Notification['type']) => {
    const colors = {
      info: "text-accent",
      warning: "text-warning",
      success: "text-success",
      urgent: "text-destructive",
    };
    return colors[type];
  };

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
      case 'employee':
      default:
        return 'Employee';
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-dark border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center glow-primary">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold tracking-tight">
                AKEF<span className="gradient-text">WORKSPACE</span>
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "nav-item flex items-center gap-2",
                  activeTab === item.id ? "nav-item-active" : "nav-item-inactive"
                )}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search (Desktop) */}
            <div className="hidden md:flex items-center relative">
              <Search size={16} className="absolute left-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-48 input-glass rounded-xl pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
              />
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-dark rounded-2xl shadow-2xl border border-border/50 animate-scale-in overflow-hidden">
                  <div className="p-3 border-b border-border flex justify-between items-center">
                    <h4 className="font-bold text-foreground">Notifications</h4>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllRead}
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id}
                          className={cn(
                            "p-3 border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer",
                            !notif.read && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("mt-0.5", getNotifIcon(notif.type))}>
                              <Bell size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium", !notif.read && "text-foreground")}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                              <span className="text-[10px] text-muted-foreground/60 mt-1 block">{notif.timestamp}</span>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-secondary border border-border hover:border-primary/50 transition-colors"
              >
                <UserAvatar name={userData.name} size="md" status="online" src={profile?.avatar_url || undefined} />
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-xs font-bold text-foreground leading-none">{userData.name}</span>
                  <span className="text-[10px] text-primary leading-none mt-0.5">{userData.designation}</span>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-dark rounded-2xl shadow-2xl border border-border/50 animate-scale-in overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={userData.name} size="lg" status="online" src={profile?.avatar_url || undefined} />
                      <div>
                        <p className="font-bold text-foreground">{userData.name}</p>
                        <StatusBadge variant={getRoleBadgeVariant(userData.role)} size="sm">
                          {getRoleDisplayName(userData.role)}
                        </StatusBadge>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={() => { setActiveTab('settings'); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <Settings size={16} /> Settings
                    </button>
                    <button 
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                      {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="lg:hidden glass border-t border-border px-4 pt-2 pb-4 space-y-1 animate-slide-up">
          {/* Mobile Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors",
                activeTab === item.id 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
