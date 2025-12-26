import { useState } from "react";
import { Users, Search, Mail, Phone, MapPin } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { UserAvatar } from "./UserAvatar";
import { DEFAULT_TEAM, TeamMember } from "@/lib/data";
import { cn } from "@/lib/utils";

export function TeamView() {
  const [team] = useState<TeamMember[]>(DEFAULT_TEAM);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("all");

  const departments = ["all", ...new Set(team.map(m => m.department))];
  
  const filteredTeam = team.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "all" || member.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const getStatusText = (status: TeamMember['status']) => {
    const texts = { online: 'Available', busy: 'In a meeting', offline: 'Away' };
    return texts[status];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="text-primary" /> Team Directory
        </h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Department Filter */}
      <div className="flex flex-wrap gap-2">
        {departments.map(dept => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              selectedDept === dept 
                ? "bg-primary text-primary-foreground glow-primary" 
                : "bg-secondary text-muted-foreground hover:text-foreground border border-border hover:border-primary/50"
            )}
          >
            {dept === "all" ? "All Teams" : dept}
          </button>
        ))}
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeam.map((member, i) => (
          <GlassCard 
            key={member.uid} 
            hover 
            className="animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
          >
            <div className="flex items-start gap-4">
              <UserAvatar 
                name={member.name} 
                size="xl" 
                status={member.status} 
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">{member.name}</h3>
                <p className="text-sm text-primary font-medium">{member.role}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    member.status === 'online' && "status-online",
                    member.status === 'busy' && "status-busy",
                    member.status === 'offline' && "status-offline"
                  )} />
                  <span className="text-xs text-muted-foreground">{getStatusText(member.status)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} className="text-accent" />
                <span>{member.department}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={14} className="text-accent" />
                <a href={`mailto:${member.email}`} className="hover:text-foreground truncate">
                  {member.email}
                </a>
              </div>
              {member.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone size={14} className="text-accent" />
                  <a href={`tel:${member.phone}`} className="hover:text-foreground">
                    {member.phone}
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium rounded-lg border border-border hover:border-primary/50 transition-colors">
                Send Message
              </button>
              <button className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-lg border border-primary/30 hover:border-primary/50 transition-colors">
                View Profile
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {filteredTeam.length === 0 && (
        <GlassCard className="text-center py-10">
          <p className="text-muted-foreground">No team members found matching your criteria.</p>
        </GlassCard>
      )}
    </div>
  );
}
