import { useState } from "react";
import { Navbar } from "@/components/portal/Navbar";
import { ChatWidget } from "@/components/portal/ChatWidget";
import { DashboardView } from "@/components/portal/DashboardView";
import { TeamView } from "@/components/portal/TeamView";
import { FinanceView } from "@/components/portal/FinanceView";
import { GovernanceView } from "@/components/portal/GovernanceView";
import { LibraryView } from "@/components/portal/LibraryView";
import { TasksView } from "@/components/portal/TasksView";
import { MeetingsView } from "@/components/portal/MeetingsView";
import { LeaveView } from "@/components/portal/LeaveView";
import { SettingsView } from "@/components/portal/SettingsView";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const userData = {
    name: "Arjun Kumar",
    role: "STATE_ADMIN",
    district: "State Office",
    designation: "General Secretary",
    uid: "test-admin-01"
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-foreground">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-[0.02] pointer-events-none" />
      
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
        {activeTab === "governance" && <GovernanceView userData={userData} />}
        {activeTab === "library" && <LibraryView />}
        {activeTab === "tasks" && <TasksView />}
        {activeTab === "meetings" && <MeetingsView userData={userData} />}
        {activeTab === "leave" && <LeaveView userData={userData} />}
        {activeTab === "settings" && <SettingsView userData={userData} />}
      </main>

      {/* Floating Chat Widget */}
      <ChatWidget currentUser={{ name: userData.name, uid: userData.uid }} />
    </div>
  );
};

export default Index;
