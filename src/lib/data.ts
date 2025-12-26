// Default mock data for the portal

export interface Post {
  id: number;
  author: string;
  role: string;
  content: string;
  date: string;
  type: 'URGENT' | 'UPDATE' | 'INFO';
}

export interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  type?: string;
}

export interface Task {
  id: number;
  title: string;
  status: 'pending' | 'completed' | 'in-progress';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignee?: string;
}

export interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  type: string;
  createdBy?: string;
  attendees?: string[];
}

export interface Claim {
  id: number;
  claimant: string;
  desc: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  proof: string;
  category?: string;
}

export interface Poll {
  id: number;
  question: string;
  status: 'Active' | 'Closed';
  totalVotes: number;
  options: { id: string; text: string; votes: number }[];
  userVoted: string | null;
  endDate?: string;
}

export interface TeamMember {
  uid: number;
  name: string;
  email: string;
  status: 'online' | 'busy' | 'offline';
  role: string;
  department: string;
  avatar?: string;
  phone?: string;
}

export interface LeaveRequest {
  id: number;
  applicant: string;
  type: 'Annual' | 'Sick' | 'Personal' | 'Emergency';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Default data
export const DEFAULT_POSTS: Post[] = [
  { 
    id: 1, 
    author: "State Secretary", 
    role: "ADMIN", 
    content: "⚠️ Urgent: All District Associations must submit their qualified player lists for the State Championship by this Friday, 5 PM.", 
    date: "2 hrs ago", 
    type: "URGENT" 
  },
  { 
    id: 2, 
    author: "Event Coordinator", 
    role: "MEMBER", 
    content: "The venue for the Grand Finals has been confirmed: Rajiv Gandhi Indoor Stadium, Kochi. Floor plan attached in Library.", 
    date: "5 hrs ago", 
    type: "UPDATE" 
  },
  { 
    id: 3, 
    author: "Technical Lead", 
    role: "EMPLOYEE", 
    content: "New streaming equipment has arrived. Team leads, please schedule pickup from HQ. Training session on Saturday.", 
    date: "1 day ago", 
    type: "INFO" 
  }
];

export const DEFAULT_EVENTS: Event[] = [
  { id: 1, title: "State Committee Meeting", date: "2025-12-15", time: "10:00 AM", location: "Kochi HQ", type: "Meeting" },
  { id: 2, title: "District Qualifiers (Online)", date: "2025-12-20", time: "09:00 AM", location: "Discord", type: "Tournament" },
  { id: 3, title: "Annual General Body", date: "2026-01-05", time: "11:00 AM", location: "Trivandrum", type: "Meeting" },
  { id: 4, title: "Sponsor Meet & Greet", date: "2026-01-10", time: "02:00 PM", location: "Virtual", type: "External" },
];

export const DEFAULT_TASKS: Task[] = [
  { id: 1, title: "Finalize venue for Kochi qualifiers", status: "pending", priority: "high", dueDate: "2025-12-18" },
  { id: 2, title: "Send invites to district heads", status: "completed", priority: "medium" },
  { id: 3, title: "Review sponsorship proposals", status: "in-progress", priority: "high", dueDate: "2025-12-20" },
  { id: 4, title: "Update website with new schedule", status: "pending", priority: "low" },
];

export const DEFAULT_MEETINGS: Meeting[] = [
  { id: 1, title: "Core Team Sync", date: "2025-12-12", time: "10:00", type: "Online", attendees: ["Rahul", "Sarah", "Vishnu"] },
  { id: 2, title: "Budget Review", date: "2025-12-14", time: "14:00", type: "In-Person", attendees: ["Finance Team"] },
];

export const DEFAULT_CLAIMS: Claim[] = [
  { id: 1, claimant: "Rahul (TVM)", desc: "Venue Advance - District Qualifiers", amount: 15000, date: "2025-12-01", status: "Pending", proof: "receipt_001.jpg", category: "Venue" },
  { id: 2, claimant: "Vishnu (Tech)", desc: "Server Hosting (AWS) - Dec 2025", amount: 4500, date: "2025-12-05", status: "Approved", proof: "aws_inv.pdf", category: "Technology" },
  { id: 3, claimant: "Sarah (EKM)", desc: "Refreshments for Committee Meet", amount: 1200, date: "2025-11-28", status: "Rejected", proof: "food_bill.jpg", category: "Events" },
];

export const DEFAULT_POLLS: Poll[] = [
  { 
    id: 1, 
    question: "Select Venue for State Grand Finals 2025", 
    status: "Active", 
    totalVotes: 12,
    endDate: "2025-12-30",
    options: [
      { id: 'a', text: "Rajiv Gandhi Stadium, Kochi", votes: 8 },
      { id: 'b', text: "Jimmy George Stadium, TVM", votes: 4 }
    ],
    userVoted: null 
  },
  { 
    id: 2, 
    question: "Should we include 'Valorant' in the official roster?", 
    status: "Closed", 
    totalVotes: 25,
    options: [
      { id: 'a', text: "Yes", votes: 20 },
      { id: 'b', text: "No", votes: 5 }
    ],
    userVoted: 'a'
  }
];

export const DEFAULT_TEAM: TeamMember[] = [
  { uid: 1, name: "Arjun Kumar", email: "arjun@akef.in", status: "online", role: "General Secretary", department: "State Office", phone: "+91 98765 43210" },
  { uid: 2, name: "Rahul Menon", email: "rahul@akef.in", status: "online", role: "District Secretary", department: "Trivandrum", phone: "+91 98765 43211" },
  { uid: 3, name: "Sarah Thomas", email: "sarah@akef.in", status: "busy", role: "District President", department: "Ernakulam", phone: "+91 98765 43212" },
  { uid: 4, name: "Vishnu Nair", email: "vishnu@akef.in", status: "offline", role: "Technical Lead", department: "Technology", phone: "+91 98765 43213" },
  { uid: 5, name: "Anjali Krishnan", email: "anjali@akef.in", status: "online", role: "HR Manager", department: "Human Resources", phone: "+91 98765 43214" },
  { uid: 6, name: "Mohammed Rizwan", email: "rizwan@akef.in", status: "online", role: "Finance Head", department: "Finance", phone: "+91 98765 43215" },
];

export const DEFAULT_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 1, applicant: "Vishnu Nair", type: "Annual", startDate: "2025-12-23", endDate: "2025-12-27", reason: "Family vacation", status: "Pending", appliedOn: "2025-12-10" },
  { id: 2, applicant: "Sarah Thomas", type: "Sick", startDate: "2025-12-05", endDate: "2025-12-06", reason: "Medical appointment", status: "Approved", appliedOn: "2025-12-04" },
];

export const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: 1, title: "New Expense Claim", message: "Rahul submitted a new expense claim for ₹15,000", type: "info", timestamp: "2 hours ago", read: false },
  { id: 2, title: "Meeting Reminder", message: "Core Team Sync starts in 1 hour", type: "warning", timestamp: "1 hour ago", read: false },
  { id: 3, title: "Poll Ending Soon", message: "Venue selection poll closes in 24 hours", type: "urgent", timestamp: "30 mins ago", read: false },
];

// Stats for dashboard
export const DASHBOARD_STATS = {
  totalMembers: 156,
  activeEvents: 4,
  pendingTasks: 12,
  pendingClaims: 3,
};
