'use client';

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Send,
  Zap,
  ShieldAlert,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  X,
  ArrowDown,
} from 'lucide-react';
import UpgradeModal from '@/components/UpgradeModal';
import ReputationModal from '@/components/ReputationModal';
import { supabase } from '@/lib/supabase/client';

interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  createdAt: string;
  time: string;
  warning?: string;
  read?: boolean;
  pending?: boolean;
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

function formatTimeShort(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatDateDivider(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const todayStr = now.toDateString();
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);

    if (d.toDateString() === todayStr) return 'Today';
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function ChatConversationPage() {
  const routeParams = useParams();
  const router = useRouter();
  const rawParam = (Array.isArray(routeParams?.id) ? routeParams.id[0] : (routeParams?.id as string)) || '';

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [resolvedTargetUuid, setResolvedTargetUuid] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [targetInfo, setTargetInfo] = useState({
    name: '',
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
  const [showScrollPill, setShowScrollPill] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
      setShowScrollPill(false);
    });
  }, []);

  const handleContainerScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distanceFromBottom < 120;
    isNearBottomRef.current = near;
    if (near && showScrollPill) {
      setShowScrollPill(false);
    }
  };

  useLayoutEffect(() => {
    if (isInitialLoading || messages.length === 0) return;

    if (!hasScrolledInitialRef.current) {
      hasScrolledInitialRef.current = true;
      scrollToBottom('instant');
      return;
    }

    if (forceScrollNextRef.current || isNearBottomRef.current) {
      forceScrollNextRef.current = false;
      scrollToBottom('smooth');
    } else {
      setShowScrollPill(true);
    }
  }, [messages, isInitialLoading, scrollToBottom]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (!resolvedTargetUuid || !currentUserId || messages.length === 0) return;
    const hasUnreadFromTarget = messages.some((m) => m.sender === 'them' && !m.read);
    if (!hasUnreadFromTarget) return;

    supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', currentUserId)
      .eq('sender_id', resolvedTargetUuid)
      .eq('is_read', false)
      .then(() => {});
  }, [resolvedTargetUuid, currentUserId, messages]);

  useEffect(() => {
    let isMounted = true;

    async function initUserAndTarget() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      if (!rawParam || rawParam.startsWith('00000000')) {
        router.replace('/messages');
        return;
      }

      if (isMounted) setCurrentUserId(user.id);

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawParam);

      const [myProfRes, targetProfRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('is_plus, plus_enabled, membership_tier, interests')
          .eq('id', user.id)
          .maybeSingle(),
        isUuid
          ? supabase
              .from('profiles')
              .select('id, username, display_name, full_name, avatar_url, reputation_score, city, country, interests')
              .eq('id', rawParam)
              .maybeSingle()
          : supabase
              .from('profiles')
              .select('id, username, display_name, full_name, avatar_url, reputation_score, city, country, interests')
              .or('username.ilike.' + rawParam + ',display_name.ilike.' + rawParam)
              .limit(1)
              .maybeSingle(),
      ]);

      const myProf = myProfRes.data;
      if (myProf && (myProf.is_plus || myProf.plus_enabled || myProf.membership_tier === 'plus')) {
        if (isMounted) setIsPlus(true);
      }
      const myInterests: string[] = Array.isArray(myProf?.interests) ? myProf.interests : [];

      const profData: any = targetProfRes.data;
      const targetUuid: string | null = profData?.id || (isUuid ? rawParam : null);

      if (!targetUuid) {
        router.replace('/messages');
        return;
      }

      const [blockRes, remoteMsgsRes] = await Promise.all([
        supabase
          .from('user_blocks')
          .select('id')
          .or(
            'and(blocker_id.eq.' + user.id + ',blocked_id.eq.' + targetUuid + '),and(blocker_id.eq.' + targetUuid + ',blocked_id.eq.' + user.id + ')'
          )
          .maybeSingle(),
        supabase
          .from('messages')
          .select('id, sender_id, receiver_id, content, created_at, is_quarantined, is_read')
          .or(
            'and(sender_id.eq.' + user.id + ',receiver_id.eq.' + targetUuid + '),and(sender_id.eq.' + targetUuid + ',receiver_id.eq.' + user.id + ')'
          )
          .order('created_at', { ascending: true }),
      ]);

      if (blockRes.data) {
        router.replace('/messages');
        return;
      }

      if (!isMounted) return;

      setResolvedTargetUuid(targetUuid);

      if (profData) {
        const cleanHandle = (
          profData.username ||
          profData.display_name ||
          profData.full_name ||
          'Member'
        ).replace(/^@/, '');

        setTargetInfo({
          name: cleanHandle,
          avatar: profData.avatar_url || '/placeholder-avatar.svg',
          rep: typeof profData.reputation_score === 'number' ? profData.reputation_score : 100,
          city: profData.city || '',
          country: profData.country || '',
        });

        const retiredTags = new Set(['nature walks', 'gaming', 'entrepreneurship']);
        const theirInterests: string[] = (Array.isArray(profData.interests) ? profData.interests : []).filter(
          (t: string) => !retiredTags.has(String(t || '').trim().toLowerCase())
        );
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

      if (remoteMsgsRes.data) {
        setMessages(
          remoteMsgsRes.data
            .filter((m: any) => m.sender_id === user.id || !m.is_quarantined)
            .map((m: any) => ({
              id: m.id,
              sender: m.sender_id === user.id ? 'me' : 'them',
              text: m.content,
              createdAt: m.created_at,
              time: formatTimeShort(m.created_at),
              read: Boolean(m.is_read),
            }))
        );
      }

      setIsInitialLoading(false);
    }

    initUserAndTarget();
    return () => {
      isMounted = false;
    };
  }, [rawParam, router]);

  useEffect(() => {
    if (!resolvedTargetUuid || !currentUserId) return;

    let isMounted = true;
    const channelName = 'chat_' + [resolvedTargetUuid, currentUserId].sort().join('_');

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
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
                  createdAt: newRow.created_at,
                  time: formatTimeShort(newRow.created_at),
                  read: true,
                },
              ];
            });
          }
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [resolvedTargetUuid, currentUserId]);

  const submitMessage = async () => {
    const clean = inputText.trim();
    if (!clean || cooldownSeconds > 0 || !resolvedTargetUuid) return;

    setErrorBanner(null);
    const { sanitized, wasMasked } = sanitizeMessage(clean);
    if (wasMasked) setShowSafetyNotice(true);

    const nowIso = new Date().toISOString();
    const tempId = 'temp-' + Date.now();
    const myNewMsg: ChatMessage = {
      id: tempId,
      sender: 'me',
      text: sanitized,
      createdAt: nowIso,
      time: formatTimeShort(nowIso),
      read: false,
      pending: true,
    };

    forceScrollNextRef.current = true;
    setMessages((prev) => [...prev, myNewMsg]);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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
              ? {
                  ...m,
                  id: resData.message.id,
                  createdAt: resData.message.created_at || m.createdAt,
                  time: formatTimeShort(resData.message.created_at || m.createdAt),
                  warning: resData.warning,
                  pending: false,
                }
              : m
          )
        );
      } else {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: false } : m)));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setErrorBanner('Network error while sending message.');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 108) + 'px';
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
    <main className="w-full h-[calc(100dvh-148px)] max-h-[calc(100dvh-148px)] flex flex-col bg-[#F9F8FC] text-[#1C1924] font-sans relative overflow-hidden">
      {/* Sticky Header */}
      <header className="flex items-center justify-between px-3.5 py-2.5 bg-white/95 backdrop-blur-md border-b border-[#ECE8F4] shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/messages"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#524B5E] hover:text-[#6555B8] hover:bg-[#F3EFFC] transition shrink-0"
            aria-label="Back to messages"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {isInitialLoading ? (
            <div className="flex items-center gap-2.5 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-[#EAE6F3]" />
              <div className="space-y-1.5">
                <div className="w-24 h-3.5 bg-[#EAE6F3] rounded-full" />
                <div className="w-16 h-2.5 bg-[#F2EFF8] rounded-full" />
              </div>
            </div>
          ) : (
            <Link
              href={'/profile/' + (resolvedTargetUuid || rawParam)}
              className="flex items-center gap-2.5 min-w-0 group"
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#E5DFEE] shrink-0 bg-[#F3EFFC]">
                <Image
                  src={targetInfo.avatar}
                  alt={targetInfo.name || 'Member'}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className="text-[13.5px] font-bold text-[#1C1924] group-hover:text-[#6555B8] transition leading-tight truncate"
                  style={{ fontFamily: 'var(--font-brand)' }}
                > {targetInfo.name || 'Member'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                  <span className="text-[11px] text-[#7A7289] font-medium truncate">
                    {targetInfo.city ? targetInfo.city : 'Active recently'}
                  </span>
                </div>
              </div>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isInitialLoading && (
            <button
              type="button"
              onClick={() => setShowRepModal(true)}
              className={
                'px-2.5 py-1 rounded-full text-[10px] font-semibold transition active:scale-95 cursor-pointer border ' +
                (targetInfo.rep < 60
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-[#F5F2FC] border-[#E4DDF2] text-[#6555B8] hover:bg-[#EAE3F8]')
              }
            >
              {targetInfo.rep}% Rep
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="w-8 h-8 flex items-center justify-center text-[#8C849B] hover:text-rose-600 hover:bg-rose-50 rounded-full transition cursor-pointer"
            title="Safety & Moderation"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Isolated Auto-Scrolling Message Stream */}
      <div
        ref={scrollContainerRef}
        onScroll={handleContainerScroll}
        className="flex-1 overflow-y-auto px-3.5 py-4 overscroll-contain"
      >
        {isInitialLoading ? (
          <div className="space-y-4 py-4 animate-pulse">
            <div className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-[#EAE6F3] shrink-0" />
              <div className="w-48 h-10 bg-white rounded-2xl rounded-bl-xs border border-[#ECE8F4]" />
            </div>
            <div className="flex justify-end">
              <div className="w-52 h-11 bg-[#6555B8]/20 rounded-2xl rounded-br-xs" />
            </div>
            <div className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-[#EAE6F3] shrink-0" />
              <div className="w-40 h-9 bg-white rounded-2xl rounded-bl-xs border border-[#ECE8F4]" />
            </div>
          </div>
        ) : (
          <>
            {showIcebreaker && icebreakerPrompt && messages.length < 3 && (
              <div className="mb-3 p-3.5 rounded-2xl bg-white border border-[#E5DFEE] shadow-[0_2px_10px_rgba(101,85,184,0.05)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6555B8]">
                    <Sparkles className="w-3.5 h-3.5 text-[#6555B8]" />
                    <span>Conversation Starter</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowIcebreaker(false)}
                    className="text-[#8C849B] hover:text-[#1C1924] p-0.5 cursor-pointer"
                    aria-label="Dismiss icebreaker"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#4A4356] leading-relaxed bg-[#FAF9FC] p-2.5 rounded-xl border border-[#F0EDF6]">
                  &ldquo;{icebreakerPrompt}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInputText(icebreakerPrompt);
                    textareaRef.current?.focus();
                  }}
                  className="text-[11px] font-semibold text-[#6555B8] hover:underline cursor-pointer"
                >
                  Tap to use this starter &rarr;
                </button>
              </div>
            )}

            {targetInfo.rep < 60 && (
              <div className="mb-3 p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold text-amber-950">Safety Caution:</span> This member has a low reputation score ({targetInfo.rep}%). Never send money or share financial details.
                </div>
              </div>
            )}

            {errorBanner && (
              <div className="mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium text-center">
                {errorBanner}
              </div>
            )}

            {showSafetyNotice && (
              <div className="mb-3 p-3 rounded-2xl bg-[#F5F2FC] border border-[#E2DBF0] text-xs text-[#6555B8] flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#6555B8] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="font-semibold">Safety Gate:</strong> External contact handles and phone digits unlock after 3 substantive replies from both members.
                </p>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-12 h-12 rounded-full overflow-hidden mx-auto border border-[#E5DFEE] bg-[#F3EFFC] relative">
                  <Image
                    src={targetInfo.avatar}
                    alt={targetInfo.name || 'Member'}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <p className="text-xs font-semibold text-[#1C1924]">
                  Start a conversation with  {targetInfo.name}
                </p>
                <p className="text-[11px] text-[#7A7289] max-w-[220px] mx-auto leading-relaxed">
                  Send a friendly note to break the ice.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender === 'me';
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;

                const currentDayLabel = formatDateDivider(msg.createdAt);
                const prevDayLabel = prevMsg ? formatDateDivider(prevMsg.createdAt) : null;
                const showDateHeader = currentDayLabel && currentDayLabel !== prevDayLabel;

                const isSameSenderAsPrev =
                  prevMsg &&
                  prevMsg.sender === msg.sender &&
                  !showDateHeader &&
                  Math.abs(new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) < 120000;

                const isSameSenderAsNext =
                  nextMsg &&
                  nextMsg.sender === msg.sender &&
                  formatDateDivider(nextMsg.createdAt) === currentDayLabel &&
                  Math.abs(new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 120000;

                return (
                  <React.Fragment key={msg.id}>
                    {showDateHeader && (
                      <div className="flex justify-center my-1.5 select-none">
                        <span className="px-3 py-0.5 rounded-full bg-[#EFEBF7] text-[#6E657F] text-[10px] font-semibold tracking-wide">
                          {currentDayLabel}
                        </span>
                      </div>
                    )}

                    <div
                      className={
                        'flex flex-col ' +
                        (isMe ? 'items-end ' : 'items-start ') +
                        (isSameSenderAsPrev || showDateHeader ? 'mt-0.5' : 'mt-2.5')
                      }
                    >
                      <div className={'flex items-end gap-2 max-w-[84%] ' + (isMe ? 'flex-row-reverse' : 'flex-row')}>
                        {!isMe && (
                          <div className="w-6 h-6 shrink-0">
                            {!isSameSenderAsNext ? (
                              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#E5DFEE] bg-[#F3EFFC]">
                                <Image
                                  src={targetInfo.avatar}
                                  alt={targetInfo.name}
                                  fill
                                  sizes="24px"
                                  className="object-cover"
                                />
                              </div>
                            ) : null}
                          </div>
                        )}

                        <div
                          className={
                            'px-3.5 py-2 text-[13.5px] leading-[1.45] break-words select-text transition-opacity ' +
                            (msg.pending ? 'opacity-75 ' : 'opacity-100 ') +
                            (isMe
                              ? 'bg-[#6555B8] text-white rounded-2xl ' +
                                (isSameSenderAsNext ? 'rounded-br-md' : 'rounded-br-xs') +
                                ' shadow-[0_1px_6px_rgba(101,85,184,0.18)]'
                              : 'bg-white text-[#1C1924] border border-[#E6E1F0] rounded-2xl ' +
                                (isSameSenderAsNext ? 'rounded-bl-md' : 'rounded-bl-xs') +
                                ' shadow-[0_1px_3px_rgba(28,25,36,0.03)]')
                          }
                        >
                          {msg.text}
                        </div>
                      </div>

                      {!isSameSenderAsNext && (
                        <div
                          className={
                            'flex items-center gap-1 mt-1 text-[10px] text-[#8C849B] select-none ' +
                            (isMe ? 'pr-0.5' : 'pl-8')
                          }
                        >
                          <span>{msg.pending ? 'Sending...' : msg.time}</span>
                          {isMe && !msg.pending && (
                            msg.read ? (
                              <CheckCheck className="w-3 h-3 text-[#6555B8]" />
                            ) : (
                              <Check className="w-3 h-3 text-[#9B93A8]" />
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Floating Scroll-to-Bottom Pill when scrolled up */}
      {showScrollPill && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#6555B8] text-white text-xs font-semibold shadow-lg hover:bg-[#52449e] transition cursor-pointer"
        >
          <span>New message</span>
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Docked Flex Composer (Never overlaps message feed) */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-[#ECE8F4] px-3 py-2.5 z-20">
        {cooldownSeconds > 0 ? (
          <div className="p-3 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5] flex flex-col items-center gap-2 shadow-xs text-center">
            <div className="flex items-center gap-1.5 text-xs text-[#524B5E]">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Next free message unlocks in</span>
            </div>
            <span className="text-lg font-bold tracking-wider text-[#1C1924]">
              {formatTimer(cooldownSeconds)}
            </span>
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-full bg-[#6555B8] hover:bg-[#52449e] text-white font-semibold text-xs shadow-sm transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Skip the Wait with Plus
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1 bg-[#F6F4FA] border border-[#E2DCEB] focus-within:border-[#6555B8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6555B8]/15 rounded-3xl px-3.5 py-2 transition-all flex items-center">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Write a message..."
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-[#1C1924] placeholder-[#8C849B] text-[13.5px] leading-snug outline-none resize-none max-h-28 overflow-y-auto"
              />
            </div>
            <button
              type="submit"
              disabled={!inputText.trim()}
              aria-label="Send message"
              className="w-9 h-9 rounded-full bg-[#6555B8] hover:bg-[#52449e] active:scale-90 disabled:opacity-35 text-white flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4 translate-x-[0.5px]" />
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
                  className="w-full rounded-2xl border border-[#DDD7E5] py-2.5 text-xs font-semibold text-[#1C1924] hover:bg-[#F3EFFC] transition cursor-pointer"
                >
                  Block Member
                </button>
                <button
                  type="button"
                  onClick={() => handleReportUser('harassment')}
                  className="w-full rounded-2xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
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
              className="mt-3 w-full py-1.5 text-xs text-[#8C849B] hover:text-[#1C1924] transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}