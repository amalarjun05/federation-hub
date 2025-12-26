import { useState } from "react";
import { Vote, Plus, BarChart3 } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { ActionButton } from "./ActionButton";
import { DEFAULT_POLLS, Poll } from "@/lib/data";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface GovernanceViewProps {
  userData: {
    role: string;
  };
}

export function GovernanceView({ userData }: GovernanceViewProps) {
  const [polls, setPolls] = useState<Poll[]>(() => 
    loadFromStorage('akef_polls', DEFAULT_POLLS)
  );

  const handleVote = (pollId: number, optionId: string) => {
    const updated = polls.map(poll => {
      if (poll.id === pollId) {
        if (poll.userVoted || poll.status === 'Closed') return poll;
        return {
          ...poll,
          totalVotes: poll.totalVotes + 1,
          userVoted: optionId,
          options: poll.options.map(opt => 
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
          )
        };
      }
      return poll;
    });
    setPolls(updated);
    saveToStorage('akef_polls', updated);
  };

  const activePolls = polls.filter(p => p.status === 'Active');
  const closedPolls = polls.filter(p => p.status === 'Closed');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Vote className="text-accent" /> Governance & Polling
        </h2>
        {userData.role === "STATE_ADMIN" && (
          <ActionButton variant="secondary">
            <Plus size={16} /> Create Poll
          </ActionButton>
        )}
      </div>

      {/* Active Polls */}
      {activePolls.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            Active Polls
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activePolls.map((poll, i) => (
              <PollCard 
                key={poll.id} 
                poll={poll} 
                onVote={handleVote}
                delay={i * 50}
              />
            ))}
          </div>
        </div>
      )}

      {/* Closed Polls */}
      {closedPolls.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <BarChart3 size={18} />
            Past Polls
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {closedPolls.map((poll, i) => (
              <PollCard 
                key={poll.id} 
                poll={poll} 
                onVote={handleVote}
                delay={i * 50}
              />
            ))}
          </div>
        </div>
      )}

      {polls.length === 0 && (
        <GlassCard className="text-center py-10">
          <Vote size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No polls available yet.</p>
        </GlassCard>
      )}
    </div>
  );
}

function PollCard({ 
  poll, 
  onVote,
  delay = 0
}: { 
  poll: Poll; 
  onVote: (pollId: number, optionId: string) => void;
  delay?: number;
}) {
  const canVote = poll.status === 'Active' && !poll.userVoted;
  const showResults = poll.userVoted || poll.status === 'Closed';

  return (
    <GlassCard 
      className={cn(
        "animate-slide-up",
        poll.status === 'Active' && "border-t-2 border-t-accent"
      )}
      style={{ animationDelay: `${delay}ms` } as React.CSSProperties}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg text-foreground pr-4">{poll.question}</h3>
        <StatusBadge 
          variant={poll.status === 'Active' ? 'success' : 'outline'}
          size="md"
        >
          {poll.status}
        </StatusBadge>
      </div>

      <div className="space-y-3">
        {poll.options.map(option => {
          const percentage = poll.totalVotes > 0 
            ? Math.round((option.votes / poll.totalVotes) * 100) 
            : 0;
          const isSelected = poll.userVoted === option.id;
          const isWinner = showResults && 
            option.votes === Math.max(...poll.options.map(o => o.votes));
          
          return (
            <div 
              key={option.id}
              onClick={() => canVote && onVote(poll.id, option.id)}
              className={cn(
                "relative p-4 rounded-lg border transition-all overflow-hidden",
                canVote && "cursor-pointer hover:border-accent hover:bg-accent/5",
                !canVote && "cursor-default",
                isSelected ? "border-primary bg-primary/10" : "border-border bg-secondary/30"
              )}
            >
              {/* Progress Bar */}
              {showResults && (
                <div 
                  className={cn(
                    "absolute inset-0 transition-all duration-500 ease-out",
                    isSelected ? "bg-primary/20" : isWinner ? "bg-accent/20" : "bg-secondary/50"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              )}
              
              <div className="relative flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                  {!showResults && (
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      canVote ? "border-muted-foreground" : "border-transparent"
                    )}>
                      {canVote && <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-primary" />}
                    </div>
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {option.text}
                    {isSelected && <span className="text-primary ml-2">(Your vote)</span>}
                  </span>
                </div>
                {showResults && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{option.votes} votes</span>
                    <span className={cn(
                      "text-sm font-bold",
                      isWinner ? "text-accent" : "text-foreground"
                    )}>
                      {percentage}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
        <span>Total: {poll.totalVotes} votes</span>
        {canVote && <span className="text-accent">Tap an option to vote</span>}
        {poll.endDate && <span>Ends: {new Date(poll.endDate).toLocaleDateString()}</span>}
      </div>
    </GlassCard>
  );
}
