import { useState, useEffect } from "react";
import { Calendar, Plus, Edit2, Trash2, Save, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { ActionButton } from "./ActionButton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  event_name: string | null;
  college_name: string;
  event_date: string;
  end_date: string | null;
  category: string | null;
  activity: string | null;
  details: string | null;
  status: string;
  created_by: string | null;
}

interface CalendarViewProps {
  userData: {
    role: string;
  };
}

const STATUS_OPTIONS = ['Pending', 'Accepted', 'Rejected', 'Awaiting Confirmation', 'Completed'];
const CATEGORY_OPTIONS = ['Technical', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Seminar', 'Other'];

const initialFormState = {
  event_name: '',
  college_name: '',
  event_date: format(new Date(), 'yyyy-MM-dd'),
  end_date: format(new Date(), 'yyyy-MM-dd'),
  category: '',
  activity: '',
  details: '',
  status: 'Pending',
};

export function CalendarView({ userData }: CalendarViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, event_name, college_name, event_date, end_date, category, activity, details, status, created_by')
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSave = async () => {
    if (!formData.event_name?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Event name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update({
            event_name: formData.event_name,
            college_name: formData.college_name || formData.event_name,
            event_date: formData.event_date,
            end_date: formData.end_date || null,
            category: formData.category || null,
            activity: formData.activity || null,
            details: formData.details || null,
            status: formData.status,
          })
          .eq('id', editingEvent.id);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Event updated successfully' });
      } else {
        const { error } = await supabase
          .from('events')
          .insert({
            event_name: formData.event_name,
            college_name: formData.college_name || formData.event_name,
            event_date: formData.event_date,
            end_date: formData.end_date || null,
            category: formData.category || null,
            activity: formData.activity || null,
            details: formData.details || null,
            status: formData.status,
            created_by: user?.id,
          });
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Event created successfully' });
      }
      
      setShowForm(false);
      setEditingEvent(null);
      setFormData(initialFormState);
      fetchEvents();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save event',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: 'Success', description: 'Event deleted successfully' });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      event_name: event.event_name || '',
      college_name: event.college_name || '',
      event_date: event.event_date,
      end_date: event.end_date || event.event_date,
      category: event.category || '',
      activity: event.activity || '',
      details: event.details || '',
      status: event.status,
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingEvent(null);
    setFormData(initialFormState);
    setShowForm(true);
  };

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.event_date), date));
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'destructive' | 'default' => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'completed':
        return 'success';
      case 'pending':
      case 'awaiting confirmation':
        return 'warning';
      case 'rejected':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="text-accent" /> Events & Activities
        </h2>
        {isAdmin && (
          <ActionButton variant="secondary" onClick={handleAddNew}>
            <Plus size={16} /> Add Event
          </ActionButton>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Events Table - 3 columns */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <GlassCard className="p-6 overflow-x-auto">
            <h3 className="text-lg font-bold text-foreground mb-4">Event Schedule</h3>
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">SL NO</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">START DATE</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">END DATE</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">EVENT NAME</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">CATEGORY</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">ACTIVITY</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">DETAILS</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">STATUS</th>
                  {isAdmin && <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={event.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-2 text-sm text-foreground">{index + 1}</td>
                    <td className="py-3 px-2 text-sm text-foreground">{format(new Date(event.event_date), 'dd-MM-yyyy')}</td>
                    <td className="py-3 px-2 text-sm text-foreground">{event.end_date ? format(new Date(event.end_date), 'dd-MM-yyyy') : '-'}</td>
                    <td className="py-3 px-2 text-sm text-foreground font-medium">{event.event_name || event.college_name}</td>
                    <td className="py-3 px-2 text-sm text-foreground">{event.category || '-'}</td>
                    <td className="py-3 px-2 text-sm text-foreground">{event.activity || '-'}</td>
                    <td className="py-3 px-2 text-sm text-foreground max-w-[200px] truncate" title={event.details || ''}>
                      {event.details || '-'}
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge variant={getStatusColor(event.status)} size="sm">
                        {event.status}
                      </StatusBadge>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && (
              <div className="text-center py-10">
                <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No events scheduled yet.</p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Mini Calendar - 1 column on right */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <GlassCard className="p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <h3 className="text-sm font-bold text-foreground">
                {format(currentMonth, 'MMM yyyy')}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {daysInMonth.map(day => {
                const dayEvents = getEventsForDate(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded-md text-xs relative",
                      isToday && "bg-primary/20 text-primary font-bold",
                      !isSameMonth(day, currentMonth) && "opacity-30"
                    )}
                  >
                    {format(day, 'd')}
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-accent" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Upcoming Events Summary */}
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Upcoming</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                {events.slice(0, 4).map(event => (
                  <div key={event.id} className="text-xs p-2 bg-secondary/50 rounded-lg">
                    <p className="font-medium text-foreground truncate">{event.event_name || event.college_name}</p>
                    <p className="text-muted-foreground">{format(new Date(event.event_date), 'MMM d')}</p>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingEvent(null); }}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Event Name *</label>
                <input
                  type="text"
                  value={formData.event_name}
                  onChange={e => setFormData({ ...formData, event_name: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  placeholder="Enter event name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Select category</option>
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Activity</label>
                  <input
                    type="text"
                    value={formData.activity}
                    onChange={e => setFormData({ ...formData, activity: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g., Workshop, Competition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Details</label>
                <textarea
                  value={formData.details}
                  onChange={e => setFormData({ ...formData, details: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary resize-none"
                  placeholder="Event details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <ActionButton onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </ActionButton>
                <ActionButton 
                  variant="secondary" 
                  onClick={() => { setShowForm(false); setEditingEvent(null); }}
                  className="flex-1"
                >
                  Cancel
                </ActionButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}