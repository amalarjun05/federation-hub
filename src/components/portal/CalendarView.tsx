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
  college_name: string;
  fest_name: string | null;
  event_date: string;
  no_of_days: number | null;
  event_type: string | null;
  requirement: string | null;
  internet_access: string | null;
  contact_name: string | null;
  phone_number: string | null;
  status: string;
  cost: number | null;
  update_1: string | null;
  update_2: string | null;
  update_3: string | null;
  created_by: string | null;
}

interface CalendarViewProps {
  userData: {
    role: string;
  };
}

const STATUS_OPTIONS = ['Pending', 'Accepted', 'Rejected', 'Awaiting Confirmation', 'Completed'];

const initialFormState: Omit<Event, 'id' | 'created_by'> = {
  college_name: '',
  fest_name: '',
  event_date: format(new Date(), 'yyyy-MM-dd'),
  no_of_days: 1,
  event_type: '',
  requirement: '',
  internet_access: '',
  contact_name: '',
  phone_number: '',
  status: 'Pending',
  cost: null,
  update_1: '',
  update_2: '',
  update_3: '',
};

export function CalendarView({ userData }: CalendarViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
        .select('*')
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
    if (!formData.college_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'College/Organization name is required',
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
            ...formData,
            cost: formData.cost || null,
          })
          .eq('id', editingEvent.id);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Event updated successfully' });
      } else {
        const { error } = await supabase
          .from('events')
          .insert({
            ...formData,
            cost: formData.cost || null,
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
      college_name: event.college_name,
      fest_name: event.fest_name || '',
      event_date: event.event_date,
      no_of_days: event.no_of_days || 1,
      event_type: event.event_type || '',
      requirement: event.requirement || '',
      internet_access: event.internet_access || '',
      contact_name: event.contact_name || '',
      phone_number: event.phone_number || '',
      status: event.status,
      cost: event.cost,
      update_1: event.update_1 || '',
      update_2: event.update_2 || '',
      update_3: event.update_3 || '',
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingEvent(null);
    setFormData({
      ...initialFormState,
      event_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    });
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
          <Calendar className="text-accent" /> Event Calendar
        </h2>
        {isAdmin && (
          <ActionButton variant="secondary" onClick={handleAddNew}>
            <Plus size={16} /> Add Event
          </ActionButton>
        )}
      </div>

      {/* Calendar Grid */}
      <GlassCard className="p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-xl font-bold text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the month starts */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {daysInMonth.map(day => {
            const dayEvents = getEventsForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "aspect-square p-1 rounded-lg border transition-all relative group",
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-transparent hover:border-border hover:bg-secondary/50",
                  isToday && !isSelected && "border-accent/50",
                  !isSameMonth(day, currentMonth) && "opacity-30"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  isToday && "text-accent",
                  isSelected && "text-primary"
                )}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-accent" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Selected Date Events */}
      {selectedDate && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">
              Events on {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            {isAdmin && (
              <ActionButton variant="ghost" size="sm" onClick={handleAddNew}>
                <Plus size={14} /> Add
              </ActionButton>
            )}
          </div>
          
          {getEventsForDate(selectedDate).length === 0 ? (
            <p className="text-muted-foreground text-sm">No events scheduled for this date.</p>
          ) : (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map(event => (
                <div 
                  key={event.id}
                  className="p-4 bg-secondary/50 rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{event.college_name}</h4>
                        <StatusBadge variant={getStatusColor(event.status)} size="sm">
                          {event.status}
                        </StatusBadge>
                      </div>
                      {event.fest_name && (
                        <p className="text-sm text-accent font-medium">{event.fest_name}</p>
                      )}
                      {event.event_type && (
                        <p className="text-sm text-muted-foreground">{event.event_type}</p>
                      )}
                      {event.contact_name && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Contact: {event.contact_name} {event.phone_number && `• ${event.phone_number}`}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* All Events Table */}
      <GlassCard className="p-6 overflow-x-auto">
        <h3 className="text-lg font-bold text-foreground mb-4">All Events</h3>
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">NO</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">COLLEGE/ORG</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">FEST NAME</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">DATE</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">DAYS</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">TYPE</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">REQUIREMENT</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">CONTACT</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">STATUS</th>
              {isAdmin && <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {events.map((event, index) => (
              <tr key={event.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-2 text-sm text-foreground">{index + 1}</td>
                <td className="py-3 px-2 text-sm text-foreground font-medium">{event.college_name}</td>
                <td className="py-3 px-2 text-sm text-foreground">{event.fest_name || '-'}</td>
                <td className="py-3 px-2 text-sm text-foreground">{format(new Date(event.event_date), 'dd-MM-yy')}</td>
                <td className="py-3 px-2 text-sm text-foreground">{event.no_of_days || 1}</td>
                <td className="py-3 px-2 text-sm text-foreground">{event.event_type || '-'}</td>
                <td className="py-3 px-2 text-sm text-foreground">{event.requirement || '-'}</td>
                <td className="py-3 px-2 text-sm text-foreground">
                  {event.contact_name || '-'}
                  {event.phone_number && <span className="block text-xs text-muted-foreground">{event.phone_number}</span>}
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

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">College/Organization Name *</label>
                <input
                  type="text"
                  value={formData.college_name}
                  onChange={e => setFormData(prev => ({ ...prev, college_name: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  placeholder="Enter college or organization name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Fest Name</label>
                <input
                  type="text"
                  value={formData.fest_name || ''}
                  onChange={e => setFormData(prev => ({ ...prev, fest_name: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  placeholder="e.g., Tech Fest 2026"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Event Date *</label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={e => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Number of Days</label>
                <input
                  type="number"
                  min="1"
                  value={formData.no_of_days || 1}
                  onChange={e => setFormData(prev => ({ ...prev, no_of_days: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Event Type</label>
                <input
                  type="text"
                  value={formData.event_type || ''}
                  onChange={e => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  placeholder="e.g., Tech Fest, Gaming Tournament"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Requirement</label>
                <input
                  type="text"
                  value={formData.requirement || ''}
                  onChange={e => setFormData(prev => ({ ...prev, requirement: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  placeholder="e.g., Experience Zone, Tournament"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Internet Access</label>
                <input
                  type="text"
                  value={formData.internet_access || ''}
                  onChange={e => setFormData(prev => ({ ...prev, internet_access: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  placeholder="e.g., BSNL, Jio"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Contact Name</label>
                <input
                  type="text"
                  value={formData.contact_name || ''}
                  onChange={e => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  placeholder="Contact person name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone_number || ''}
                  onChange={e => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  placeholder="Contact phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Cost (INR)</label>
                <input
                  type="number"
                  value={formData.cost || ''}
                  onChange={e => setFormData(prev => ({ ...prev, cost: e.target.value ? parseFloat(e.target.value) : null }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  placeholder="0.00"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Update 1</label>
                <textarea
                  value={formData.update_1 || ''}
                  onChange={e => setFormData(prev => ({ ...prev, update_1: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary resize-none"
                  rows={2}
                  placeholder="Latest update..."
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Update 2</label>
                <textarea
                  value={formData.update_2 || ''}
                  onChange={e => setFormData(prev => ({ ...prev, update_2: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary resize-none"
                  rows={2}
                  placeholder="Additional update..."
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Update 3</label>
                <textarea
                  value={formData.update_3 || ''}
                  onChange={e => setFormData(prev => ({ ...prev, update_3: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary resize-none"
                  rows={2}
                  placeholder="Additional update..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <ActionButton
                variant="secondary"
                onClick={() => { setShowForm(false); setEditingEvent(null); }}
                className="flex-1"
              >
                Cancel
              </ActionButton>
              <ActionButton
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingEvent ? 'Update Event' : 'Create Event'}
              </ActionButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
