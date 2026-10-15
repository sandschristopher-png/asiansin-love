'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Send, Zap, ShieldAlert, Check, CheckCheck, Clock, Sparkles, X } from 'lucide-react';
import UpgradeModal from '@/components/UpgradeModal';
import ReputationModal from '@/components/ReputationModal';
import { supabase } from '@/lib/supabase/client';

interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
  warning?: string;
  read?: boolean;
}

function sanitizeMessage(text: string): { sanitized: string; wasMasked: boolean } {
  const normalized = text
    .toLowerCase()
    .replace(/[@]/g, 'a')
    .replace(/[$]/g, 's')
    .replace(/[0]/g, 'o')
    .replace(/[1]/g, 'i')
    .replace(/[\s.\-_]/g, '');

  const offPlatformKeywords = ['whatsapp', 'telegram', 'viber', 'lineid', 'wechat', 'snapchat', 'instagram'];
  const hasOffPlatformWord = offPlatformKeywords.some((kw) => normalized.includes(kw));
  const digitClusterTest = /(?:\+?\d[\s.\-_()]*){7,}/;
  const digitClusterRegex = /(?:\+?\d[\s.\-_()]*){7,}/g;
  const hasPhoneDigits = digitClusterTest.test(text);

  if (hasOffPlatformWord || hasPhoneDigits) {
    let masked = text.replace(digitClusterRegex, '[contact info hidden for safety]');
    offPlatformKeywords.forEach((kw) => {
      const reg = new RegExp('(' + kw.split('').join('[\\s.\\-_]*') + ')', 'gi');
      masked = masked.replace(reg, '[contact info hidden for safety]');
    });
    return { sanitized: masked, wasMasked: true };
  }

  return { sanitized: text, wasMasked: false };
}

export default function ChatConversationPage() {
  const routeParams = useParams();
  const router = useRouter();
  const rawParam = (Array.isArray(routeParams?.id) ? routeParams.id[0] : (routeParams?.id as string)) || '';

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [resolvedTargetUuid, setResolvedTargetUuid] = useState<string | null>(null);
  const [targetInfo, setTargetInfo] = useState({
    name: 'Member',
    avatar: '/placeholder-avatar.svg',
    rep: 100,
    city: '',
    country: '',
  });

  const [icebreakerPrompt, setIcebreakerPrompt] = useState<string | null>(null);
  const [showIcebreaker, setShowIcebreaker] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sentCount, setSentCount] = useState(0);
  const [isPlus, setIsPlus] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showRepModal, setShowRepModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [actionDoneMsg, setActionDoneMsg] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
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
    if (!resolvedTargetUuid || !currentUserId) return;

    const markMessagesAsRead = async () => {
      try {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('receiver_id', currentUserId)
          .eq('sender_id', resolvedTargetUuid)
          .eq('is_read', false);
      } catch {}
    };

    markMessagesAsRead();
  }, [resolvedTargetUuid, currentUserId, messages.length]);

  useEffect(() => {
    async function initUserAndTarget() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      if (!rawParam || rawParam.startsWith('00000000')) {
        router.replace('/messages');
        return;
      }

      setCurrentUserId(user.id);
      const { data: myProf } = await supabase
        .from('profiles')
        .select('is_plus, plus_enabled, membership_tier, interests')
        .eq('id', user.id)
        .maybeSingle();

      if (myProf && (myProf.is_plus || myProf.plus_enabled || myProf.membership_tier === 'plus')) {
        setIsPlus(true);
      }
      const myInterests: string[] = Array.isArray(myProf?.interests) ? myProf.interests : [];

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawParam);
      let targetUuid: string | null = null;
      let profData: any = null;

      if (isUuid) {
        targetUuid = rawParam;
        const { data } = await supabase
          .from('profiles')
          .select('id, username, display_name, full_name, avatar_url, reputation_score, city, country, interests')
          .eq('id', rawParam)
          .maybeSingle();
        profData = data;
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, display_name, full_name, avatar_url, reputation_score, city, country, interests')
          .ilike('username', rawParam)
          .maybeSingle();
        if (data) {
          targetUuid = data.id;
          profData = data;
        } else {
          const { data: dataByName } = await supabase
            .from('profiles')
            .select('id, username, display_name, full_name, avatar_url, reputation_score, city, country, interests')
            .ilike('display_name', rawParam)
            .maybeSingle();
          if (dataByName) {
            targetUuid = dataByName.id;
            profData = dataByName;
          }
        }
      }

      if (!targetUuid) {
        router.replace('/messages');
        return;
      }

      setResolvedTargetUuid(targetUuid);

      if (profData) {
        const cleanHandle = (profData.username || profData.display_name || profData.full_name || 'Member').replace(/^@/, '');
        setTargetInfo({
          name: cleanHandle,
          avatar: profData.avatar_url || '/placeholder-avatar.svg',
          rep: typeof profData.reputation_score === 'number' ? profData.reputation_score : 100,
          city: profData.city || '',
          country: profData.country || '',
        });

        const retiredTags = new Set(['nature walks', 'gaming', 'entrepreneurship']);
        const theirInterests: string[] = (Array.isArray(profData.interests) ? profData.interests : [])
          .filter((t: string) => !retiredTags.has(String(t || '').trim().toLowerCase()));
        const shared = theirInterests.filter((t) =>
          myInterests.some((m) => m.toLowerCase() === t.toLowerCase())
        );

        if (shared.length > 0) {
          setIcebreakerPrompt(
            'Hi @' + cleanHandle + '! I noticed we both enjoy ' + shared[0] + '—what is your favorite part about it?'
          );
        } else if (theirInterests.length > 0) {
          setIcebreakerPrompt(
            'Hi @' + cleanHandle + '! I saw on your profile that you enjoy ' + theirInterests[0] + '—how is your week going' + (profData.city ? ' in ' + profData.city : '') + '?'
          );
        } else {
          setIcebreakerPrompt(
            'Hi @' + cleanHandle + '! I really appreciated your profile and would love to get to know you. How is your day going?'
          );
        }
      }

      const { data: existingBlock } = await supabase
        .from('user_blocks')
        .select('id')
        .or('and(blocker_id.eq.' + user.id + ',blocked_id.eq.' + targetUuid + '),and(blocker_id.eq.' + targetUuid + ',blocked_id.eq.' + user.id + ')')
        .maybeSingle();

      if (existingBlock) {
        router.replace('/messages');
        return;
      }

      const { data: remoteMsgs } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content, created_at, is_quarantined, is_read')
        .or('and(sender_id.eq.' + user.id + ',receiver_id.eq.' + targetUuid + '),and(sender_id.eq.' + targetUuid + ',receiver_id.eq.' + user.id + ')')
        .order('created_at', { ascending: true });

      if (remoteMsgs) {
        setMessages(
          remoteMsgs
            .filter((m: any) => m.sender_id === user.id || !m.is_quarantined)
            .map((m: any) => ({
              id: m.id,
              sender: m.sender_id === user.id ? 'me' : 'them',
              text: m.content,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: Boolean(m.is_read),
            }))
        );
      }
    }

    initUserAndTarget();
  }, [rawParam, router]);

  useEffect(() => {
    if (!resolvedTargetUuid || !currentUserId) return;

    let isMounted = true;
    const channelName = 'chat_' + [resolvedTargetUuid, currentUserId].sort().join('_');

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? { ...m, read: Boolean(updated.is_read) } : m))
            );
            return;
          }

          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as any;
            const recId = newRow.receiver_id || newRow.recipient_id;
            const isFromTarget = newRow.sender_id === resolvedTargetUuid && recId === currentUserId;

            if (isFromTarget && !newRow.is_quarantined) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newRow.id)) return prev;
                return [
                  ...prev,
                  {
                    id: newRow.id,
                    sender: 'them',
                    text: newRow.content,
                    time: new Date(newRow.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: true,
                  },
                ];
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [resolvedTargetUuid, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean || cooldownSeconds > 0 || !resolvedTargetUuid) return;

    setErrorBanner(null);
    const { sanitized, wasMasked } = sanitizeMessage(clean);
    if (wasMasked) setShowSafetyNotice(true);

    const tempId = 'temp-' + Date.now();
    const myNewMsg: ChatMessage = {
      id: tempId,
      sender: 'me',
      text: sanitized,
      time: 'Just now',
      read: false,
    };

    setMessages((prev) => [...prev, myNewMsg]);
    setInputText('');
    setShowIcebreaker(false);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: resolvedTargetUuid,
          content: sanitized,
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setErrorBanner(resData.error || 'Message could not be delivered.');
        if (resData.code === 'OUTREACH_LIMIT_REACHED') {
          setShowUpgradeModal(true);
        }
        return;
      }

      const nextCount = sentCount + 1;
      setSentCount(nextCount);
      if (nextCount >= 5 && !isPlus) {
        setCooldownSeconds(300);
      }

      if (resData?.message?.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, id: resData.message.id, warning: resData.warning }
              : m
          )
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setErrorBanner('Network error while sending message.');
    }
  };

  const handleBlockUser = async () => {
    const target = resolvedTargetUuid || rawParam;
    try {
      const res = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedId: target }),
      });
      if (res.ok) {
        setActionDoneMsg('User has been blocked. Redirecting to messages...');
        setTimeout(() => {
          setShowReportModal(false);
          setActionDoneMsg(null);
          router.push('/messages');
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportUser = async (reason: string = 'harassment') => {
    const target = resolvedTargetUuid || rawParam;
    try {
      const res = await fetch('/api/users/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedId: target, reason }),
      });
      if (res.ok) {
        setActionDoneMsg('Report submitted. Thank you for keeping Asians in Love safe.');
        setTimeout(() => {
          setShowReportModal(false);
          setActionDoneMsg(null);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return mins + ':' + (remaining < 10 ? '0' : '') + remaining;
  };

  return (
    <main className="w-full min-h-[calc(100dvh-64px)] flex flex-col bg-[#F8F7FA] text-[#1C1924] font-sans relative">
      {/* Pristine Dating App Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#DDD7E5] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/messages" className="p-1.5 -ml-1 text-[#524B5E] hover:text-[#6555B8] transition rounded-full hover:bg-[#F3EFFC] shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href={'/profile/' + (resolvedTargetUuid || rawParam)} className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#DDD7E5] shrink-0 bg-[#F3EFFC]">
              <Image src={targetInfo.avatar} alt={targetInfo.name} fill sizes="40px" className="object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className="text-sm font-bold text-[#1C1924] leading-tight truncate"
                style={{ fontFamily: 'var(--font-brand)' }}
              >
                @{targetInfo.name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                <span className="text-[11px] text-[#6C637B] font-medium truncate">
                  {targetInfo.city ? targetInfo.city : 'Active now'}
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowRepModal(true)}
            className={
              'px-2.5 py-1 rounded-full text-[10px] font-semibold transition active:scale-95 cursor-pointer border ' +
              (targetInfo.rep < 60
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-[#F3EFFC] border-[#DDD7E5] text-[#6555B8] hover:bg-[#EAE0F5]')
            }
          >
            {targetInfo.rep}% Rep
          </button>
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="p-1.5 text-[#8C849B] hover:text-rose-600 hover:bg-rose-50 rounded-full transition"
            title="Safety & Moderation"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 pb-44 space-y-3">
        {showIcebreaker && icebreakerPrompt && messages.length < 3 && (
          <div className="p-3.5 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6555B8]">
                <Sparkles className="w-3.5 h-3.5 text-[#6555B8]" />
                <span>Talk Advice • Conversation Starter</span>
              </span>
              <button
                type="button"
                onClick={() => setShowIcebreaker(false)}
                className="text-[#8C849B] hover:text-[#1C1924] p-0.5"
                aria-label="Dismiss icebreaker"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-[#524B5E] leading-relaxed bg-[#F8F7FA] p-2.5 rounded-2xl border border-[#F0EDF5]">
              &ldquo;{icebreakerPrompt}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => setInputText(icebreakerPrompt)}
              className="text-[11px] font-bold text-[#6555B8] hover:underline cursor-pointer"
            >
              Tap to use this icebreaker &rarr;
            </button>
          </div>
        )}

        {targetInfo.rep < 60 && (
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 shadow-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-amber-950">Safety Caution:</span> This member has a low reputation score ({targetInfo.rep}%). Never send money or share financial details.
            </div>
          </div>
        )}

        {errorBanner && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorBanner}
          </div>
        )}

        {showSafetyNotice && (
          <div className="p-3.5 rounded-2xl bg-[#F3EFFC] border border-[#DDD7E5] text-xs text-[#6555B8] flex items-start gap-2.5 shadow-xs">
            <ShieldAlert className="w-4 h-4 text-[#6555B8] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-semibold">Safety Gate:</strong> External contact handles and phone digits unlock after 3 substantive replies from both members.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={'flex flex-col ' + (msg.sender === 'me' ? 'items-end' : 'items-start')}
          >
            <div
              className={
                'max-w-[82%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs select-text ' +
                (msg.sender === 'me'
                  ? 'bg-[#6555B8] text-white font-normal rounded-br-xs'
                  : 'bg-white text-[#1C1924] border border-[#DDD7E5] rounded-bl-xs')
              }
            >
              {msg.text}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-[#8C849B]">
              <span>{msg.time}</span>
              {msg.sender === 'me' && (
                msg.read ? (
                  <CheckCheck className="w-3 h-3 text-[#6555B8]" />
                ) : (
                  <Check className="w-3 h-3 text-[#8C849B]" />
                )
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar pinned cleanly above BottomNav */}
      <div className="fixed bottom-[84px] inset-x-0 z-30 max-w-[430px] mx-auto bg-white/95 backdrop-blur-md border-t border-[#DDD7E5] p-3">
        {cooldownSeconds > 0 ? (
          <div className="p-3.5 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5] flex flex-col items-center gap-2 shadow-xs text-center">
            <div className="flex items-center gap-1.5 text-xs text-[#524B5E]">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Next free message unlocks in</span>
            </div>
            <span className="text-xl font-bold tracking-wider text-[#1C1924]">
              {formatTimer(cooldownSeconds)}
            </span>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#6555B8] hover:bg-[#52449e] text-white font-semibold text-xs shadow-md transition"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Skip the Wait with Plus
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Write a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-[#F8F7FA] border border-[#DDD7E5] focus:border-[#6555B8] focus:bg-white text-[#1C1924] placeholder-[#8C849B] rounded-full px-4 py-2.5 text-xs outline-none transition-all focus:ring-2 focus:ring-[#6555B8]/15"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-full bg-[#6555B8] hover:bg-[#52449e] active:scale-90 disabled:opacity-40 text-white transition-all shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        triggerContext="chat"
      />
      <ReputationModal
        isOpen={showRepModal}
        onClose={() => setShowRepModal(false)}
        name={targetInfo.name}
        score={targetInfo.rep}
      />
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#DDD7E5]">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
              <h3
                className="font-bold text-[#1C1924]"
                style={{ fontFamily: 'var(--font-brand)' }}
              >
                Safety &amp; Moderation
              </h3>
            </div>
            <p className="mt-2 text-xs text-[#6C637B] leading-relaxed">
              Take action regarding this member. Reports are reviewed by moderators within 24 hours.
            </p>
            {actionDoneMsg ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-center text-xs font-medium text-emerald-800">
                {actionDoneMsg}
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={handleBlockUser}
                  className="w-full rounded-2xl border border-[#DDD7E5] py-2.5 text-xs font-semibold text-[#1C1924] hover:bg-[#F3EFFC] transition"
                >
                  Block Member
                </button>
                <button
                  type="button"
                  onClick={() => handleReportUser('harassment')}
                  className="w-full rounded-2xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-semibold text-white shadow-sm transition"
                >
                  Report Violation / Scammer
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setShowReportModal(false);
                setActionDoneMsg(null);
              }}
              className="mt-3 w-full py-1.5 text-xs text-[#8C849B] hover:text-[#1C1924] transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}