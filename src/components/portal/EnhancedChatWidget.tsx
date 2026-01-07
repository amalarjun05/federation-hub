import { useState, useRef, useEffect, useMemo } from "react";
import { MessageCircle, X, Send, Maximize2, Minimize2, ArrowLeft, Smile, Paperclip, Image as ImageIcon, MoreHorizontal, Search, Hash, Users, Bold, Italic, Link2, List, Code } from "lucide-react";
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
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'],
  gestures: ['👋', '🤚', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  objects: ['💼', '📁', '📂', '📅', '📆', '📌', '📎', '🔗', '✂️', '📝', '✏️', '🔍', '🔎', '💡', '💰', '💳', '📱', '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📷', '🎥'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✅', '❌', '⭐', '🌟', '💫', '✨'],
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
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');
  const [showConversationList, setShowConversationList] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<Record<string, { full_name: string; avatar_url: string | null }>>({});
  const [showFormatting, setShowFormatting] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
    setShowFormatting(false);
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const applyFormatting = (format: string) => {
    const textarea = inputRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newMessage.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `_${selectedText}_`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'list':
        formattedText = `\n• ${selectedText}`;
        break;
      default:
        formattedText = selectedText;
    }
    
    setNewMessage(newMessage.substring(0, start) + formattedText + newMessage.substring(end));
  };

  const activeChannelData = channels.find(c => c.id === activeChannel);
  
  const filteredChannels = useMemo(() => {
    if (!searchQuery) return channels;
    return channels.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [channels, searchQuery]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';
    
    messages.forEach(msg => {
      const msgDate = formatDate(msg.created_at);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    
    return groups;
  }, [messages]);

  if (!user) return null;

  const chatContent = (
    <div className={cn(
      "flex h-full",
      isFullscreen && "flex-row"
    )}>
      {/* Sidebar / Conversation List */}
      <div className={cn(
        "border-r border-border bg-card flex flex-col",
        isFullscreen ? "w-80" : "w-full",
        !showConversationList && !isFullscreen && "hidden"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg text-foreground">Messages</h3>
            <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
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
              className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        
        {/* Channel List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-3">
            <p className="px-3 py-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Channels</p>
            {filteredChannels.filter(c => !c.is_direct_message).map(channel => (
              <button
                key={channel.id}
                onClick={() => {
                  setActiveChannel(channel.id);
                  if (!isFullscreen) setShowConversationList(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                  activeChannel === channel.id 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "hover:bg-secondary text-foreground"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Hash size={18} className="text-accent" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-semibold block">{channel.name}</span>
                  <span className="text-xs text-muted-foreground">Team channel</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-3">
            <p className="px-3 py-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Direct Messages</p>
            {filteredChannels.filter(c => c.is_direct_message).map(channel => (
              <button
                key={channel.id}
                onClick={() => {
                  setActiveChannel(channel.id);
                  if (!isFullscreen) setShowConversationList(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                  activeChannel === channel.id 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "hover:bg-secondary text-foreground"
                )}
              >
                <UserAvatar name={channel.name} size="md" />
                <div className="flex-1 text-left">
                  <span className="text-sm font-semibold block">{channel.name}</span>
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </button>
            ))}
            {filteredChannels.filter(c => c.is_direct_message).length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">No direct messages yet</p>
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
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Hash size={18} className="text-accent" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">
                {activeChannelData?.name || 'General'}
              </h4>
              <span className="text-xs text-muted-foreground">
                {messages.length} messages • Team channel
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
              <Search size={18} />
            </button>
            {!isFullscreen && (
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
              >
                <Maximize2 size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <MessageCircle size={40} className="text-accent" />
              </div>
              <p className="text-lg font-semibold text-foreground mb-1">No messages yet</p>
              <p className="text-sm">Be the first to start the conversation!</p>
            </div>
          )}
          
          {groupedMessages.map((group, groupIdx) => (
            <div key={groupIdx}>
              {/* Date separator */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-medium text-muted-foreground px-3 py-1 bg-secondary rounded-full">
                  {group.date}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              
              {group.messages.map((msg, idx) => {
                const isOwnMessage = msg.sender_id === user?.id;
                const senderProfile = profiles[msg.sender_id];
                const showAvatar = idx === 0 || group.messages[idx - 1].sender_id !== msg.sender_id;
                
                return (
                  <div key={msg.id} className={cn("flex gap-3 mb-2 group", isOwnMessage && "flex-row-reverse")}>
                    {showAvatar ? (
                      <UserAvatar 
                        name={senderProfile?.full_name || msg.sender_name} 
                        size="md"
                        src={senderProfile?.avatar_url || undefined}
                      />
                    ) : (
                      <div className="w-8" />
                    )}
                    
                    <div className={cn("flex flex-col max-w-[70%]", isOwnMessage && "items-end")}>
                      {showAvatar && (
                        <div className={cn("flex items-center gap-2 mb-1", isOwnMessage && "flex-row-reverse")}>
                          <span className="text-sm font-semibold text-foreground">
                            {isOwnMessage ? 'You' : (senderProfile?.full_name || msg.sender_name)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      )}
                      
                      <div className={cn(
                        "rounded-2xl px-4 py-3 text-sm leading-relaxed",
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
                              className="px-2 py-0.5 bg-secondary rounded-full text-xs flex items-center gap-1 hover:bg-secondary/80 cursor-pointer transition-colors"
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
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card shrink-0">
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="mb-3 p-4 bg-secondary rounded-2xl border border-border animate-scale-in">
              <div className="flex gap-1 mb-3 border-b border-border pb-3">
                {Object.keys(EMOJI_CATEGORIES).map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveEmojiCategory(category as keyof typeof EMOJI_CATEGORIES)}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-lg font-medium capitalize transition-colors",
                      activeEmojiCategory === category 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto scrollbar-thin">
                {EMOJI_CATEGORIES[activeEmojiCategory].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="p-2 text-xl hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formatting Toolbar */}
          {showFormatting && (
            <div className="mb-3 flex items-center gap-1 p-2 bg-secondary rounded-xl border border-border animate-scale-in">
              <button 
                onClick={() => applyFormatting('bold')}
                className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                title="Bold"
              >
                <Bold size={16} />
              </button>
              <button 
                onClick={() => applyFormatting('italic')}
                className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                title="Italic"
              >
                <Italic size={16} />
              </button>
              <button 
                onClick={() => applyFormatting('code')}
                className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                title="Code"
              >
                <Code size={16} />
              </button>
              <button 
                onClick={() => applyFormatting('link')}
                className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                title="Link"
              >
                <Link2 size={16} />
              </button>
              <button 
                onClick={() => applyFormatting('list')}
                className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                title="List"
              >
                <List size={16} />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSend} className="flex items-end gap-3">
            <div className="flex-1 bg-secondary border border-border rounded-2xl p-2 focus-within:border-primary transition-colors">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none text-sm px-2 py-1"
                style={{ minHeight: '24px', maxHeight: '120px' }}
              />
              
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setShowFormatting(!showFormatting)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    showFormatting ? "bg-primary/10 text-primary" : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                  )}
                  title="Formatting"
                >
                  <Bold size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowFormatting(false); }}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    showEmojiPicker ? "bg-primary/10 text-primary" : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                  )}
                  title="Emoji"
                >
                  <Smile size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                  title="Attach file"
                >
                  <Paperclip size={16} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col animate-fade-in">
        {/* Fullscreen Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircle size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Team Chat</h2>
              <p className="text-xs text-muted-foreground">Real-time team collaboration</p>
            </div>
          </div>
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
    );
  }

  // Floating chat widget
  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-40 p-4 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 active:scale-95",
          isOpen 
            ? "bg-secondary text-foreground" 
            : "bg-primary text-primary-foreground animate-pulse-glow"
        )}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[400px] h-[600px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          {chatContent}
        </div>
      )}
    </>
  );
}