import { useState } from "react";
import { CalendarDays, Plus, CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { ActionButton } from "./ActionButton";
import { PortalModal, PortalModalFooter } from "./PortalModal";
import { FormInput, FormTextarea, FormSelect } from "./FormInput";
import { DEFAULT_LEAVE_REQUESTS, LeaveRequest } from "@/lib/data";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface LeaveViewProps {
  userData: {
    name: string;
    role: string;
  };
}

export function LeaveView({ userData }: LeaveViewProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>(() => 
    loadFromStorage('akef_leave', DEFAULT_LEAVE_REQUESTS)
  );
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    type: "Annual", 
    startDate: "", 
    endDate: "", 
    reason: "" 
  });

  const isAdmin = userData.role === "STATE_ADMIN";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const request: LeaveRequest = {
      id: Date.now(),
      applicant: userData.name,
      type: form.type as LeaveRequest['type'],
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
      status: "Pending",
      appliedOn: new Date().toISOString().split('T')[0]
    };
    const updated = [request, ...requests];
    setRequests(updated);
    saveToStorage('akef_leave', updated);
    setShowModal(false);
    setForm({ type: "Annual", startDate: "", endDate: "", reason: "" });
  };

  const updateStatus = (id: number, newStatus: LeaveRequest['status']) => {
    const updated = requests.map(r => r.id === id ? { ...r, status: newStatus } : r);
    setRequests(updated);
    saveToStorage('akef_leave', updated);
  };

  const getLeaveTypeColor = (type: LeaveRequest['type']) => {
    switch (type) {
      case 'Annual': return 'info';
      case 'Sick': return 'destructive';
      case 'Personal': return 'warning';
      case 'Emergency': return 'destructive';
      default: return 'outline';
    }
  };

  const getDaysCount = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const otherRequests = requests.filter(r => r.status !== 'Pending');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="text-primary" /> Leave Management
        </h2>
        <ActionButton onClick={() => setShowModal(true)}>
          <Plus size={16} /> Apply Leave
        </ActionButton>
      </div>

      {/* Leave Balance (Mock) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="border-accent/30 bg-accent/5">
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">12</p>
            <p className="text-xs text-muted-foreground">Annual Leave</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">8 used • 4 remaining</p>
          </div>
        </GlassCard>
        <GlassCard className="border-destructive/30 bg-destructive/5">
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">6</p>
            <p className="text-xs text-muted-foreground">Sick Leave</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">2 used • 4 remaining</p>
          </div>
        </GlassCard>
        <GlassCard className="border-warning/30 bg-warning/5">
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">3</p>
            <p className="text-xs text-muted-foreground">Personal Leave</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">1 used • 2 remaining</p>
          </div>
        </GlassCard>
        <GlassCard className="border-primary/30 bg-primary/5">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{pendingRequests.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Awaiting approval</p>
          </div>
        </GlassCard>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock size={18} className="text-warning" />
            Pending Requests
          </h3>
          <div className="space-y-4">
            {pendingRequests.map((request, i) => (
              <LeaveCard 
                key={request.id} 
                request={request}
                isAdmin={isAdmin}
                onUpdateStatus={updateStatus}
                delay={i * 50}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Requests */}
      {otherRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-4">Request History</h3>
          <div className="space-y-4">
            {otherRequests.map((request, i) => (
              <LeaveCard 
                key={request.id} 
                request={request}
                isAdmin={isAdmin}
                onUpdateStatus={updateStatus}
                delay={i * 50}
              />
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <GlassCard className="text-center py-10">
          <CalendarDays size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No leave requests yet.</p>
        </GlassCard>
      )}

      {/* Apply Leave Modal */}
      <PortalModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Apply for Leave"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormSelect
            label="Leave Type"
            value={form.type}
            onChange={e => setForm({...form, type: (e.target as HTMLSelectElement).value})}
            options={[
              { value: "Annual", label: "Annual Leave" },
              { value: "Sick", label: "Sick Leave" },
              { value: "Personal", label: "Personal Leave" },
              { value: "Emergency", label: "Emergency Leave" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormInput 
              label="Start Date"
              required 
              type="date" 
              value={form.startDate} 
              onChange={e => setForm({...form, startDate: e.target.value})}
            />
            <FormInput 
              label="End Date"
              required 
              type="date" 
              value={form.endDate} 
              onChange={e => setForm({...form, endDate: e.target.value})}
            />
          </div>
          {form.startDate && form.endDate && (
            <p className="text-sm text-muted-foreground">
              Duration: <span className="text-primary font-medium">{getDaysCount(form.startDate, form.endDate)} days</span>
            </p>
          )}
          <FormTextarea 
            label="Reason"
            required 
            rows={3}
            value={form.reason} 
            onChange={e => setForm({...form, reason: e.target.value})}
            placeholder="Please provide a reason for your leave request..."
          />
          <PortalModalFooter>
            <ActionButton type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </ActionButton>
            <ActionButton type="submit">
              Submit Request
            </ActionButton>
          </PortalModalFooter>
        </form>
      </PortalModal>
    </div>
  );
}

function LeaveCard({ 
  request, 
  isAdmin,
  onUpdateStatus,
  delay = 0
}: { 
  request: LeaveRequest; 
  isAdmin: boolean;
  onUpdateStatus: (id: number, status: LeaveRequest['status']) => void;
  delay?: number;
}) {
  const getLeaveTypeColor = (type: LeaveRequest['type']) => {
    switch (type) {
      case 'Annual': return 'info';
      case 'Sick': return 'destructive';
      case 'Personal': return 'warning';
      case 'Emergency': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusVariant = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'destructive';
      default: return 'warning';
    }
  };

  const getDaysCount = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <GlassCard 
      hover 
      className="animate-slide-up"
      style={{ animationDelay: `${delay}ms` } as React.CSSProperties}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <StatusBadge variant={getLeaveTypeColor(request.type)} size="md">
              {request.type}
            </StatusBadge>
            <StatusBadge variant={getStatusVariant(request.status)} size="md">
              {request.status}
            </StatusBadge>
            <span className="text-sm text-muted-foreground">
              {getDaysCount(request.startDate, request.endDate)} days
            </span>
          </div>
          <p className="font-medium text-foreground">{request.applicant}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar size={12} />
            <span>{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{request.reason}</p>
          <p className="text-xs text-muted-foreground/60 mt-2">Applied on {request.appliedOn}</p>
        </div>
        
        {isAdmin && request.status === "Pending" && (
          <div className="flex gap-2 w-full lg:w-auto">
            <ActionButton 
              onClick={() => onUpdateStatus(request.id, "Approved")}
              variant="success"
              size="sm"
              className="flex-1 lg:flex-initial"
            >
              <CheckCircle size={14} /> Approve
            </ActionButton>
            <ActionButton 
              onClick={() => onUpdateStatus(request.id, "Rejected")}
              variant="destructive"
              size="sm"
              className="flex-1 lg:flex-initial"
            >
              <XCircle size={14} /> Reject
            </ActionButton>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
