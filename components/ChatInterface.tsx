'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { InteractionReviewModal } from './InteractionReviewModal';

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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMobileBio, setShowMobileBio] = useState(false);
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const allPhotos = [targetUser.avatarUrl, ...(targetUser.galleryUrls || [])].filter(Boolean);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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

  const handleQuickReport = async (category: string, penalty: number, label: string) => {
    setShowSafetyMenu(false);
    if (!confirm(`Are you sure you want to log this report: "${label}"? This will be added to community moderation logs.`)) {
      return;
    }

    try {
      const { error } = await supabase.from('reputation_reports').insert({
        reporter_id: currentUserId,
        target_user_id: targetUser.id,
        violation_category: category,
        penalty_points: penalty,
        notes: `Direct chat report: ${label}`,
      });

      if (error) {
        setErrorMessage('Unable to log incident.');
      } else {
        setFeedbackSuccess(`Incident recorded: ${label}.`);
        setTimeout(() => setFeedbackSuccess(null), 5000);
      }
    } catch {
      setErrorMessage('Network error submitting report.');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto bg-[#181222] border-x border-[#9A79BA]/20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1D1726] border-b border-[#7D7E92]/20">
        <div className="flex items-center gap-3">
          <Link href="/discover" className="text-[#E6D7FA]/70 hover:text-white transition">
            &larr;
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{targetUser.fullName}, {targetUser.age}</span>
            {targetUser.isVerified && <span className="text-[10px] text-emerald-400 font-bold">&#10003; Verified</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {targetUser.reputationScore && (
            <span className="text-[11px] text-[#C9A4E8] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#261F33] border border-[#9A79BA]/30">
              {targetUser.reputationScore}% Rep
            </span>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {errorMessage && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-200 text-xs text-center">
            {errorMessage}
          </div>
        )}
        {feedbackSuccess && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs text-center">
            {feedbackSuccess}
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  isMe
                    ? 'bg-[#653C87] text-white rounded-br-xs shadow-md shadow-[#653C87]/20'
                    : 'bg-[#261F33] text-[#E6D7FA] border border-[#7D7E92]/25 rounded-bl-xs'
                }`}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-[#A8A2AB] mt-0.5 px-1">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Row */}
      <form onSubmit={handleSendMessage} className="p-3 bg-[#1D1726] border-t border-[#7D7E92]/20 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 bg-[#130f18] border border-[#7D7E92]/30 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#7D7E92] focus:outline-none focus:border-[#9A79BA]"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="px-4 py-2 bg-[#653C87] hover:bg-[#7D4B9F] disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
