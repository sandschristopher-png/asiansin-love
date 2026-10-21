'use client';

import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle, ArrowLeft, Send, AlertTriangle, Check, CheckCheck } from 'lucide-react';

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
  receiver_id: string;
  recipient_id?: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  read?: boolean;
  is_quarantined?: boolean;
  pending?: boolean;
}

interface ChatInterfaceProps {
  currentUserId: string;
  targetUser: TargetUserProfile;
  initialMessages?: MessageItem[];
}

export function ChatInterface({ currentUserId, targetUser, initialMessages = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [input, setInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // 1-tap contextual icebreakers (only shown before first message)
  const firstName = targetUser.fullName ? targetUser.fullName.split(' ')[0] : '';
  const icebreakers: string[] = [];
  if (firstName) icebreakers.push(firstName + ', how has your week been going?');
  if (targetUser.city) icebreakers.push("So what's " + targetUser.city + ' like these days?');
  if (targetUser.jobTitle) icebreakers.push("What's being a " + targetUser.jobTitle + ' actually like day-to-day?');
  if (targetUser.languages && targetUser.languages.length > 0)
    icebreakers.push('You speak ' + targetUser.languages.slice(0, 2).join(' and ') + '? Teach me a phrase!');
  icebreakers.push('What made you give a dating app a try?');
  const displayIcebreakers = icebreakers.slice(0, 5);


  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledInitialRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const forceScrollNextRef = useRef(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      if (behavior === 'instant') {
        el.scrollTop = el.scrollHeight;
      } else {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    });
  }, []);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useLayoutEffect(() => {
    if (messages.length === 0) return;
    if (!hasScrolledInitialRef.current) {
      hasScrolledInitialRef.current = true;
      scrollToBottom('instant');
      return;
    }
    if (forceScrollNextRef.current || isNearBottomRef.current) {
      forceScrollNextRef.current = false;
      scrollToBottom('smooth');
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    async function markAsRead() {
      if (!currentUserId || currentUserId.startsWith('00000000')) return;

      const unreadIds = messages
        .filter((m) => {
          const recId = m.receiver_id || m.recipient_id;
          const readStatus = m.is_read ?? m.read;
          return m.sender_id === targetUser.id && recId === currentUserId && !readStatus;
        })
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        try {
          await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
        } catch {}
      }
    }
    markAsRead();
  }, [messages, currentUserId, targetUser.id]);

  useEffect(() => {
    const channel = supabase
      .channel('chat_' + [targetUser.id, currentUserId].sort().join('_'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
        const eventType = payload.eventType || payload.event;

        if (eventType === 'INSERT') {
          const rawMsg = payload.new as any;
          if (rawMsg.is_quarantined && rawMsg.sender_id !== currentUserId) return;

          const recId = rawMsg.receiver_id || rawMsg.recipient_id;
          const isRelevant =
            (rawMsg.sender_id === currentUserId && recId === targetUser.id) ||
            (rawMsg.sender_id === targetUser.id && recId === currentUserId);

          if (!isRelevant) return;

          const newMsg: MessageItem = {
            id: rawMsg.id,
            sender_id: rawMsg.sender_id,
            receiver_id: recId,
            recipient_id: recId,
            content: rawMsg.content,
            created_at: rawMsg.created_at,
            is_read: rawMsg.is_read ?? rawMsg.read ?? false,
            read: rawMsg.is_read ?? rawMsg.read ?? false,
            is_quarantined: rawMsg.is_quarantined ?? false,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        } else if (eventType === 'UPDATE') {
          const updatedRaw = payload.new as any;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedRaw.id
                ? {
                    ...m,
                    is_read: updatedRaw.is_read ?? updatedRaw.read ?? false,
                    read: updatedRaw.is_read ?? updatedRaw.read ?? false,
                  }
                : m
            )
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, targetUser.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = input.trim();
    if (!cleanContent) return;

    setErrorMessage(null);
    const tempId = 'temp-' + Date.now();
    const optimisticMsg: MessageItem = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: targetUser.id,
      recipient_id: targetUser.id,
      content: cleanContent,
      created_at: new Date().toISOString(),
      is_read: false,
      read: false,
      pending: true,
    };

    forceScrollNextRef.current = true;
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: targetUser.id,
          recipientId: targetUser.id,
          content: cleanContent,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setErrorMessage(data.error || 'Message could not be sent.');
      } else {
        setWarningMessage(data.warning || null);
        if (data.message) {
          const recId = data.message.receiver_id || data.message.recipient_id;
          const confirmed: MessageItem = {
            id: data.message.id,
            sender_id: data.message.sender_id,
            receiver_id: recId,
            recipient_id: recId,
            content: data.message.content,
            created_at: data.message.created_at,
            is_read: data.message.is_read ?? data.message.read ?? false,
            read: data.message.is_read ?? data.message.read ?? false,
            is_quarantined: data.message.is_quarantined ?? false,
            pending: false,
          };
          setMessages((prev) => prev.map((m) => (m.id === tempId ? confirmed : m)));
        }
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setErrorMessage('Network transmission error.');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-148px)] max-w-4xl mx-auto bg-[#F9F8FC] border-x border-[#ECE8F4] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/95 backdrop-blur-md border-b border-[#ECE8F4] shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#524B5E] hover:text-[#1C1924] hover:bg-[#F3EFFC] transition"
            aria-label="Back to messages"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link href={'/profile/' + targetUser.id} className="flex items-center gap-2.5 group">
            {targetUser.avatarUrl ? (
              <img
                src={targetUser.avatarUrl}
                alt={targetUser.fullName}
                className="w-9 h-9 rounded-full object-cover border border-[#E5DFEE]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#F3EFFC] text-[#6555B8] flex items-center justify-center text-xs font-medium">
                {targetUser.fullName.charAt(0)}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#1C1924] text-sm group-hover:text-[#6555B8] transition truncate">
                {targetUser.fullName}
                {targetUser.age ? ', ' + targetUser.age : ''}
              </span>
              {targetUser.isVerified && <CheckCircle className="w-3.5 h-3.5 text-[#6555B8] shrink-0" />}
            </div>
          </Link>
        </div>
        {targetUser.reputationScore !== undefined && (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F2FC] text-[#6555B8] border border-[#E4DDF2]">
            {targetUser.reputationScore}% Rep
          </span>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 overscroll-contain"
      >
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs text-center font-medium">
            {errorMessage}
          </div>
        )}
        {warningMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-medium flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{warningMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setWarningMessage(null)}
              className="text-amber-700 hover:text-amber-950 font-bold px-1.5 text-sm"
            >
              ×
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-8 text-xs sm:text-sm text-[#756D82]">
            <div>
              <p className="font-semibold text-[#1C1924] mb-1">Start a conversation</p>
              <p>Say hello and break the ice.</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === currentUserId;
            const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
            const isSameSenderAsNext =
              nextMsg &&
              nextMsg.sender_id === msg.sender_id &&
              Math.abs(new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime()) < 120000;

            return (
              <div key={msg.id} className={'flex flex-col ' + (isMe ? 'items-end' : 'items-start')}>
                <div
                  className={
                    'max-w-[80%] px-3.5 py-2 rounded-2xl text-[13.5px] leading-relaxed ' +
                    (msg.pending ? 'opacity-75 ' : '') +
                    (isMe
                      ? 'bg-[#6555B8] text-white rounded-br-xs shadow-[0_1px_6px_rgba(101,85,184,0.18)]'
                      : 'bg-white text-[#1C1924] border border-[#E6E1F0] rounded-bl-xs shadow-[0_1px_3px_rgba(0,0,0,0.03)]')
                  }
                >
                  {msg.content}
                </div>
                {!isSameSenderAsNext && (
                  <div className="flex items-center gap-1 text-[10px] text-[#8C849B] mt-0.5 px-1 font-medium">
                    <span>
                      {msg.pending
                        ? 'Sending...'
                        : new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {isMe && !msg.pending && (
                      msg.is_read || msg.read ? (
                        <CheckCheck className="w-3 h-3 text-[#6555B8]" />
                      ) : (
                        <Check className="w-3 h-3 text-[#9B93A8]" />
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {messages.length === 0 && displayIcebreakers.length > 0 && (
        <div className="px-3 pb-1 pt-0.5 flex flex-wrap gap-1.5 shrink-0">
          {displayIcebreakers.map((ice) => (
            <button
              key={ice}
              type="button"
              onClick={() => setInput(ice)}
              className="px-2.5 py-1 rounded-full bg-[#F3EFFC] border border-[#6555B8]/25 text-[11px] font-medium text-[#6555B8] hover:bg-[#E9E4F5] transition-colors active:scale-95 cursor-pointer"
            >
              {ice}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white/95 backdrop-blur-md border-t border-[#ECE8F4] flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 bg-[#F6F4FA] border border-[#E2DCEB] rounded-full px-4 py-2.5 text-[13.5px] text-[#1C1924] placeholder-[#8C849B] focus:outline-none focus:bg-white focus:border-[#6555B8] focus:ring-2 focus:ring-[#6555B8]/15 transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send message"
          className="w-9 h-9 bg-[#6555B8] hover:bg-[#52449E] disabled:opacity-35 text-white rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;