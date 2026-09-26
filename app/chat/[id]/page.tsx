'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Send, Zap, ShieldAlert, CheckCheck, Clock } from 'lucide-react';
import UpgradeModal from '@/components/UpgradeModal';
import { createClient } from '@/lib/supabase/client';

const PLACEHOLDER_USERS: Record<string, { name: string; avatar: string; location: string; rep: number; initialReply: string }> = {
  'dummy-1': {
    name: 'Siriporn',
    avatar: '/dummy-1.jpg',
    location: 'Bangkok, Thailand',
    rep: 98,
    initialReply: 'Sawasdee ka! So glad you reached out. What parts of Asia have you traveled to recently?'
  },
  'dummy-2': {
    name: 'Camille',
    avatar: '/dummy-2.jpg',
    location: 'Makati, Philippines',
    rep: 100,
    initialReply: 'Hi! Nice to connect with you. I love meeting sincere people who appreciate authentic culture.'
  },
  'dummy-3': {
    name: 'Maricel',
    avatar: '/dummy-3.jpg',
    location: 'Calbayog, Samar',
    rep: 97,
    initialReply: 'Hello po! Hope you are having a wonderful day. Always happy to chat with someone grounded.'
  },
  'dummy-4': {
    name: 'Sreyneang',
    avatar: '/dummy-4.jpg',
    location: 'Kampot, Cambodia',
    rep: 99,
    initialReply: 'Sousdey! Great to see your profile. Kampot is quiet and lovely — what is your favorite city?'
  },
  'dummy-5': {
    name: 'Danica',
    avatar: '/dummy-5.jpg',
    location: 'Tandag, Philippines',
    rep: 96,
    initialReply: 'Hey! Thanks for saying hi. Are you planning any trips to Southeast Asia soon?'
  },
  'dummy-6': {
    name: 'Bianca',
    avatar: '/dummy-6.jpg',
    location: 'Taguig, Philippines',
    rep: 98,
    initialReply: 'Hello! Really appreciate you stopping by my profile. How is your week going?'
  },
  'dummy-7': {
    name: 'Jasmine',
    avatar: '/dummy-7.jpg',
    location: 'Taguig, Philippines',
    rep: 95,
    initialReply: 'Hi there! Wishing you a peaceful day. What kind of relationship are you hoping to build?'
  }
};

interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
}

function sanitizeMessage(text: string): { sanitized: string; wasMasked: boolean } {
  const normalized = text
    .toLowerCase()
    .replace(/[@]/g, 'a')
    .replace(/[$]/g, 's')
    .replace(/[0]/g, 'o')
    .replace(/[1]/g, 'i')
    .replace(/[\s\.\-_]/g, '');

  const offPlatformKeywords = ['whatsapp', 'telegram', 'viber', 'lineid', 'wechat', 'snapchat', 'instagram'];
  const hasOffPlatformWord = offPlatformKeywords.some(kw => normalized.includes(kw));
  const digitClusterRegex = /(?:\+?\d[\s\.\-_\(\)]*){7,}/g;
  const hasPhoneDigits = digitClusterRegex.test(text);

  if (hasOffPlatformWord || hasPhoneDigits) {
    let masked = text.replace(digitClusterRegex, '[contact info hidden for safety]');
    offPlatformKeywords.forEach(kw => {
      const reg = new RegExp(`(${kw.split('').join('[\\s\\.\\-_]*')})`, 'gi');
      masked = masked.replace(reg, '[contact info hidden for safety]');
    });
    return { sanitized: masked, wasMasked: true };
  }

  return { sanitized: text, wasMasked: false };
}

export default function ChatConversationPage({ params }: { params: { id: string } }) {
  const [supabase] = useState(() => createClient());
  const targetId = params.id;
  const isPlaceholderBot = Boolean(PLACEHOLDER_USERS[targetId]);

  const [currentUserId, setCurrentUserId] = useState<string>('guest-user');
  const [targetInfo, setTargetInfo] = useState({
    name: PLACEHOLDER_USERS[targetId]?.name || 'Member',
    avatar: PLACEHOLDER_USERS[targetId]?.avatar || '/dummy-1.jpg',
    rep: PLACEHOLDER_USERS[targetId]?.rep || 98,
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (isPlaceholderBot) {
      return [
        {
          id: 'welcome-bot-msg',
          sender: 'them',
          text: PLACEHOLDER_USERS[targetId].initialReply,
          time: 'Just now'
        }
      ];
    }
    return [];
  });

  const [inputText, setInputText] = useState('');
  const [sentCount, setSentCount] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Load User & Target Profile
  useEffect(() => {
    async function initUserAndTarget() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      if (isUuid) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('display_name, full_name, avatar_url, reputation_score')
          .eq('id', targetId)
          .maybeSingle();

        if (prof) {
          setTargetInfo({
            name: prof.display_name || prof.full_name || 'Member',
            avatar: prof.avatar_url || '/dummy-1.jpg',
            rep: prof.reputation_score || 98,
          });
        }

        // Fetch existing Supabase conversation
        if (user) {
          const { data: remoteMsgs } = await supabase
            .from('messages')
            .select('id, sender_id, recipient_id, content, created_at')
            .or(`and(sender_id.eq.${user.id},recipient_id.eq.${targetId}),and(sender_id.eq.${targetId},recipient_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

          if (remoteMsgs && remoteMsgs.length > 0) {
            setMessages(remoteMsgs.map((m: any) => ({
              id: m.id,
              sender: m.sender_id === user.id ? 'me' : 'them',
              text: m.content,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            })));
          }
        }
      }
    }

    initUserAndTarget();
  }, [supabase, targetId]);

  // Supabase Realtime Listener
  useEffect(() => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
    if (!isUuid || currentUserId === 'guest-user') return;

    const channel = supabase
      .channel(`chat_page_${targetId}_${currentUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newRow = payload.new as any;
          const recId = newRow.recipient_id || newRow.receiver_id;
          const isFromTarget = newRow.sender_id === targetId && recId === currentUserId;

          if (isFromTarget) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newRow.id)) return prev;
              return [
                ...prev,
                {
                  id: newRow.id,
                  sender: 'them',
                  text: newRow.content,
                  time: new Date(newRow.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, targetId, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean || cooldownSeconds > 0) return;

    const { sanitized, wasMasked } = sanitizeMessage(clean);
    if (wasMasked) setShowSafetyNotice(true);

    const tempId = `temp-${Date.now()}`;
    const myNewMsg: ChatMessage = {
      id: tempId,
      sender: 'me',
      text: sanitized,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, myNewMsg]);
    setInputText('');

    const nextCount = sentCount + 1;
    setSentCount(nextCount);
    if (nextCount >= 5) {
      setCooldownSeconds(300);
    }

    // Persist to Supabase if target is a real UUID and user is logged in
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
    if (isUuid && currentUserId !== 'guest-user') {
      try {
        await supabase.from('messages').insert({
          sender_id: currentUserId,
          recipient_id: targetId,
          content: sanitized,
        });
      } catch (err) {
        console.error('Failed to save message to Supabase:', err);
      }
    } else if (isPlaceholderBot) {
      // Simulate realistic responsive bot reply for cold-start engagement
      setTimeout(() => {
        const botAnswers = [
          'That sounds really wonderful! It is nice to meet someone genuine on here.',
          'Thank you for sharing that with me! How long have you lived where you are?',
          'I completely agree. Sincerity and good intentions matter most to me.',
          'Such a thoughtful message! I appreciate you taking the time to write to me.'
        ];
        const randomAnswer = botAnswers[Math.floor(Math.random() * botAnswers.length)];

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-reply-${Date.now()}`,
            sender: 'them',
            text: randomAnswer,
            time: 'Just now',
          },
        ]);
      }, 1800);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <main className="min-h-screen bg-[#130F18] text-[#E6D7FA] flex flex-col justify-between">
      {/* Dynamic Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#181222]/95 backdrop-blur-md border-b border-[#9A79BA]/30">
        <div className="flex items-center gap-3">
          <Link href="/discover" className="text-[#9A79BA] hover:text-[#E6D7FA] transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#9A79BA]/50">
            <Image src={targetInfo.avatar} alt={targetInfo.name} fill className="object-cover object-[50%_20%]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-tight">{targetInfo.name}</span>
            <span className="text-[10px] text-emerald-400 font-medium">Active now</span>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-[#241E2F] border border-[#9A79BA]/30 text-[10px] font-semibold text-[#E6D7FA]">
          {targetInfo.rep}% Rep
        </span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-md mx-auto w-full">
        {showSafetyNotice && (
          <div className="p-3 rounded-2xl bg-[#261F33] border border-amber-400/50 text-[11px] text-amber-200 flex items-start gap-2 shadow-md">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Courtship Safety: External contact handles and phone digits are masked during initial intros to prevent unverified off-platform spam.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'me'
                  ? 'bg-[#653C87] text-white font-medium rounded-br-xs shadow-md shadow-[#653C87]/30'
                  : 'bg-[#261F33] text-[#E6D7FA] border border-[#9A79BA]/35 rounded-bl-xs shadow-md'
              }`}
            >
              {msg.text}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-[#C9A4E8]">
              <span>{msg.time}</span>
              {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-[#9A79BA]" />}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Action Zone */}
      <div className="sticky bottom-0 z-30 bg-[#181222]/95 backdrop-blur-md border-t border-[#9A79BA]/30 p-3 max-w-md mx-auto w-full">
        {cooldownSeconds > 0 ? (
          <div className="p-4 rounded-2xl bg-[#241E2F] border border-[#9A79BA]/50 flex flex-col items-center gap-2.5 shadow-xl text-center">
            <div className="flex items-center gap-1.5 text-xs text-[#9A79BA]">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Next free message unlocks in</span>
            </div>
            <span className="text-2xl font-extrabold tracking-wider text-white">
              {formatTimer(cooldownSeconds)}
            </span>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#653C87] hover:bg-[#7D49A8] text-white font-bold text-xs shadow-lg shadow-[#653C87]/40 active:scale-95 transition"
            >
              <Zap className="w-4 h-4 fill-current" />
              Skip the Wait — Unlock Instant Chat
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Write a sincere message..."
              className="flex-1 bg-[#241E2F] border border-[#241E2F] focus:border-[#653C87] rounded-full px-4 py-2.5 text-xs text-[#E6D7FA] placeholder-[#7D7E92] outline-none transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-full bg-[#653C87] hover:bg-[#7D49A8] text-white disabled:opacity-40 transition shrink-0 shadow-md shadow-[#653C87]/40 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={(p) => alert('Plan selected: ' + p)}
      />
    </main>
  );
}
