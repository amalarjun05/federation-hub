import { useState } from "react";
import { 
  Plus, Calendar, Clock, MapPin, Trash2, AlertCircle,
  TrendingUp, Users, Receipt, CheckSquare
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { UserAvatar } from "./UserAvatar";
import { ActionButton } from "./ActionButton";
import { FormTextarea } from "./FormInput";
import { 
  DEFAULT_POSTS, DEFAULT_EVENTS, Post, Event, DASHBOARD_STATS 
} from "@/lib/data";
import { loadFromStorage, saveToStorage } from "@/lib/storage";

interface DashboardViewProps {
  userData: {
    name: string;
    role: string;
  };
}

export function DashboardView({ userData }: DashboardViewProps) {
  const [posts, setPosts] = useState<Post[]>(() => 
    loadFromStorage('akef_posts', DEFAULT_POSTS)
  );
  const [events] = useState<Event[]>(() => 
    loadFromStorage('akef_events', DEFAULT_EVENTS)
  );
  const [newPost, setNewPost] = useState("");

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    
    const post: Post = {
      id: Date.now(),
      content: newPost,
      author: userData.name,
      role: userData.role,
      date: "Just now",
      type: "UPDATE"
    };

    const updatedPosts = [post, ...posts];
    setPosts(updatedPosts);
    saveToStorage('akef_posts', updatedPosts);
    setNewPost("");
  };

  const deletePost = (id: number) => {
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    saveToStorage('akef_posts', updated);
  };

  const stats = [
    { label: "Total Members", value: DASHBOARD_STATS.totalMembers, icon: Users, color: "text-primary" },
    { label: "Active Events", value: DASHBOARD_STATS.activeEvents, icon: Calendar, color: "text-accent" },
    { label: "Pending Tasks", value: DASHBOARD_STATS.pendingTasks, icon: CheckSquare, color: "text-warning" },
    { label: "Pending Claims", value: DASHBOARD_STATS.pendingClaims, icon: Receipt, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <GlassCard 
            key={stat.label} 
            variant="glass" 
            hover 
            className="animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-success">
              <TrendingUp size={12} />
              <span>+12% from last month</span>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Input */}
          <GlassCard variant="gradient" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
            <div className="relative">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Plus size={16} className="text-primary" /> Post Announcement
              </h3>
              <FormTextarea 
                placeholder="Share an update with the State & District committees..."
                rows={2}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />
              <div className="flex justify-end mt-3">
                <ActionButton onClick={handlePost} size="sm">
                  Post Update
                </ActionButton>
              </div>
            </div>
          </GlassCard>

          {/* Updates Feed */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">Official Updates</h2>
            <div className="space-y-4">
              {posts.length === 0 && (
                <GlassCard className="text-center py-10">
                  <p className="text-muted-foreground">No updates yet. Be the first to post!</p>
                </GlassCard>
              )}
              {posts.map((post, i) => (
                <GlassCard 
                  key={post.id} 
                  hover 
                  className="group relative animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
                >
                  <button 
                    onClick={() => deletePost(post.id)} 
                    className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                  
                  <div className="flex items-start gap-3 mb-3">
                    <UserAvatar name={post.author} size="lg" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{post.author}</h4>
                        {post.type === "URGENT" && (
                          <StatusBadge variant="destructive" pulse>URGENT</StatusBadge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {post.role} • {post.date}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed pl-13">
                    {post.content}
                  </p>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <GlassCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <Calendar size={18} /> Upcoming Events
              </h3>
            </div>
            <div className="space-y-3">
              {events.slice(0, 4).map((event, i) => (
                <div 
                  key={event.id} 
                  className="flex gap-3 items-center p-2 rounded-lg hover:bg-secondary cursor-pointer border-l-2 border-transparent hover:border-primary transition-all animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
                >
                  <div className="bg-secondary text-foreground rounded-lg px-2.5 py-1.5 text-center min-w-[3.5rem] border border-border">
                    <div className="text-[10px] uppercase font-bold text-primary">
                      {new Date(event.date).getDate()}
                    </div>
                    <div className="font-bold text-xs leading-none">
                      {new Date(event.date).toLocaleString('default', { month: 'short' })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{event.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={10} /> {event.location}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Action Required */}
          <GlassCard className="border-warning/30 bg-warning/5">
            <h3 className="font-bold text-warning mb-4 flex items-center gap-2 text-sm">
              <AlertCircle size={16} /> Action Required
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-start p-2 rounded-lg hover:bg-secondary/50 cursor-pointer">
                <div className="mt-1 w-2 h-2 bg-warning rounded-full animate-pulse" />
                <div>
                  <div className="text-sm font-medium text-foreground">Approve District Budgets</div>
                  <div className="text-xs text-muted-foreground">Deadline: Today, 5:00 PM</div>
                </div>
              </div>
              <div className="flex gap-3 items-start p-2 rounded-lg hover:bg-secondary/50 cursor-pointer">
                <div className="mt-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                <div>
                  <div className="text-sm font-medium text-foreground">Review Expense Claims (3)</div>
                  <div className="text-xs text-muted-foreground">Overdue by 2 days</div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Quick Links */}
          <GlassCard>
            <h3 className="font-bold text-foreground mb-3 text-sm">Quick Links</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 bg-secondary rounded-lg border border-border hover:border-primary text-xs text-muted-foreground hover:text-foreground transition-colors text-center">
                HR Portal
              </button>
              <button className="p-3 bg-secondary rounded-lg border border-border hover:border-primary text-xs text-muted-foreground hover:text-foreground transition-colors text-center">
                Apply Leave
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
