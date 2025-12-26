import { useState } from "react";
import { Video, Plus, X, Clock, Users, Calendar } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { ActionButton } from "./ActionButton";
import { PortalModal, PortalModalFooter } from "./PortalModal";
import { FormInput, FormSelect } from "./FormInput";
import { DEFAULT_MEETINGS, Meeting } from "@/lib/data";
import { loadFromStorage, saveToStorage } from "@/lib/storage";

interface MeetingsViewProps {
  userData: {
    name: string;
  };
}

export function MeetingsView({ userData }: MeetingsViewProps) {
  const [meetings, setMeetings] = useState<Meeting[]>(() => 
    loadFromStorage('akef_meetings', DEFAULT_MEETINGS)
  );
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", time: "", type: "Online" });

  const scheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    const meeting: Meeting = { 
      id: Date.now(), 
      ...form, 
      createdBy: userData.name,
      attendees: []
    };
    const updated = [...meetings, meeting].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setMeetings(updated);
    saveToStorage('akef_meetings', updated);
    setShowModal(false);
    setForm({ title: "", date: "", time: "", type: "Online" });
  };

  const deleteMeeting = (id: number) => {
    const updated = meetings.filter(m => m.id !== id);
    setMeetings(updated);
    saveToStorage('akef_meetings', updated);
  };

  const upcomingMeetings = meetings.filter(m => new Date(m.date) >= new Date());
  const pastMeetings = meetings.filter(m => new Date(m.date) < new Date());

  const getMeetingTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'online': return 'info';
      case 'in-person': return 'success';
      case 'hybrid': return 'warning';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Video className="text-primary" /> Meetings
        </h2>
        <ActionButton onClick={() => setShowModal(true)}>
          <Plus size={16} /> Schedule Meeting
        </ActionButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard variant="glass">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{upcomingMeetings.length}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </div>
        </GlassCard>
        <GlassCard variant="glass">
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">{meetings.filter(m => m.type.toLowerCase().includes('online')).length}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </GlassCard>
        <GlassCard variant="glass">
          <div className="text-center">
            <p className="text-2xl font-bold text-success">{meetings.filter(m => m.type.toLowerCase().includes('person')).length}</p>
            <p className="text-xs text-muted-foreground">In-Person</p>
          </div>
        </GlassCard>
        <GlassCard variant="glass">
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">{pastMeetings.length}</p>
            <p className="text-xs text-muted-foreground">Past</p>
          </div>
        </GlassCard>
      </div>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            Upcoming Meetings
          </h3>
          <div className="space-y-4">
            {upcomingMeetings.map((meeting, i) => (
              <MeetingCard 
                key={meeting.id} 
                meeting={meeting} 
                onDelete={deleteMeeting}
                delay={i * 50}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-4">Past Meetings</h3>
          <div className="space-y-4 opacity-60">
            {pastMeetings.slice(0, 3).map((meeting, i) => (
              <MeetingCard 
                key={meeting.id} 
                meeting={meeting} 
                onDelete={deleteMeeting}
                delay={i * 50}
                isPast
              />
            ))}
          </div>
        </div>
      )}

      {meetings.length === 0 && (
        <GlassCard className="text-center py-10">
          <Video size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No meetings scheduled yet.</p>
        </GlassCard>
      )}

      {/* Schedule Modal */}
      <PortalModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Schedule New Meeting"
      >
        <form onSubmit={scheduleMeeting} className="space-y-4">
          <FormInput 
            label="Meeting Title"
            required 
            value={form.title} 
            onChange={e => setForm({...form, title: e.target.value})}
            placeholder="e.g., Core Team Sync"
          />
          <div className="grid grid-cols-2 gap-3">
            <FormInput 
              label="Date"
              required 
              type="date" 
              value={form.date} 
              onChange={e => setForm({...form, date: e.target.value})}
            />
            <FormInput 
              label="Time"
              required 
              type="time" 
              value={form.time} 
              onChange={e => setForm({...form, time: e.target.value})}
            />
          </div>
          <FormSelect
            label="Meeting Type"
            value={form.type}
            onChange={e => setForm({...form, type: (e.target as HTMLSelectElement).value})}
            options={[
              { value: "Online (Zoom/Meet)", label: "Online (Zoom/Meet)" },
              { value: "In-Person (HQ)", label: "In-Person (HQ)" },
              { value: "Hybrid", label: "Hybrid" },
            ]}
          />
          <PortalModalFooter>
            <ActionButton type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </ActionButton>
            <ActionButton type="submit">
              Schedule
            </ActionButton>
          </PortalModalFooter>
        </form>
      </PortalModal>
    </div>
  );
}

function MeetingCard({ 
  meeting, 
  onDelete,
  delay = 0,
  isPast = false
}: { 
  meeting: Meeting; 
  onDelete: (id: number) => void;
  delay?: number;
  isPast?: boolean;
}) {
  const getMeetingTypeColor = (type: string) => {
    if (type.toLowerCase().includes('online')) return 'info';
    if (type.toLowerCase().includes('person')) return 'success';
    return 'warning';
  };

  const meetingDate = new Date(meeting.date);

  return (
    <GlassCard 
      hover={!isPast}
      className="group relative animate-slide-up"
      style={{ animationDelay: `${delay}ms` } as React.CSSProperties}
    >
      {!isPast && (
        <button 
          onClick={() => onDelete(meeting.id)} 
          className="absolute top-3 right-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={16} />
        </button>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="bg-secondary rounded-xl p-4 text-center min-w-[5rem] border border-border">
          <div className="text-xs text-muted-foreground uppercase">
            {meetingDate.toLocaleString('default', { weekday: 'short' })}
          </div>
          <div className="text-2xl font-bold text-foreground">
            {meetingDate.getDate()}
          </div>
          <div className="text-xs text-primary font-medium">
            {meetingDate.toLocaleString('default', { month: 'short' })}
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground">{meeting.title}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <StatusBadge variant={getMeetingTypeColor(meeting.type)} size="md">
              <Video size={10} /> {meeting.type}
            </StatusBadge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock size={12} /> {meeting.time}
            </span>
            {meeting.attendees && meeting.attendees.length > 0 && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Users size={12} /> {meeting.attendees.length} attendees
              </span>
            )}
          </div>
          {meeting.createdBy && (
            <p className="text-xs text-muted-foreground mt-2">
              Created by {meeting.createdBy}
            </p>
          )}
        </div>

        {!isPast && (
          <div className="flex sm:flex-col gap-2 justify-end">
            <ActionButton size="sm" variant="secondary">
              Edit
            </ActionButton>
            <ActionButton size="sm">
              Join
            </ActionButton>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
