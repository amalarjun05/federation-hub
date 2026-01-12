import { useState } from "react";
import { Sidebar } from "@/components/portal/Sidebar";
import { EnhancedChatWidget } from "@/components/portal/EnhancedChatWidget";
import { DashboardView } from "@/components/portal/DashboardView";
import { TeamView } from "@/components/portal/TeamView";
import { FinanceView } from "@/components/portal/FinanceView";
import { CalendarView } from "@/components/portal/CalendarView";
import { LibraryView } from "@/components/portal/LibraryView";
import { TasksView } from "@/components/portal/TasksView";
import { MeetingsView } from "@/components/portal/MeetingsView";
import { LeaveView } from "@/components/portal/LeaveView";
import { SettingsView } from "@/components/portal/SettingsView";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Search } from "lucide-react";
import { useState as useNotifState } from "react";
import { DEFAULT_NOTIFICATIONS, Notification } from "@/lib/data";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useNotifState<Notification[]>(() => 
    loadFromStorage('akef_notifications', DEFAULT_NOTIFICATIONS)
  );
  
  const { profile, role, user } = useAuth();

  const userData = {
    name: profile?.full_name || user?.email?.split('@')[0] || 'User',
    role: role || 'employee',
    district: profile?.district || 'Not set',
    designation: profile?.designation || getRoleDisplayName(role),
    uid: user?.id || ''
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  function getRoleDisplayName(role: string | null): string {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'state_member':
        return 'State Member';
      case 'employee':
      default:
        return 'Employee';
    }
  }

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

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-foreground">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-[0.015] pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
      </div>
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userData={userData} 
      />

      {/* Main Content Area */}
      <div className="ml-64 transition-all duration-300">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 glass-dark border-b border-border/50 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Page Title */}
            <div>
              <h1 className="text-xl font-bold text-foreground capitalize">{activeTab}</h1>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-64 input-glass rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2.5 rounded-xl glass hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all duration-200 glow-hover"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 glass-dark rounded-2xl shadow-2xl border border-border/50 animate-scale-in overflow-hidden">
                    <div className="p-4 border-b border-border/50 flex justify-between items-center">
                      <h4 className="font-bold text-foreground">Notifications</h4>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllRead}
                          className="text-xs text-primary hover:text-primary/80 transition-colors"
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
                              "p-4 border-b border-border/30 hover:bg-secondary/30 transition-colors cursor-pointer",
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
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
                                <span className="text-[10px] text-muted-foreground/60 mt-1 block">{notif.timestamp}</span>
                              </div>
                              {!notif.read && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5 animate-pulse" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative px-6 py-6 pb-24">
          {activeTab === "dashboard" && <DashboardView userData={userData} />}
          {activeTab === "team" && <TeamView />}
          {activeTab === "finance" && <FinanceView userData={userData} />}
          {activeTab === "calendar" && <CalendarView userData={userData} />}
          {activeTab === "library" && <LibraryView />}
          {activeTab === "tasks" && <TasksView />}
          {activeTab === "meetings" && <MeetingsView userData={userData} />}
          {activeTab === "leave" && <LeaveView userData={userData} />}
          {activeTab === "settings" && <SettingsView userData={userData} />}
        </main>
      </div>

      {/* Floating Chat Widget */}
      <EnhancedChatWidget />
    </div>
  );
};

export default Index;
