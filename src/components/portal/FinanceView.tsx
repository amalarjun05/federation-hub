import { useState } from "react";
import { Plus, Receipt, CheckCircle, XCircle, UploadCloud, Filter } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { ActionButton } from "./ActionButton";
import { PortalModal, PortalModalFooter } from "./PortalModal";
import { FormInput } from "./FormInput";
import { DEFAULT_CLAIMS, Claim } from "@/lib/data";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface FinanceViewProps {
  userData: {
    name: string;
    role: string;
  };
}

export function FinanceView({ userData }: FinanceViewProps) {
  const [claims, setClaims] = useState<Claim[]>(() => 
    loadFromStorage('akef_claims', DEFAULT_CLAIMS)
  );
  const [showModal, setShowModal] = useState(false);
  const [newClaim, setNewClaim] = useState({ desc: "", amount: "", category: "General" });
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');

  const isAdmin = userData.role === "STATE_ADMIN";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const claim: Claim = {
      id: Date.now(),
      claimant: userData.name,
      desc: newClaim.desc,
      amount: parseFloat(newClaim.amount),
      date: new Date().toISOString().split('T')[0],
      status: "Pending",
      proof: "uploaded_file.jpg",
      category: newClaim.category
    };
    const updated = [claim, ...claims];
    setClaims(updated);
    saveToStorage('akef_claims', updated);
    setShowModal(false);
    setNewClaim({ desc: "", amount: "", category: "General" });
  };

  const updateStatus = (id: number, newStatus: Claim['status']) => {
    const updated = claims.map(c => c.id === id ? { ...c, status: newStatus } : c);
    setClaims(updated);
    saveToStorage('akef_claims', updated);
  };

  const filteredClaims = filter === 'all' ? claims : claims.filter(c => c.status === filter);

  const totals = {
    pending: claims.filter(c => c.status === 'Pending').reduce((sum, c) => sum + c.amount, 0),
    approved: claims.filter(c => c.status === 'Approved').reduce((sum, c) => sum + c.amount, 0),
    rejected: claims.filter(c => c.status === 'Rejected').reduce((sum, c) => sum + c.amount, 0),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Receipt className="text-primary" /> Expense Tracking
        </h2>
        <ActionButton onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Claim
        </ActionButton>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="border-warning/30 bg-warning/5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning">₹{totals.pending.toLocaleString()}</p>
            </div>
            <StatusBadge variant="warning">{claims.filter(c => c.status === 'Pending').length} Claims</StatusBadge>
          </div>
        </GlassCard>
        <GlassCard className="border-success/30 bg-success/5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-success">₹{totals.approved.toLocaleString()}</p>
            </div>
            <StatusBadge variant="success">{claims.filter(c => c.status === 'Approved').length} Claims</StatusBadge>
          </div>
        </GlassCard>
        <GlassCard className="border-destructive/30 bg-destructive/5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-destructive">₹{totals.rejected.toLocaleString()}</p>
            </div>
            <StatusBadge variant="destructive">{claims.filter(c => c.status === 'Rejected').length} Claims</StatusBadge>
          </div>
        </GlassCard>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            filter === 'all' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          <Filter size={14} /> All Claims
        </button>
        {(['Pending', 'Approved', 'Rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === status ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Claims List */}
      <div className="grid gap-4">
        {filteredClaims.length === 0 && (
          <GlassCard className="text-center py-10">
            <p className="text-muted-foreground">No claims found.</p>
          </GlassCard>
        )}
        {filteredClaims.map((claim, i) => (
          <GlassCard 
            key={claim.id} 
            hover 
            className="animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold text-foreground">₹{claim.amount.toLocaleString()}</span>
                  <StatusBadge 
                    variant={claim.status === 'Approved' ? 'success' : claim.status === 'Rejected' ? 'destructive' : 'warning'}
                    size="md"
                  >
                    {claim.status}
                  </StatusBadge>
                  {claim.category && (
                    <StatusBadge variant="outline" size="sm">{claim.category}</StatusBadge>
                  )}
                </div>
                <h4 className="text-foreground font-medium">{claim.desc}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Submitted by <span className="text-primary">{claim.claimant}</span> on {claim.date}
                </p>
              </div>
              
              {isAdmin && claim.status === "Pending" && (
                <div className="flex gap-2 w-full lg:w-auto">
                  <ActionButton 
                    onClick={() => updateStatus(claim.id, "Approved")}
                    variant="success"
                    size="sm"
                    className="flex-1 lg:flex-initial"
                  >
                    <CheckCircle size={14} /> Approve
                  </ActionButton>
                  <ActionButton 
                    onClick={() => updateStatus(claim.id, "Rejected")}
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
        ))}
      </div>

      {/* New Claim Modal */}
      <PortalModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Submit Expense Claim"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput 
            label="Description"
            required 
            value={newClaim.desc} 
            onChange={e => setNewClaim({...newClaim, desc: e.target.value})} 
            placeholder="e.g., Venue Advance" 
          />
          <FormInput 
            label="Amount (₹)"
            required 
            type="number" 
            value={newClaim.amount} 
            onChange={e => setNewClaim({...newClaim, amount: e.target.value})} 
            placeholder="0.00" 
          />
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Category</label>
            <select 
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              value={newClaim.category}
              onChange={e => setNewClaim({...newClaim, category: e.target.value})}
            >
              <option>General</option>
              <option>Venue</option>
              <option>Technology</option>
              <option>Events</option>
              <option>Travel</option>
            </select>
          </div>
          <div className="p-6 border-2 border-dashed border-border rounded-xl text-center text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors">
            <UploadCloud className="mx-auto mb-2" size={24} />
            <p className="text-sm">Upload Bill / Receipt</p>
            <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG or PDF up to 5MB</p>
          </div>
          <PortalModalFooter>
            <ActionButton type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </ActionButton>
            <ActionButton type="submit">
              Submit Claim
            </ActionButton>
          </PortalModalFooter>
        </form>
      </PortalModal>
    </div>
  );
}
