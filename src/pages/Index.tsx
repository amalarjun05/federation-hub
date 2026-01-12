import { useState } from "react";
import { Navbar } from "@/components/portal/Navbar";
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

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { profile, role, user } = useAuth();

  const userData = {
    name: profile?.full_name || user?.email?.split('@')[0] || 'User',
    role: role || 'employee',
    district: profile?.district || 'Not set',
    designation: profile?.designation || getRoleDisplayName(role),
    uid: user?.id || ''
  };

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

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-foreground">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-[0.015] pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/8 rounded-full blur-[120px]" />
      </div>
      
      {/* Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userData={userData} 
      />

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
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

      {/* Floating Chat Widget */}
      <EnhancedChatWidget />
    </div>
  );
};

export default Index;
