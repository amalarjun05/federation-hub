import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";
import { DEFAULT_TEAM } from "@/lib/data";
import { loadFromStorage, saveToStorage } from "@/lib/storage";

interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  time: string;
}

interface ChatWidgetProps {
  currentUser: {
    name: string;
    uid: string;
  };
}

export function ChatWidget({ currentUser }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<string | number>("general");
  const [messages, setMessages] = useState<Record<string | number, ChatMessage[]>>(() => 
    loadFromStorage('akef_chat', {
      general: [
        { id: 1, sender: "Rahul Menon", text: "Has the schedule for the qualifier been released?", time: "10:30 AM" },
        { id: 2, sender: "Sarah Thomas", text: "Yes, check the Library. I uploaded it an hour ago.", time: "10:32 AM" },
      ]
    })
  );
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const team = DEFAULT_TEAM.filter(m => m.uid !== parseInt(currentUser.uid));

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeChat]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      id: Date.now(),
      sender: "You",
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = {
      ...messages,
      [activeChat]: [...(messages[activeChat] || []), msg]
    };

    setMessages(updatedMessages);
    saveToStorage('akef_chat', updatedMessages);
    setNewMessage("");
  };

  const activeMember = typeof activeChat === 'number' 
    ? team.find(m => m.uid === activeChat) 
    : null;

  return (
    <>
      {/* FAB */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50",
          isOpen 
            ? "bg-secondary text-foreground rotate-0" 
            : "bg-primary text-primary-foreground animate-pulse-glow hover:scale-105"
        )}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center border-2 border-background">
            3
          </span>
        )}
      </button>

      {/* Chat Panel */}
      <div className={cn(
        "fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[550px] max-h-[70vh] glass-strong rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden transition-all duration-300 z-40 origin-bottom-right",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none translate-y-4"
      )}>
        {/* Header */}
        <div className="bg-card p-4 border-b border-border flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            {activeChat !== 'general' && (
              <button 
                onClick={() => setActiveChat('general')}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h4 className="font-bold text-foreground flex items-center gap-2">
                {activeChat === 'general' ? '# General' : activeMember?.name}
              </h4>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                {activeChat === 'general' ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-success rounded-full" />
                    {team.filter(m => m.status === 'online').length} online
                  </>
                ) : (
                  <>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      activeMember?.status === 'online' && "bg-success",
                      activeMember?.status === 'busy' && "bg-warning",
                      activeMember?.status === 'offline' && "bg-muted-foreground"
                    )} />
                    {activeMember?.status}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4 bg-background/50">
          {activeChat === 'general' && (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-3">Team members - tap to DM</p>
              <div className="flex justify-center flex-wrap gap-2">
                {team.map(member => (
                  <button
                    key={member.uid}
                    onClick={() => setActiveChat(member.uid)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full border border-border hover:border-primary/50 transition-colors group"
                  >
                    <UserAvatar name={member.name} size="sm" status={member.status} />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground">
                      {member.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(messages[activeChat] || []).map(msg => (
            <div 
              key={msg.id} 
              className={cn("flex flex-col", msg.sender === 'You' ? 'items-end' : 'items-start')}
            >
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                msg.sender === 'You' 
                  ? "bg-primary text-primary-foreground rounded-br-md" 
                  : "bg-secondary text-foreground rounded-bl-md"
              )}>
                {msg.text}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1">
                {msg.sender !== 'You' && `${msg.sender.split(' ')[0]} • `}{msg.time}
              </span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-card border-t border-border flex gap-2 shrink-0">
          <input 
            className="flex-1 bg-secondary border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
            placeholder={`Message ${activeChat === 'general' ? '#general' : activeMember?.name.split(' ')[0]}...`}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground p-2.5 rounded-full transition-colors glow-primary"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}
