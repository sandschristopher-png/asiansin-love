'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle, ArrowLeft, Send } from 'lucide-react';

export interface TargetUserProfile {
  id: string;
  fullName: string;
  age: number;
  city: string;
  country: string;
  avatarUrl: string;
  galleryUrls?: string[];
  isVerified: boolean;
  relationshipIntent: string;
  jobTitle?: string;
  languages?: string[];
  bio?: string;
  trustPill?: string;
  trustStatus?: string;
  reputationScore?: number;
  childrenStatus?: string;
}

export interface MessageItem {
  id: string;
  sender_id: string;
  recipient_id?: string;
  receiver_id?: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  read?: boolean;
}

interface ChatInterfaceProps {
  currentUserId: string;
  targetUser: TargetUserProfile;
  initialMessages?: MessageItem[];
}

export function ChatInterface({ currentUserId, targetUser, initialMessages = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    async function markAsRead() {
      if (!currentUserId || currentUserId.startsWith('00000000')) return;

      const unreadIds = messages
        .filter((m) => {
          const recId = m.recipient_id || m.receiver_id;
          const readStatus = m.is_read ?? m.read;
          return m.sender_id === targetUser.id && recId === currentUserId && !readStatus;
        })
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true, read: true })
          .in('id', unreadIds);
      }
    }
    markAsRead();
  }, [messages, currentUserId, targetUser.id]);

  // Supabase Realtime channel subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat_${targetUser.id}_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const rawMsg = payload.new as any;
            const recId = rawMsg.recipient_id || rawMsg.receiver_id;
            const newMsg: MessageItem = {
              id: rawMsg.id,
              sender_id: rawMsg.sender_id,
              recipient_id: recId,
              receiver_id: recId,
              content: rawMsg.content,
              created_at: rawMsg.created_at,
              is_read: rawMsg.is_read ?? rawMsg.read ?? false,
              read: rawMsg.is_read ?? rawMsg.read ?? false,
            };

            const isRelevant =
              (newMsg.sender_id === currentUserId && recId === targetUser.id) ||
              (newMsg.sender_id === targetUser.id && recId === currentUserId);

            if (isRelevant) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRaw = payload.new as any;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === updatedRaw.id
                  ? {
                      ...m,
                      ...updatedRaw,
                      recipient_id: updatedRaw.recipient_id || updatedRaw.receiver_id,
                      receiver_id: updatedRaw.recipient_id || updatedRaw.receiver_id,
                      is_read: updatedRaw.is_read ?? updatedRaw.read,
                      read: updatedRaw.is_read ?? updatedRaw.read,
                    }
                  : m
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, targetUser.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = input.trim();
    if (!cleanContent || isSending) return;

    setIsSending(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: targetUser.id,
          content: cleanContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Message could not be sent.');
      } else {
        setInput('');
        if (data.message) {
          const formatted: MessageItem = {
            id: data.message.id,
            sender_id: data.message.sender_id,
            recipient_id: data.message.recipient_id || data.message.receiver_id,
            receiver_id: data.message.recipient_id || data.message.receiver_id,
            content: data.message.content,
            created_at: data.message.created_at,
            is_read: data.message.is_read ?? data.message.read ?? false,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === formatted.id)) return prev;
            return [...prev, formatted];
          });
        }
      }
    } catch {
      setErrorMessage('Network transmission error.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto bg-[#FAFAFD] border-x border-[#E5E1EC]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-[#E5E1EC] sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#524B5E] hover:text-[#1C1924] hover:bg-[#F3EFFC] transition"
            aria-label="Back to messages"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link href={`/profile/${targetUser.id}`} className="flex items-center gap-2.5 group">
            {targetUser.avatarUrl ? (
              <img
                src={targetUser.avatarUrl}
                alt={targetUser.fullName}
                className="w-9 h-9 rounded-full object-cover border border-[#DDD7E5]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#F3EFFC] text-[#6555B8] flex items-center justify-center text-xs font-medium">
                {targetUser.fullName.charAt(0)}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[#1C1924] text-sm group-hover:text-[#6555B8] transition truncate">
                {targetUser.fullName}{targetUser.age ? `, ${targetUser.age}` : ''}
              </span>
              {targetUser.isVerified && (
                <CheckCircle className="w-3.5 h-3.5 text-[#6555B8] shrink-0" />
              )}
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {targetUser.reputationScore !== undefined && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F3EFFC] text-[#6555B8] border border-[#DDD7E5]">
              {targetUser.reputationScore}% Rep
            </span>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs text-center font-medium shadow-xs">
            {errorMessage}
          </div>
        )}
        {feedbackSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs text-center font-medium shadow-xs">
            {feedbackSuccess}
          </div>
        )}
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-8 text-xs sm:text-sm text-[#756D82]">
            <div>
              <p className="font-semibold text-[#1C1924] mb-1">Begin your intentional conversation</p>
              <p>Say hello with sincere interest and mutual respect.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-[pairsPageIn_240ms_cubic-bezier(0.16,1,0.3,1)_both] will-change-transform`}>
                <div
                  className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-[#6555B8] text-white rounded-br-xs shadow-[0_2px_10px_rgba(101,85,184,0.22)] active:scale-[0.99] transition-transform' : 'bg-white text-[#1C1924] border border-[#E5E1EC] rounded-bl-xs shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.99] transition-transform'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-[#8C849B] mt-0.5 px-1.5 font-medium">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Row */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white/95 backdrop-blur-md border-t border-[#E5E1EC] flex items-center gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a sincere message..."
          className="flex-1 bg-[#F7F6FA] border border-[#DDD7E5] rounded-full px-4 py-2.5 text-xs sm:text-sm text-[#1C1924] placeholder-[#8C849B] focus:outline-none focus:border-[#6555B8] focus:ring-2 focus:ring-[#6555B8]/15 transition-all shadow-xs"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="px-4 py-2.5 bg-[#6555B8] hover:bg-[#52449E] disabled:opacity-40 text-white rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90 shadow-xs flex items-center gap-1.5 shrink-0 select-none cursor-pointer"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;

