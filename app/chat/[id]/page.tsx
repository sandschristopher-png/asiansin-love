'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Send, Zap, ShieldAlert, CheckCheck, Clock } from 'lucide-react';
import UpgradeModal from '@/components/UpgradeModal';
import ReputationModal from '@/components/ReputationModal';
import { supabase } from '@/lib/supabaseClient';


interface Persona {
  name: string;
  avatar: string;
  location: string;
  rep: number;
  initialReply: string;
  followups: string[];
}

const PLACEHOLDER_USERS: Record<string, Persona> = {
    'test-flagged': {
    name: 'Suspicious Account',
    avatar: '/jennalyn.png',
    location: 'Unverified Location',
    rep: 42,
    initialReply: 'Hey there! Can we move to WhatsApp or Telegram instead? Text me at +1 555-0199.',
    followups: ['Why are you asking so many questions? Just message my other number.']
  },
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

export default function ChatConversationPage() {
  const routeParams = useParams();
  const targetId = (Array.isArray(routeParams?.id) ? routeParams.id[0] : (routeParams?.id as string)) || '';
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
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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

    let isMounted = true;
    const channelName = `chat_${resolvedTargetUuid}_${currentUserId}_${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (!isMounted) return;
          const newRow = payload.new as any;
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
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Subscription error on ${channelName}`);
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [resolvedTargetUuid, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([15]); } catch (_) {}
    }
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
    <main className="flex flex-col h-[100dvh] bg-[#FBF9FD] relative overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-[#E2DCED] shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/discover" className="p-1 -ml-1 text-[#6B5E87] hover:text-[#4C3B75] transition rounded-full hover:bg-[#F3EEFA]">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#D8C7EE]">
              <Image src={targetInfo.avatar} alt={targetInfo.name} fill className="object-cover object-[50%_20%]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#2D2640] leading-tight">{targetInfo.name}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span className="text-[10px] text-emerald-700 font-medium">Active now</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRepModal(true)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition active:scale-95 cursor-pointer border ${
                targetInfo.rep < 50
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-[#F3EEFA] border-[#D8C7EE] text-[#4C3B75] hover:bg-[#EAE0F5]'
              }`}
              title="View Conduct and Behavior Breakdown"
            >
              {targetInfo.rep}% Rep
            </button>
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="p-1 text-[#8B7E9F] hover:text-rose-600 hover:bg-rose-50 rounded-full transition"
              title="Safety & Moderation"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {targetInfo.rep < 50 && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 shadow-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-amber-950">Caution:</span> This member has a low reputation score ({targetInfo.rep}%). Take extra care and avoid sharing personal financial details or off-platform contacts.
              </div>
            </div>
          )}

          {showSafetyNotice && (
            <div className="p-3.5 rounded-2xl bg-[#F3EEFA] border border-[#D8C7EE] text-xs text-[#4C3B75] flex items-start gap-2.5 shadow-sm">
              <ShieldAlert className="w-4 h-4 text-[#653C87] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-semibold">Courtship Safety:</strong> External contact handles and phone digits are masked during initial intros to prevent off-platform spam.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] select-text ${
                  msg.sender === 'me'
                    ? 'bg-[#4C3B75] text-white font-normal rounded-br-xs'
                    : 'bg-white text-[#2D2640] border border-[#E2DCED] rounded-bl-xs'
                }`}
              >
                {msg.text}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-[#8B7E9F]">
                <span>{msg.time}</span>
                {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-[#653C87]" />}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar / Cooldown */}
        <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E2DCED] p-3 pb-[76px] w-full shrink-0 shadow-xs">
          {cooldownSeconds > 0 ? (
            <div className="p-3.5 rounded-2xl bg-[#F8F5FC] border border-[#E2DCED] flex flex-col items-center gap-2 shadow-sm text-center">
              <div className="flex items-center gap-1.5 text-xs text-[#6B5E87]">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Next free message unlocks in</span>
              </div>
              <span className="text-xl font-semibold tracking-wider text-[#2D2640]">
                {formatTimer(cooldownSeconds)}
              </span>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#4C3B75] hover:bg-[#3D2F5F] text-white font-medium text-xs shadow-md shadow-[#4C3B75]/20 active:scale-95 transition"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                Skip the Wait with Plus
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Write a sincere message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-[#F5F2F9] border border-[#E2DCED] focus:border-[#4C3B75] focus:bg-white text-[#2D2640] placeholder-[#8B7E9F] rounded-full px-4 py-2.5 text-xs outline-none transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus:ring-2 focus:ring-[#4C3B75]/15"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-full bg-gradient-to-r from-[#4C3B75] to-[#5C4B8A] hover:brightness-105 active:scale-90 disabled:opacity-40 disabled:hover:brightness-100 disabled:active:scale-100 text-white transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm select-none cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#E2DCED]">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="font-semibold text-[#2D2640]">Safety & Moderation</h3>
              </div>
              <p className="mt-2 text-xs text-[#6B5E87] leading-relaxed">
                Take action regarding this member. Reports are reviewed by human moderators within 24 hours.
              </p>
              {actionDoneMsg ? (
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center text-xs font-medium text-emerald-800">
                  {actionDoneMsg}
                </div>
              ) : (
                <div className="mt-5 space-y-2">
                  <button
                    onClick={() => {
                      setActionDoneMsg("User has been blocked. Messages from this user are now muted.");
                      setTimeout(() => { setShowReportModal(false); setActionDoneMsg(null); }, 1800);
                    }}
                    className="w-full rounded-xl border border-[#E2DCED] py-2.5 text-xs font-medium text-[#2D2640] hover:bg-[#F3EEFA] transition"
                  >
                    Block Member
                  </button>
                  <button
                    onClick={() => {
                      setActionDoneMsg("Report submitted. Thank you for keeping Asians in Love safe.");
                      setTimeout(() => { setShowReportModal(false); setActionDoneMsg(null); }, 1800);
                    }}
                    className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-semibold text-white shadow-sm transition"
                  >
                    Report Violation / Scammer
                  </button>
                </div>
              )}
              <button
                onClick={() => { setShowReportModal(false); setActionDoneMsg(null); }}
                className="mt-3 w-full py-1.5 text-xs text-[#8B7E9F] hover:text-[#2D2640] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
  );
}
