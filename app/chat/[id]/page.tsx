'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Send, Zap, ShieldAlert, CheckCheck, Clock } from 'lucide-react';
import UpgradeModal from '@/components/UpgradeModal';
import ReputationModal from '@/components/ReputationModal';
import { supabase } from '@/lib/supabaseClient';
import { Navbar } from '@/components/Navbar';


interface Persona {
  name: string;
  avatar: string;
  location: string;
  rep: number;
  initialReply: string;
  followups: string[];
}

const PLACEHOLDER_USERS: Record<string, Persona> = {
  'jennalyn': {
    name: 'Jennalyn',
    avatar: '/jennalyn.png',
    location: 'Cebu City, Philippines',
    rep: 99,
    initialReply: 'Hello po! Thank you for the message. Im just drinking coffee before my shift starts. How is your day there?',
    followups: [
      'Yes, hospitality work is tiring sometimes but i enjoy meeting polite guests. Are you having busy day today?',
      'Aww thank you! My mother always told me to be honest and work hard. What kind of work do you do?',
      'Cebu has nice beaches if you go south to Moalboal. Have you visited Philippines before?'
    ]
  },
  'jhoanna': {
    name: 'Jhoanna',
    avatar: '/jhoanna.png',
    location: 'Quezon City, Philippines',
    rep: 98,
    initialReply: 'Good day! Thanks for dropping by my profile. Glad to meet you. Where are you from po?',
    followups: [
      'Haha yes, traffic here in Manila is crazy every day! How is life over there?',
      'I appreciate sincere people. Hard to find gentlemen online now. What made you message me?',
      'Sounds nice! When I have day off, I usually just bake or watch movies with my sister.'
    ]
  },
  'anong': {
    name: 'Anong',
    avatar: '/anong.png',
    location: 'Chiang Mai, Thailand',
    rep: 99,
    initialReply: 'Sawasdee kha! Thank you for say hi to me. Today Chiang Mai is nice weather. Have you ever come to Thailand before?',
    followups: [
      'Chiang Mai is very calm not like Bangkok. Many mountains and fresh air. Do you like city or quiet place?',
      'Thank you na ka. I try practice english every day so we can understand each other.',
      'That is so kind of you! Sincerity is what I want most in life.'
    ]
  },
  'ploy': {
    name: 'Ploy',
    avatar: '/ploy%20chaiyaphon.png',
    location: 'Bangkok, Thailand',
    rep: 97,
    initialReply: 'Hey there! Thanks for reaching out. Always nice to chat with someone genuine. What kind of food do you like?',
    followups: [
      'Street food here is top tier, especially spicy papaya salad! Can you handle spicy food haha?',
      'Freelance design keeps me busy but gives me freedom. What about you, what keeps you busy?',
      'I like that you are straightforward. No time for mind games on here.'
    ]
  },
  'suwannarat': {
    name: 'Suwannarat',
    avatar: '/suwannarat.png',
    location: 'Khon Kaen, Thailand',
    rep: 100,
    initialReply: 'Sawasdee kha. Nice to meet you na ka. I hope you having good day. What are you looking for on here?',
    followups: [
      'Teaching small children takes patience, but I love them very much. Do you like kids?',
      'Isan countryside is very simple. We grow our own herbs and cook together as family.',
      'Thank you for your respect. Good values and loyalty are the most important things for a future husband.'
    ]
  },
  'mai': {
    name: 'Mai',
    avatar: '/nguyen%20thi%20mai.png',
    location: 'Da Nang, Vietnam',
    rep: 98,
    initialReply: 'Xin chao! Very happy to receive your message. Da Nang is windy tonight. How was your work today?',
    followups: [
      'My students were very energetic today haha. What time is it over where you are?',
      'Walking by My Khe beach in the morning gives me peaceful energy. Do you like the ocean?',
      'I am glad you are looking for serious relationship too. Life is better when shared with good person.'
    ]
  },
  'linh-pham': {
    name: 'Linh Pham',
    avatar: '/pham.png',
    location: 'Ho Chi Minh City, Vietnam',
    rep: 96,
    initialReply: 'Chao anh! Thank you for text me. Im just finishing my dinner here. What do you usually do on weekend?',
    followups: [
      'Saigon is fast and lively, lots of motorbikes! But at night I prefer quiet iced coffee.',
      'I like a man who is honest and has clear goals. Talk is easy, action is what matters.',
      'That sounds really interesting! Tell me more about your life.'
    ]
  },
  'thu-trang': {
    name: 'Thu Trang',
    avatar: '/trang.png',
    location: 'Hanoi, Vietnam',
    rep: 99,
    initialReply: 'Xin chao anh. Thank you for your nice message. It is rare to meet polite person online. What season you like most?',
    followups: [
      'Autumn in Hanoi is the most beautiful when the leaves turn and the air is cool. Have you visited Vietnam?',
      'Working at the pharmacy teaches me to care for people carefully. Health and family come first.',
      'Thank you anh. It is pleasant to have a gentle conversation with someone mature.'
    ]
  },
  'khamla': {
    name: 'Khamla',
    avatar: '/khamla%20sithirath.png',
    location: 'Vientiane, Laos',
    rep: 98,
    initialReply: 'Sabaidee! Very nice to see your message. Greetings from Laos. Do you know where Laos country is?',
    followups: [
      'Haha yes, many people donÃ¢â‚¬â„¢t know Laos, it is small and quiet next to Thailand and Vietnam.',
      'We weave silk patterns by hand here. It takes weeks for one scarf. Patience is everything.',
      'Thank you for being so polite to me. Please bear with my english, I try my best!'
    ]
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
  const targetId = params.id;
  const botPersona = PLACEHOLDER_USERS[targetId];

  const [currentUserId, setCurrentUserId] = useState<string>('guest-user');
  const [targetInfo, setTargetInfo] = useState({
    name: botPersona?.name || 'Member',
    avatar: botPersona?.avatar || '/jennalyn.png',
    rep: botPersona?.rep || 98,
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (botPersona) {
      return [
        {
          id: 'welcome-bot-msg',
          sender: 'them',
          text: botPersona.initialReply,
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
  const [showRepModal, setShowRepModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [actionDoneMsg, setActionDoneMsg] = useState<string | null>(null);
  const [resolvedTargetUuid, setResolvedTargetUuid] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  useEffect(() => {
    async function initUserAndTarget() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      let targetUuid = isUuid ? targetId : null;

      let query = supabase.from('profiles').select('id, username, display_name, full_name, avatar_url, reputation_score');
      if (isUuid) {
        query = query.eq('id', targetId);
      } else {
        query = query.ilike('username', targetId);
      }

      const { data: prof } = await query.maybeSingle();

      if (prof) {
        targetUuid = prof.id;
        setResolvedTargetUuid(prof.id);
        setTargetInfo({
          name: (prof.username || prof.display_name || prof.full_name || 'member').replace(/^@/, ''),
          avatar: prof.avatar_url || '/jennalyn.png',
          rep: prof.reputation_score || 98,
        });
      } else if (isUuid) {
        setResolvedTargetUuid(targetId);
      }

      if (user && targetUuid) {
        const { data: existingBlock } = await supabase
          .from('user_blocks')
          .select('id')
          .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${targetUuid}),and(blocker_id.eq.${targetUuid},blocked_id.eq.${user.id})`)
          .maybeSingle();

        if (existingBlock) {
          window.location.href = '/messages';
          return;
        }

        const { data: remoteMsgs } = await supabase
          .from('messages')
          .select('id, sender_id, receiver_id, content, created_at')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUuid}),and(sender_id.eq.${targetUuid},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (remoteMsgs && remoteMsgs.length > 0) {
          setMessages(
            remoteMsgs.map((m) => ({
              id: m.id,
              sender: m.sender_id === user.id ? 'me' : 'them',
              text: m.content,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }))
          );
        }
      }
    }

    initUserAndTarget();
  }, [supabase, targetId]);

  useEffect(() => {
    if (!resolvedTargetUuid || currentUserId === 'guest-user') return;

    const channel = supabase
      .channel(`chat_page_${resolvedTargetUuid}_${currentUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newRow = payload.new;
          const recId = newRow.recipient_id || newRow.receiver_id;
          const isFromTarget = newRow.sender_id === resolvedTargetUuid && recId === currentUserId;

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
  }, [supabase, resolvedTargetUuid, currentUserId]);

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

    if (resolvedTargetUuid && currentUserId !== 'guest-user') {
      try {
        await supabase.from('messages').insert({
          sender_id: currentUserId,
          receiver_id: resolvedTargetUuid,
          content: sanitized,
        });
      } catch (err) {
        console.error('Failed to save message to Supabase:', err);
      }
    } else if (botPersona) {
      setTimeout(() => {
        const pool = botPersona.followups;
        const randomAnswer = pool[Math.floor(Math.random() * pool.length)];

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-reply-${Date.now()}`,
            sender: 'them',
            text: randomAnswer,
            time: 'Just now',
          },
        ]);
      }, 1600);
    }
  };

  const handleBlockUser = async () => {
    const target = resolvedTargetUuid || targetId;
    try {
      await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedId: target }),
      });
      setActionDoneMsg('User has been blocked. Messages from this user are now muted.');
      setTimeout(() => {
        setShowReportModal(false);
        setActionDoneMsg(null);
        window.location.href = '/messages';
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportUser = async (reason: string = 'Violation / Scammer') => {
    const target = resolvedTargetUuid || targetId;
    try {
      await fetch('/api/users/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedId: target, reason }),
      });
      setActionDoneMsg('Report submitted. Thank you for keeping Asians in Love safe.');
      setTimeout(() => {
        setShowReportModal(false);
        setActionDoneMsg(null);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <main className="min-h-screen bg-[#130F18] text-[#E6D7FA] flex flex-col justify-between">
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#181222]/95 backdrop-blur-md border-b border-[#9A79BA]/30">
      <Navbar />

        <div className="flex items-center gap-3">
          <Link href="/discover" className="text-[#9A79BA] hover:text-[#E6D7FA] transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#9A79BA]/50">
            <Image src={targetInfo.avatar} alt={targetInfo.name} fill className="object-cover object-[50%_20%]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white leading-tight">{targetInfo.name}</span>
            <span className="text-[10px] text-emerald-400 font-medium">Active now</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRepModal(true)}
          className="px-2.5 py-1 rounded-full bg-[#241E2F] hover:bg-[#2F273E] border border-[#9A79BA]/30 hover:border-[#9A79BA]/60 text-[10px] font-semibold text-[#E6D7FA] transition active:scale-95 cursor-pointer"
          title="View Conduct and Behavior Breakdown"
        >
          {targetInfo.rep}% Rep
        </button>
          <button onClick={() => setShowReportModal(true)} className="flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-500 hover:border-rose-300 hover:text-rose-600 dark:border-zinc-700 dark:text-zinc-400" title="Safety Options"><ShieldAlert className="h-3.5 w-3.5" /><span>Report</span></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-md mx-auto w-full">
        {targetInfo.rep < 50 && (
          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200 flex items-start gap-2.5 shadow-md">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-amber-300">Caution:</span> This member has a low reputation score ({targetInfo.rep}%). Take extra care and avoid sharing financial details or off-platform contact information.
            </div>
          </div>
        )}
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

      <div className="sticky bottom-0 z-30 bg-[#181222]/95 backdrop-blur-md border-t border-[#9A79BA]/30 p-3 max-w-md mx-auto w-full">
        {cooldownSeconds > 0 ? (
          <div className="p-4 rounded-2xl bg-[#241E2F] border border-[#9A79BA]/50 flex flex-col items-center gap-2.5 shadow-xl text-center">
            <div className="flex items-center gap-1.5 text-xs text-[#9A79BA]">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Next free message unlocks in</span>
            </div>
            <span className="text-2xl font-medium tracking-wider text-white">
              {formatTimer(cooldownSeconds)}
            </span>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#653C87] hover:bg-[#7D49A8] text-white font-medium text-xs shadow-lg shadow-[#653C87]/40 active:scale-95 transition"
            >
              <Zap className="w-4 h-4 fill-current" />
              Skip the Wait Ã¢â‚¬â€ Unlock Instant Chat
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
      <ReputationModal
        isOpen={showRepModal}
        onClose={() => setShowRepModal(false)}
        name={targetInfo.name}
        score={targetInfo.rep}
      />
    {showReportModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
        <ShieldAlert className="h-5 w-5" />
        <h3 className="font-semibold text-zinc-900 dark:text-white">Safety & Moderation</h3>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Take action regarding this member. Reports are reviewed by human moderators within 24 hours.</p>
      {actionDoneMsg ? (
        <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{actionDoneMsg}</div>
      ) : (
        <div className="mt-5 space-y-2">
          <button onClick={() => { setActionDoneMsg("User has been blocked. Messages from this user are now muted."); setTimeout(() => { setShowReportModal(false); setActionDoneMsg(null); }, 1800); }} className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">Block Member</button>
          <button onClick={() => { setActionDoneMsg("Report submitted. Thank you for keeping Asians in Love safe."); setTimeout(() => { setShowReportModal(false); setActionDoneMsg(null); }, 1800); }} className="w-full rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700">Report Violation / Scammer</button>
        </div>
      )}
      <button onClick={() => { setShowReportModal(false); setActionDoneMsg(null); }} className="mt-3 w-full py-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">Cancel</button>
    </div>
  </div>
)}
    </main>
  );
}



