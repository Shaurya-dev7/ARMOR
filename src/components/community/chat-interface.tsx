'use client';

import { useState } from 'react';
import { useRealtimeChat } from '@/lib/hooks/use-realtime-chat';
import { useAuth } from '@/lib/hooks/useAuth';
import { Send, Users, Shield, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function ChatInterface() {
  const { messages, sendMessage, messagesEndRef } = useRealtimeChat('general');
  const { user, loading } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Generate a consistent color for usernames
  const getUserColor = (username: string) => {
    const colors = [
      'text-red-400', 'text-orange-400', 'text-amber-400', 
      'text-yellow-400', 'text-lime-400', 'text-green-400', 
      'text-emerald-400', 'text-teal-400', 'text-cyan-400', 
      'text-sky-400', 'text-blue-400', 'text-indigo-400', 
      'text-violet-400', 'text-purple-400', 'text-fuchsia-400', 
      'text-pink-400', 'text-rose-400'
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
     hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex flex-col h-[700px] w-full max-w-4xl mx-auto rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/20 ring-1 ring-primary/40">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg tracking-tight">Global Operations</h2>
            <p className="text-xs text-muted-foreground">Secure Channel • {messages.length} messages</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
            <Shield className="w-12 h-12 mb-2" />
            <p>No communications yet. Start the channel.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = user?.id === msg.user_id;
            const showHeader = index === 0 || messages[index - 1].user_id !== msg.user_id;
            
            return (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col gap-1 max-w-[80%]",
                  isMe ? "self-end items-end" : "self-start items-start"
                )}
              >
                {showHeader && (
                  <span className={cn(
                    "text-xs font-bold px-1",
                    isMe ? "text-primary" : getUserColor(msg.username)
                  )}>
                    {msg.username}
                  </span>
                )}
                
                <div 
                  className={cn(
                    "px-4 py-2 rounded-2xl text-sm relative group transition-all duration-200",
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-sm shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
                      : "bg-white/10 text-white rounded-tl-sm hover:bg-white/15 border border-white/5"
                  )}
                >
                  {msg.content}
                  <div className="text-[10px] opacity-50 mt-1 min-w-[40px] text-right">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/5 border-t border-white/10">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
           <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={user ? "Transmit message..." : "Authentication required to transmit"}
            disabled={!user || sending}
            className="flex-1 bg-black/40 border border-white/10 hover:border-white/20 focus:border-primary/50 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!user || !newMessage.trim() || sending}
            className="p-3 bg-primary text-primary-foreground rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        {!user && (
           <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center rounded-xl z-10">
              <a href="/login" className="text-sm font-bold text-white bg-white/10 border border-white/20 px-4 py-2 rounded-full hover:bg-white/20 transition cursor-pointer">
                Log in to join the channel
              </a>
           </div>
        )}
      </div>
    </div>
  );
}
