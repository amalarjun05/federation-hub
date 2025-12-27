import { useState, useRef, useEffect, useMemo } from "react";
import { MessageCircle, X, Send, Maximize2, Minimize2, ArrowLeft, Smile, Paperclip, Image as ImageIcon, MoreHorizontal, Search, Hash, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  reactions: Record<string, string[]>;
  created_at: string;
}

interface Channel {
  id: string;
  name: string;
  is_direct_message: boolean;
  last_message?: string;
  unread_count?: number;
}

const EMOJI_CATEGORIES = {
  recent: ['👍', '❤️', '😊', '😂', '🎉', '🔥', '👏', '✨'],
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘'],
  gestures: ['👋', '🤚', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👍', '👎', '👊'],
  objects: ['💼', '📁', '📂', '📅', '📆', '📌', '📎', '🔗', '✂️', '📝', '✏️', '🔍', '🔎', '💡', '💰'],
};

const GENERAL_CHANNEL_ID = '00000000-0000-0000-0000-000000000001';

export function EnhancedChatWidget() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeChannel, setActiveChannel] = useState<string>(GENERAL_CHANNEL_ID);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<Record<string, { full_name: string; avatar_url: string | null }>>({});
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch channels
  useEffect(() => {
    if (!user) return;
    
    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from('chat_channels')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching channels:', error);
        return;
      }
      
      setChannels(data || []);
    };
    
    fetchChannels();
  }, [user]);

  // Fetch messages for active channel
  useEffect(() => {
    if (!activeChannel || !user) return;
    
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', activeChannel)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      
      // Fetch sender profiles
      const senderIds = [...new Set((data || []).map(m => m.sender_id))];
      if (senderIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', senderIds);
        
        if (profilesData) {
          const profileMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
          profilesData.forEach(p => {
            profileMap[p.id] = { full_name: p.full_name || 'Anonymous', avatar_url: p.avatar_url };
          });
          setProfiles(prev => ({ ...prev, ...profileMap }));
        }
      }
      
      const formattedMessages: ChatMessage[] = (data || []).map(m => ({
        id: m.id,
        sender_id: m.sender_id,
        sender_name: profiles[m.sender_id]?.full_name || 'Loading...',
        sender_avatar: profiles[m.sender_id]?.avatar_url || undefined,
        content: m.content,
        reactions: (m.reactions as Record<string, string[]>) || {},
        created_at: m.created_at,
      }));
      
      setMessages(formattedMessages);
    };
    
    fetchMessages();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`messages-${activeChannel}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${activeChannel}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Fetch sender profile if not cached
          if (!profiles[newMsg.sender_id]) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', newMsg.sender_id)
              .single();
            
            if (profileData) {
              setProfiles(prev => ({
                ...prev,
                [profileData.id]: { full_name: profileData.full_name || 'Anonymous', avatar_url: profileData.avatar_url }
              }));
            }
          }
          
          const message: ChatMessage = {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            sender_name: profiles[newMsg.sender_id]?.full_name || profile?.full_name || 'You',
            sender_avatar: profiles[newMsg.sender_id]?.avatar_url || undefined,
            content: newMsg.content,
            reactions: newMsg.reactions || {},
            created_at: newMsg.created_at,
          };
          
          setMessages(prev => [...prev, message]);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannel, user, profile]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: activeChannel,
        sender_id: user.id,
        content: newMessage.trim(),
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      return;
    }

    setNewMessage("");
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: 'Upload failed',
        description: uploadError.message,
        variant: 'destructive',
      });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName);

    // Send as message with attachment
    await supabase.from('chat_messages').insert({
      channel_id: activeChannel,
      sender_id: user.id,
      content: `📎 [File: ${file.name}](${publicUrl})`,
    });

    toast({
      title: 'File uploaded',
      description: 'Your file has been shared.',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activeChannelData = channels.find(c => c.id === activeChannel);
  
  const filteredChannels = useMemo(() => {
    if (!searchQuery) return channels;
    return channels.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [channels, searchQuery]);

  if (!user) return null;

  const chatContent = (
    <div className={cn(
      "flex h-full",
      isFullscreen && "flex-row"
    )}>
      {/* Sidebar / Conversation List */}
      <div className={cn(
        "border-r border-border bg-card flex flex-col",
        isFullscreen ? "w-72" : "w-full",
        !showConversationList && !isFullscreen && "hidden"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-foreground">Messages</h3>
            <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        
        {/* Channel List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-2">
            <p className="px-2 py-1 text-xs text-muted-foreground font-semibold uppercase">Channels</p>
            {filteredChannels.filter(c => !c.is_direct_message).map(channel => (
              <button
                key={channel.id}
                onClick={() => {
                  setActiveChannel(channel.id);
                  if (!isFullscreen) setShowConversationList(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  activeChannel === channel.id 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-secondary text-foreground"
                )}
              >
                <Hash size={18} className="text-muted-foreground" />
                <span className="flex-1 text-left text-sm font-medium truncate">{channel.name}</span>
              </button>
            ))}
          </div>
          
          <div className="p-2">
            <p className="px-2 py-1 text-xs text-muted-foreground font-semibold uppercase">Direct Messages</p>
            {filteredChannels.filter(c => c.is_direct_message).map(channel => (
              <button
                key={channel.id}
                onClick={() => {
                  setActiveChannel(channel.id);
                  if (!isFullscreen) setShowConversationList(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  activeChannel === channel.id 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-secondary text-foreground"
                )}
              >
                <Users size={18} className="text-muted-foreground" />
                <span className="flex-1 text-left text-sm font-medium truncate">{channel.name}</span>
              </button>
            ))}
            {filteredChannels.filter(c => c.is_direct_message).length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">No direct messages yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-background/50",
        !showConversationList || isFullscreen ? "flex" : "hidden"
      )}>
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center gap-3">
            {!isFullscreen && (
              <button 
                onClick={() => setShowConversationList(true)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h4 className="font-bold text-foreground flex items-center gap-2">
                <Hash size={16} className="text-muted-foreground" />
                {activeChannelData?.name || 'General'}
              </h4>
              <span className="text-xs text-muted-foreground">
                {messages.length} messages
              </span>
            </div>
          </div>
          
          {!isFullscreen && (
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              <Maximize2 size={18} />
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle size={48} className="mb-4 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Be the first to say something!</p>
            </div>
          )}
          
          {messages.map((msg, idx) => {
            const isOwnMessage = msg.sender_id === user?.id;
            const senderProfile = profiles[msg.sender_id];
            const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;
            
            return (
              <div key={msg.id} className={cn("flex gap-3", isOwnMessage && "flex-row-reverse")}>
              {showAvatar ? (
                  <UserAvatar 
                    name={senderProfile?.full_name || msg.sender_name} 
                    size="md"
                    src={senderProfile?.avatar_url || undefined}
                  />
                ) : (
                  <div className="w-8" />
                )}
                
                <div className={cn("flex flex-col max-w-[75%]", isOwnMessage && "items-end")}>
                  {showAvatar && (
                    <div className={cn("flex items-center gap-2 mb-1", isOwnMessage && "flex-row-reverse")}>
                      <span className="text-sm font-medium text-foreground">
                        {isOwnMessage ? 'You' : (senderProfile?.full_name || msg.sender_name)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  )}
                  
                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm",
                    isOwnMessage 
                      ? "bg-primary text-primary-foreground rounded-tr-md" 
                      : "bg-secondary text-foreground rounded-tl-md"
                  )}>
                    {msg.content}
                  </div>
                  
                  {/* Reactions */}
                  {Object.keys(msg.reactions).length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {Object.entries(msg.reactions).map(([emoji, users]) => (
                        <span 
                          key={emoji}
                          className="px-2 py-0.5 bg-secondary rounded-full text-xs flex items-center gap-1"
                        >
                          {emoji} {users.length}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-border bg-card shrink-0">
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="mb-3 p-3 bg-secondary rounded-xl border border-border animate-scale-in">
              <div className="flex gap-1 mb-2">
                {Object.keys(EMOJI_CATEGORIES).map(category => (
                  <button
                    key={category}
                    className="px-2 py-1 text-xs rounded-md hover:bg-primary/10 text-muted-foreground hover:text-foreground capitalize"
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_CATEGORIES.smileys.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="p-1.5 text-lg hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="flex gap-1">
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  showEmojiPicker ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Smile size={20} />
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Paperclip size={20} />
              </button>
            </div>
            
            <input 
              ref={inputRef}
              className="flex-1 bg-secondary border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
              placeholder={`Message #${activeChannelData?.name || 'general'}...`}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
            />
            
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground p-2.5 rounded-full transition-colors glow-primary"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  // Fullscreen Mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background animate-fade-in">
        <div className="h-full flex flex-col">
          {/* Fullscreen Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="text-primary" />
              Team Chat
            </h2>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <Minimize2 size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {chatContent}
          </div>
        </div>
      </div>
    );
  }

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
      </button>

      {/* Chat Panel */}
      <div className={cn(
        "fixed bottom-24 right-6 w-[420px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[75vh] glass-strong rounded-2xl shadow-2xl border border-border overflow-hidden transition-all duration-300 z-40 origin-bottom-right",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none translate-y-4"
      )}>
        {chatContent}
      </div>
    </>
  );
}
