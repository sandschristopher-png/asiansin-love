'use client';

import dynamic from 'next/dynamic';
import VerifiedBadge from '@/components/VerifiedBadge';

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
  Lightbulb,
  X,
  ArrowDown,
  Sparkles,
  Mic,
  Lock,
  Square,
  Trash2,
  Loader2,
} from 'lucide-react';
import ReputationModal from '@/components/ReputationModal';
import { supabase } from '@/lib/supabase/client';
import { applyContactRevealMask, CONTACT_UNLOCK_TURNS } from '@/lib/safety';
import { AudioPill } from '@/components/AudioPill';
import { useVoiceRecorder } from '@/lib/useVoiceRecorder';
import { VOICE_NOTE_MAX_MS, formatSeconds } from '@/lib/audio';
import { InAppToast } from '@/components/InAppToast';
import { getPresenceStatus } from '@/lib/presence';
import { usePresentUserIds } from '@/lib/realtimePresence';
import { toList } from '@/lib/rhythm';
import { needsTranslation } from '@/lib/language';
import { localTimeIn, timeZoneFor } from '@/lib/timezone';
import { evaluateSubstantiveConversation } from '@/lib/moderation';
import { validateBio } from '@/lib/moderation/textFilter';
import { isRestricted } from '@/lib/reputation';
import { RepBadge, RhythmPill } from '@/components/profile/RhythmBadges';
import { hapticError, hapticSuccess, hapticTap } from '@/lib/utils/haptics';

/** Loaded on first open (keeps the upgrade sheet out of the page bundle). */
const UpgradeModal = dynamic(() => import('@/components/UpgradeModal'), { ssr: false });
/** Loaded on first open (keeps the report sheet out of the page bundle). */
const ReportModal = dynamic(() => import('@/components/ReportModal').then((m) => m.ReportModal), { ssr: false });

const VOICE_LOCKED_MESSAGE = `Voice notes unlock after both members exchange ${CONTACT_UNLOCK_TURNS} substantive messages (15+ characters each).`;
const VOICE_REP_LOCKED_MESSAGE = 'Voice notes are paused while your account is under review. Text messages still work.';

interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  createdAt: string;
  time: string;
  warning?: string;
  read?: boolean;
  pending?: boolean;
  /** Network / server error while sending: kept in the thread with a one-tap retry. */
  failed?: boolean;
  wasMasked?: boolean;
  hasAudio?: boolean;
  audioDurationMs?: number | null;
}

/** Inline notice under an early incoming message that tries to move the chat off the app. */
const EARLY_CONTACT_NOTICE =
  'Safety Notice: Off-platform contact shared early. Keep conversations on asiansin.love until mutual trust is established.';
/** Messages at or past this position in a thread no longer get the early-contact notice. */
const EARLY_THREAD_MESSAGES = 5;
const TYPING_PING_MS = 3000;
const TYPING_CLEAR_MS = 3500;

interface StarterChip {
  label: string;
  text: string;
}

/** 2-3 tap-to-fill conversation starters from overlapping interests, languages and their city. */
function buildStarterChips(opts: {
  myInterests: string[];
  theirInterests: string[];
  myLanguages: string[];
  theirLanguages: string[];
  theirCity: string;
}): StarterChip[] {
  const chips: StarterChip[] = [];
  const lower = (xs: string[]) => new Set(xs.map((x) => x.toLowerCase()));
  const mine = lower(opts.myInterests);
  const shared = opts.theirInterests.filter((t) => mine.has(t.toLowerCase()));

  for (const interest of shared.slice(0, 2)) {
    chips.push({ label: `Both into ${interest}`, text: `I saw we're both into ${interest}! What got you into it?` });
  }
  const myLangs = lower(opts.myLanguages);
  const sharedLang = opts.theirLanguages.find((l) => l.toLowerCase() !== 'english' && myLangs.has(l.toLowerCase()));
  if (sharedLang) {
    chips.push({ label: `You both speak ${sharedLang}`, text: `I noticed we both speak ${sharedLang}! Where did you learn it?` });
  }
  if (opts.theirCity) {
    chips.push({ label: `Ask about ${opts.theirCity}`, text: `What's your favorite thing about life in ${opts.theirCity}?` });
  }
  if (chips.length < 2 && opts.theirInterests[0] && !shared.includes(opts.theirInterests[0])) {
    const t = opts.theirInterests[0];
    chips.push({ label: `Ask about ${t}`, text: `I saw you're into ${t} - how did you get started?` });
  }
  return chips.slice(0, 3);
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
    lastActive: null as string | null,
    showActive: true,
    replyPace: null as string | null,
    verified: false,
  });
  const [myRep, setMyRep] = useState(100);
  const [sharedInterests, setSharedInterests] = useState<string[]>([]);
  // Re-render once a minute so the match's local time stays current.
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setClockTick((n) => n + 1), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const [icebreakerPrompt, setIcebreakerPrompt] = useState<string | null>(null);
  const [showIcebreaker, setShowIcebreaker] = useState(true);
  const [starterChips, setStarterChips] = useState<StarterChip[]>([]);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  // Same rules as /api/messages/voice: contact gate unlocked and sender not under review (< 70 rep).
  const [voiceSending, setVoiceSending] = useState(false);
  const voice = useVoiceRecorder(VOICE_NOTE_MAX_MS);
  const [toast, setToast] = useState<string | null>(null);
  // 1-tap translations of incoming messages, keyed by message id.
  const [translations, setTranslations] = useState<
    Record<string, { text?: string; showing: boolean; loading: boolean }>
  >({});
  const closeToast = useCallback(() => setToast(null), []);
  const presentIds = usePresentUserIds();
  const [, setPresenceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPresenceTick((n) => n + 1), 60_000); // re-evaluate "Active Xm ago"
    return () => clearInterval(t);
  }, []);
  // Mic permission / recorder failures surface as a toast instead of failing silently.
  useEffect(() => {
    if (voice.error) setToast(voice.error);
  }, [voice.error]);
  const voicePreviewUrl = React.useMemo(() => (voice.blob ? URL.createObjectURL(voice.blob) : null), [voice.blob]);
  useEffect(() => () => {
    if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
  }, [voicePreviewUrl]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Incoming bubble whose actions (Report message) are showing, and the message being reported.
  const [activeMsgId, setActiveMsgId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  // Tab visible: read receipts are only sent while the member can actually see the thread.
  const [pageVisible, setPageVisible] = useState(true);
  // Typing indicator (Realtime broadcast, no database writes).
  const [theyAreTyping, setTheyAreTyping] = useState(false);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingPingRef = useRef(0);
  // Unique ids for optimistic bubbles (several sends in the same millisecond stay distinct).
  const tempSeqRef = useRef(0);
  // Live Safety Gate: same rule as /api/messages (each member needs CONTACT_UNLOCK_TURNS distinct messages of
  // 15+ characters and 3+ words, within the latest 40), recomputed as messages are sent and received.
  // The server stays the authority for contact sharing and voice notes.
  const liveGate = React.useMemo(
    () =>
      evaluateSubstantiveConversation(
        messages
          .filter((m) => !m.pending && !m.hasAudio)
          .slice(-40)
          .map((m) => ({ sender_id: m.sender, content: m.text })),
        'me',
        'them',
        15,
        CONTACT_UNLOCK_TURNS
      ),
    [messages]
  );
  const gateUnlocked = contactUnlocked || liveGate.isUnlocked;
  // Same rules as /api/messages/voice: gate unlocked and sender not under review (< 70 rep).
  const voiceAllowed = gateUnlocked && !isRestricted(myRep);
  const voiceLockedMessage = isRestricted(myRep) ? VOICE_REP_LOCKED_MESSAGE : VOICE_LOCKED_MESSAGE;
  // Locked when the chat opened: lets the banner announce the unlock when it happens here.
  const [gateLockedOnOpen, setGateLockedOnOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sentCount, setSentCount] = useState(0);
  const [isPlus, setIsPlus] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showRepModal, setShowRepModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportThanks, setReportThanks] = useState(false);
  const closeReportThanks = useCallback(() => setReportThanks(false), []);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [showScrollPill, setShowScrollPill] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasScrolledInitialRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const forceScrollNextRef = useRef(false);
  // Server-computed contact-reveal state (GET /api/messages); realtime rows are masked with it too.
  const contactUnlockedRef = useRef(false);

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
    const sync = () => setPageVisible(document.visibilityState === 'visible');
    sync();
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  // One batched update marks every unread incoming message read (on open, on new messages and when
  // the tab becomes visible again), never one request per bubble.
  useEffect(() => {
    if (!pageVisible || !resolvedTargetUuid || !currentUserId || messages.length === 0) return;
    const hasUnreadFromTarget = messages.some((m) => m.sender === 'them' && !m.read);
    if (!hasUnreadFromTarget) return;

    setMessages((prev) => prev.map((m) => (m.sender === 'them' && !m.read ? { ...m, read: true } : m)));
    supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', currentUserId)
      .eq('sender_id', resolvedTargetUuid)
      .eq('is_read', false)
      .then(() => {});
  }, [pageVisible, resolvedTargetUuid, currentUserId, messages]);

  // Typing indicator over a Realtime broadcast channel for this pair: pings at most every 3 s,
  // and their "typing..." clears 3.5 s after the last ping (or when their message lands).
  useEffect(() => {
    if (!resolvedTargetUuid || !currentUserId) return;
    const pair = [currentUserId, resolvedTargetUuid].sort().join(':');
    let clearTimer: number | undefined;
    const channel = supabase
      .channel(`typing:${pair}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.from !== resolvedTargetUuid) return;
        setTheyAreTyping(true);
        window.clearTimeout(clearTimer);
        clearTimer = window.setTimeout(() => setTheyAreTyping(false), TYPING_CLEAR_MS);
      })
      .subscribe();
    typingChannelRef.current = channel;
    return () => {
      window.clearTimeout(clearTimer);
      typingChannelRef.current = null;
      setTheyAreTyping(false);
      supabase.removeChannel(channel);
    };
  }, [resolvedTargetUuid, currentUserId]);

  const pingTyping = () => {
    const now = Date.now();
    if (!currentUserId || now - lastTypingPingRef.current < TYPING_PING_MS) return;
    lastTypingPingRef.current = now;
    typingChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { from: currentUserId } });
  };

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
      // Handles only: strip anything that could alter the PostgREST .or() filter (commas, parens, dots).
      const handleParam = decodeURIComponent(rawParam).replace(/^@+/, '').replace(/[^a-zA-Z0-9_]/g, '');
      if (!isUuid && !handleParam) {
        router.replace('/messages');
        return;
      }

      const [myProfRes, targetProfRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('is_plus, plus_enabled, membership_tier, interests, languages, reputation_score')
          .eq('id', user.id)
          .maybeSingle(),
        isUuid
          ? supabase
              .from('profiles')
              .select('id, username, display_name, full_name, avatar_url, reputation_score, city, country, interests, languages, last_active, show_active_status, is_verified, verification_status')
              .eq('id', rawParam)
              .maybeSingle()
          : supabase
              .from('profiles')
              .select('id, username, display_name, full_name, avatar_url, reputation_score, city, country, interests, languages, last_active, show_active_status, is_verified, verification_status')
              .or(`username.ilike.%${handleParam}%,display_name.ilike.%${handleParam}%`)
              .limit(1)
              .maybeSingle(),
      ]);

      const myProf = myProfRes.data;
      if (myProf && (myProf.is_plus || myProf.plus_enabled || ['12m', '6m', '3m', '1m'].includes(myProf.membership_tier))) {
        if (isMounted) setIsPlus(true);
      }
      const myInterests: string[] = Array.isArray(myProf?.interests) ? myProf.interests : [];
      if (isMounted && typeof myProf?.reputation_score === 'number') setMyRep(myProf.reputation_score);

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
        fetch(`/api/messages?target_user_id=${targetUuid}`).then(r => r.ok ? r.json() : Promise.reject(new Error('Chat load failed'))),
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
          name: cleanHandle.replace(/^@+/, ''),
          avatar: profData.avatar_url || '/placeholder-avatar.svg',
          rep: typeof profData.reputation_score === 'number' ? profData.reputation_score : 100,
          city: (profData.city || '').replace(/^@+/, ''),
          country: profData.country || '',
          lastActive: profData.last_active || null,
          showActive: profData.show_active_status !== false,
          replyPace: null,
          verified: profData.is_verified === true || profData.verification_status === 'verified',
        });

        // Rhythm badge column arrives with 20261106_reputation_rhythm.sql; a missing column must not
        // break the main profile query, so it is read separately.
        supabase
          .from('profiles')
          .select('reply_pace')
          .eq('id', targetUuid)
          .maybeSingle()
          .then(({ data: rhythm }) => {
            if (isMounted && rhythm?.reply_pace) {
              setTargetInfo((prev) => ({ ...prev, replyPace: rhythm.reply_pace as string }));
            }
          });

        const retiredTags = new Set(['nature walks', 'gaming', 'entrepreneurship']);
        const theirInterests: string[] = (Array.isArray(profData.interests) ? profData.interests : []).filter(
          (t: string) => !retiredTags.has(String(t || '').trim().toLowerCase())
        );
        const shared = theirInterests.filter((t) =>
          myInterests.some((m) => m.toLowerCase() === t.toLowerCase())
        );

        setSharedInterests(shared);
        setStarterChips(
          buildStarterChips({
            myInterests,
            theirInterests,
            myLanguages: toList(myProf?.languages),
            theirLanguages: toList(profData.languages),
            theirCity: String(profData.city || '').replace(/^@+/, '').trim(),
          })
        );

        if (shared.length > 0) {
          setIcebreakerPrompt(
            'Hi ' + cleanHandle.replace(/^@+/, '') + '! I noticed we both enjoy ' + shared[0] + '—what is your favorite part about it?'
          );
        } else if (theirInterests.length > 0) {
          setIcebreakerPrompt(
            'Hi ' + cleanHandle.replace(/^@+/, '') + '! I saw on your profile that you enjoy ' + theirInterests[0] + '—how is your week going' + (profData.city ? ' in ' + profData.city : '') + '?'
          );
        } else {
          setIcebreakerPrompt(
            'Hi ' + cleanHandle.replace(/^@+/, '') + '! I really appreciated your profile and would love to get to know you. How is your day going?'
          );
        }
      }

      contactUnlockedRef.current = Boolean(remoteMsgsRes.contactUnlocked);
      setContactUnlocked(contactUnlockedRef.current);
      setGateLockedOnOpen(!contactUnlockedRef.current);


      if (remoteMsgsRes.messages) {
        setMessages(
          remoteMsgsRes.messages.map((m: any) => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            createdAt: m.createdAt,
            time: formatTimeShort(m.createdAt),
            wasMasked: m.wasMasked,
            read: Boolean(m.read ?? m.is_read),
            hasAudio: Boolean(m.hasAudio),
            audioDurationMs: m.audioDurationMs ?? null,
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
        const row: any = payload.new;
        if (!row?.id) return;

        // Only rows between me and THIS conversation partner. RLS delivers every message I can
        // see, so without this a message from someone else would render inside this thread.
        const inThisThread =
          (row.sender_id === currentUserId && row.receiver_id === resolvedTargetUuid) ||
          (row.sender_id === resolvedTargetUuid && row.receiver_id === currentUserId);
        if (!inThisThread) return;

        if (payload.eventType === 'UPDATE') {
          const readFlag = row.is_read ?? row.read;
          if (typeof readFlag !== 'undefined') {
            setMessages((prev: ChatMessage[]) =>
              prev.map((m) => (m.id === row.id ? { ...m, read: Boolean(readFlag) } : m))
            );
          }
          return;
        }

        if (payload.eventType !== 'INSERT' || row.is_quarantined || row.is_flagged) return;

        const isMe = row.sender_id === currentUserId;
        if (!isMe) setTheyAreTyping(false);
        const mask = isMe
          ? { text: row.content as string, hasBlockedContent: false }
          : applyContactRevealMask(row.content || '', contactUnlockedRef.current ? CONTACT_UNLOCK_TURNS : 0);

        setMessages((prev) => {
          if (prev.some((m) => m.id === row.id)) return prev;
          const confirmed: ChatMessage = {
            id: row.id,
            sender: isMe ? 'me' : 'them',
            text: mask.text,
            createdAt: row.created_at,
            time: formatTimeShort(row.created_at),
            read: Boolean(row.is_read ?? row.read ?? false),
            wasMasked: mask.hasBlockedContent,
            hasAudio: Boolean(row.audio_path),
            audioDurationMs: row.audio_duration_ms ?? null,
          };
          // Realtime echo of my own send arriving before the HTTP response: swap it into the
          // pending optimistic bubble instead of appending a duplicate.
          if (isMe) {
            const tempIdx = prev.findIndex((m) => m.pending && m.id.startsWith('temp-') && m.text === row.content);
            if (tempIdx !== -1) {
              const next = [...prev];
              next[tempIdx] = { ...prev[tempIdx], ...confirmed, pending: false };
              return next;
            }
          }
          return [...prev, confirmed];
        });

        // The gate may have unlocked since this thread loaded: ask the server once before
        // leaving contact details hidden.
        if (mask.hasBlockedContent && !contactUnlockedRef.current) {
          fetch(`/api/messages?target_user_id=${resolvedTargetUuid}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (!d || !isMounted) return;
              contactUnlockedRef.current = Boolean(d.contactUnlocked);
              setContactUnlocked(contactUnlockedRef.current);
              const fresh = (d.messages || []).find((m: any) => m.id === row.id);
              if (d.contactUnlocked && fresh) {
                setMessages((prev) =>
                  prev.map((m) => (m.id === row.id ? { ...m, text: fresh.text, wasMasked: fresh.wasMasked } : m))
                );
              }
            })
            .catch(() => {});
        }
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[chat] Channel error:', status);
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [resolvedTargetUuid, currentUserId]);

  const submitMessage = async () => {
    const clean = inputText.trim();
    if (!clean || cooldownSeconds > 0 || !resolvedTargetUuid) return;

    setErrorBanner(null);
    setShowSafetyNotice(false);

    const nowIso = new Date().toISOString();
    tempSeqRef.current += 1;
    const tempId = `temp-${tempSeqRef.current}`;
    const myNewMsg: ChatMessage = {
      id: tempId,
      sender: 'me',
      text: clean,
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
    await deliver(tempId, clean);
  };

  /** Retry a bubble that failed to send (same text, same place in the thread). */
  const retryMessage = (msg: ChatMessage) => {
    setErrorBanner(null);
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, failed: false, pending: true } : m)));
    deliver(msg.id, msg.text);
  };

  /**
   * POST a message for an optimistic bubble. Server refusals (safety gate, moderation, daily limit)
   * remove the bubble and hand the draft back; network / server errors keep it as "Not delivered"
   * with a retry. Success swaps in the real id without re-rendering the rest of the thread.
   */
  const deliver = async (tempId: string, clean: string) => {
    const markFailed = (message: string) => {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
      setErrorBanner(message);
    };
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: resolvedTargetUuid,
          content: clean,
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (res.status >= 500) {
        markFailed('Message not delivered. Tap Retry to send it again.');
        return;
      }
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInputText((current) => current || clean); // give the draft back so it can be edited
        if (resData.courtshipLocked) setShowSafetyNotice(true);
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
            // tempId normally; the real id if the realtime echo already swapped the bubble
            m.id === tempId || m.id === resData.message.id
              ? {
                  ...m,
                  id: resData.message.id,
                  createdAt: resData.message.created_at || m.createdAt,
                  time: formatTimeShort(resData.message.created_at || m.createdAt),
                  warning: resData.warning,
                  pending: false,
                }
              : m
          ).filter((m, i, all) => all.findIndex((x) => x.id === m.id) === i)
        );
      } else {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: false } : m)));
      }
    } catch {
      markFailed('No connection. Tap Retry when you are back online.');
    }
  };

  const fetchVoiceUrl = useCallback(async (messageId: string) => {
    const res = await fetch(`/api/messages/voice?id=${messageId}`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return (data?.url as string) || null;
  }, []);

  const toggleTranslation = async (msg: ChatMessage) => {
    const current = translations[msg.id];
    if (current?.loading) return;
    if (current?.text) {
      setTranslations((prev) => ({ ...prev, [msg.id]: { ...current, showing: !current.showing } }));
      return;
    }
    setTranslations((prev) => ({ ...prev, [msg.id]: { showing: false, loading: true } }));
    try {
      const res = await fetch('/api/chat/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: msg.id,
          conversation_id: resolvedTargetUuid,
          text: msg.text,
          target_language: 'English',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.translation) throw new Error('Translation temporarily unavailable');
      setTranslations((prev) => ({ ...prev, [msg.id]: { text: data.translation, showing: true, loading: false } }));
    } catch (err) {
      setTranslations((prev) => ({ ...prev, [msg.id]: { showing: false, loading: false } }));
      setToast('Translation temporarily unavailable');
    }
  };

  const startVoiceNote = () => {
    if (!voiceAllowed) {
      hapticError();
      setToast(voiceLockedMessage);
      return;
    }
    hapticTap();
    setErrorBanner(null);
    voice.start(); // getUserMedia({ audio }) + live waveform; Trash / Stop / Send in the composer
  };

  const sendVoiceNote = async () => {
    if (!voice.blob || !resolvedTargetUuid) return;
    setVoiceSending(true);
    setErrorBanner(null);
    try {
      const form = new FormData();
      form.set('receiverId', resolvedTargetUuid);
      form.set('durationMs', String(Math.round(voice.durationMs)));
      form.set('audio', voice.blob, voice.blob.type === 'audio/mp4' ? 'note.m4a' : 'note.webm');
      const res = await fetch('/api/messages/voice', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.courtshipLocked) setShowSafetyNotice(true);
        setErrorBanner(data.error || 'Voice note could not be sent.');
        return;
      }
      const m = data.message;
      forceScrollNextRef.current = true;
      setMessages((prev) =>
        prev.some((x) => x.id === m.id)
          ? prev
          : [
              ...prev,
              {
                id: m.id,
                sender: 'me',
                text: m.content,
                createdAt: m.created_at,
                time: formatTimeShort(m.created_at),
                read: Boolean(m.is_read),
                hasAudio: true,
                audioDurationMs: m.audio_duration_ms ?? voice.durationMs,
              },
            ]
      );
      voice.reset();
      hapticSuccess();
      setShowIcebreaker(false);
    } catch {
      setErrorBanner('Network error while sending voice note.');
    } finally {
      setVoiceSending(false);
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
    if (e.target.value.trim()) pingTyping();
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
        setToast('Member blocked. Taking you back to Messages...');
        setTimeout(() => router.push('/messages'), 1200);
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
    <div className="w-full h-[100dvh] max-h-[100dvh] flex flex-col bg-white text-[#51376D] font-sans relative overflow-hidden">
      {/* Sticky Header */}
      <header className="flex items-center justify-between px-3.5 py-2.5 bg-white/95 backdrop-blur-md border-b border-[#D5C6EC] shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/messages"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#51376D]/85 hover:text-[#72519A] hover:bg-[#E8DFF5]/70 transition shrink-0"
            aria-label="Back to messages"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {isInitialLoading ? (
            <div className="flex items-center gap-2.5 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-[#E8DFF5]/60" />
              <div className="space-y-1.5">
                <div className="w-24 h-3.5 bg-[#E8DFF5]/60 rounded-full" />
                <div className="w-16 h-2.5 bg-[#E8DFF5]/60 rounded-full" />
              </div>
            </div>
          ) : (
            <Link
              href={'/profile/' + (resolvedTargetUuid || rawParam)}
              className="flex items-center gap-2.5 min-w-0 group"
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#D5C6EC] shrink-0 bg-[#E8DFF5]/60">
                <Image
                  src={targetInfo.avatar}
                  alt={targetInfo.name || 'Member'}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="flex items-center gap-1 min-w-0">
                  <span
                    className="text-[13.5px] font-bold text-[#51376D] group-hover:text-[#72519A] transition leading-tight truncate"
                    style={{ fontFamily: 'var(--font-brand)' }}
                  >
                    {targetInfo.name || 'Member'}
                  </span>
                  {targetInfo.verified && <VerifiedBadge size="sm" />}
                </span>
                {(() => {
                  // Green dot only when connected right now (Realtime Presence) or active in the last
                  // 5 minutes; otherwise "Active 2h ago", falling back to their city.
                  const city = targetInfo.city ? targetInfo.city.replace(/^@+/, '') : '';
                  const presence = targetInfo.showActive ? getPresenceStatus(targetInfo.lastActive) : null;
                  const online =
                    targetInfo.showActive &&
                    (Boolean(resolvedTargetUuid && presentIds.has(resolvedTargetUuid)) || Boolean(presence?.isOnline));
                  const activity = !online && presence && presence.statusLabel !== 'Offline' ? presence.statusLabel : '';
                  void clockTick; // minute re-render for the local time
                  const localTime = localTimeIn(timeZoneFor(city, targetInfo.country));
                  const cityLabel = city ? (localTime ? `${city.split(',')[0]} ${localTime}` : city) : '';
                  const label = theyAreTyping ? 'typing...' : online ? 'Online' : activity;
                  if (!label && !cityLabel && !targetInfo.replyPace) return null;
                  return (
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      {online && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />}
                      {label && <span className="text-[11px] text-[#51376D]/55 font-medium truncate shrink-0">{label}</span>}
                      {cityLabel && (
                        <span className="px-1.5 py-px rounded-full bg-[#E8DFF5]/60 text-[10px] font-semibold text-[#72519A] whitespace-nowrap truncate">
                          {cityLabel}
                        </span>
                      )}
                      <RhythmPill field="reply_pace" value={targetInfo.replyPace} className="shrink-0" />
                    </div>
                  );
                })()}
              </div>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isInitialLoading && (
            <RepBadge score={targetInfo.rep} onClick={() => setShowRepModal(true)} />
          )}
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="w-8 h-8 flex items-center justify-center text-[#51376D]/55 hover:text-[#72519A] hover:bg-[#E8DFF5]/50 rounded-full transition cursor-pointer"
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
        className="flex-1 min-h-0 overflow-y-auto px-3.5 py-4 overscroll-contain no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {isInitialLoading ? (
          <div className="space-y-4 py-4 animate-pulse">
            <div className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-[#E8DFF5]/60 shrink-0" />
              <div className="w-48 h-10 bg-white rounded-2xl rounded-bl-xs border border-[#D5C6EC]" />
            </div>
            <div className="flex justify-end">
              <div className="w-52 h-11 bg-[#72519A]/20 rounded-2xl rounded-br-xs" />
            </div>
            <div className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-[#E8DFF5]/60 shrink-0" />
              <div className="w-40 h-9 bg-white rounded-2xl rounded-bl-xs border border-[#D5C6EC]" />
            </div>
          </div>
        ) : (
          <>
            {showIcebreaker && icebreakerPrompt && messages.length > 0 && messages.length < 3 && (
              <div className="mb-3 p-3.5 rounded-2xl bg-white border border-[#D5C6EC] shadow-[0_2px_10px_rgba(114,81,154,0.05)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#72519A]">
                    <Lightbulb className="w-3.5 h-3.5 text-[#72519A]" />
                    <span>Conversation Starter</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowIcebreaker(false)}
                    className="text-[#51376D]/55 hover:text-[#51376D] p-0.5 cursor-pointer"
                    aria-label="Dismiss icebreaker"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#51376D] leading-relaxed bg-white p-2.5 rounded-xl border border-[#D5C6EC]">
                  &ldquo;{icebreakerPrompt}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInputText(icebreakerPrompt);
                    textareaRef.current?.focus();
                  }}
                  className="text-[11px] font-semibold text-[#72519A] hover:underline cursor-pointer"
                >
                  Tap to use this starter &rarr;
                </button>
              </div>
            )}

            {isRestricted(targetInfo.rep) && (
              <div className="mb-3 p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold text-amber-950">Safety Caution:</span> This member has a low reputation score ({targetInfo.rep}%). Never send money or share financial details.
                </div>
              </div>
            )}

            {errorBanner && (
              <div className="mb-3 p-3 rounded-2xl bg-[#E8DFF5]/50 border border-[#D5C6EC] text-xs text-[#51376D] font-medium text-center">
                {errorBanner}
              </div>
            )}

            {showSafetyNotice && (
              <div className="mb-3 p-3 rounded-2xl bg-[#E8DFF5]/60 border border-[#D5C6EC] text-xs text-[#72519A] flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#72519A] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="font-semibold">Safety Gate:</strong> Contact details and voice notes unlock after 3 substantive replies from both members.
                </p>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-12 h-12 rounded-full overflow-hidden mx-auto border border-[#D5C6EC] bg-[#E8DFF5]/60 relative">
                  <Image
                    src={targetInfo.avatar}
                    alt={targetInfo.name || 'Member'}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <p className="text-xs font-semibold text-[#51376D]">
                  Start a conversation with  {targetInfo.name}
                </p>
                <p className="text-[11px] text-[#51376D]/55 max-w-[240px] mx-auto leading-relaxed">
                  {sharedInterests.length > 0
                    ? `You both love ${sharedInterests.slice(0, 2).join(' & ')}! Break the ice with a suggestion below.`
                    : 'Send a friendly note to break the ice.'}
                </p>
                {(starterChips.length > 0 || icebreakerPrompt) && (
                  <div className="pt-3 flex flex-wrap justify-center gap-2 max-w-[320px] mx-auto">
                    {(starterChips.length > 0
                      ? starterChips
                      : [{ label: 'Say hello', text: icebreakerPrompt as string }]
                    ).map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => {
                          setInputText(chip.text);
                          requestAnimationFrame(() => {
                            const el = textareaRef.current;
                            if (!el) return;
                            el.focus();
                            el.style.height = 'auto';
                            el.style.height = Math.min(el.scrollHeight, 108) + 'px';
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8DFF5]/60 border border-[#D5C6EC] text-[#72519A] text-[11.5px] font-semibold hover:bg-[#E8DFF5]/60 active:scale-95 transition"
                      >
                        <Lightbulb className="w-3 h-3" />
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
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

                // Incoming, non-English text from the other member (not voice notes, masked text or
                // optimistic bubbles). Plain English like "Hi" / "Test" gets no Translate link.
                const canTranslate =
                  !isMe &&
                  !msg.hasAudio &&
                  !msg.wasMasked &&
                  needsTranslation(msg.text || '') &&
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(msg.id);

                // Early off-platform push (phone, messenger handle, payment app...) in one of the
                // first messages of the thread: hairline notice under that bubble.
                const earlyContact =
                  !isMe &&
                  idx < EARLY_THREAD_MESSAGES &&
                  !msg.hasAudio &&
                  (Boolean(msg.wasMasked) || !validateBio(msg.text || '').ok);
                const isRealId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(msg.id);
                const showActions = !isMe && isRealId && activeMsgId === msg.id;

                return (
                  <React.Fragment key={msg.id}>
                    {showDateHeader && (
                      <div className="flex justify-center my-1.5 select-none">
                        <span className="px-3 py-0.5 rounded-full bg-[#E8DFF5]/60 text-[#51376D]/55 text-[10px] font-semibold tracking-wide">
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
                              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#D5C6EC] bg-[#E8DFF5]/60">
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
                          onClick={
                            !isMe && isRealId
                              ? () => {
                                  if (window.getSelection()?.toString()) return; // selecting text, not tapping
                                  setActiveMsgId((cur) => (cur === msg.id ? null : msg.id));
                                }
                              : undefined
                          }
                          className={
                            'px-3.5 py-2 text-[13.5px] leading-[1.45] break-words select-text transition-opacity ' +
                            (!isMe && isRealId ? 'cursor-pointer ' : '') +
                            (msg.pending ? 'opacity-75 ' : msg.failed ? 'opacity-60 ' : 'opacity-100 ') +
                            (isMe
                              ? 'bg-[#72519A] text-white rounded-2xl ' +
                                (isSameSenderAsNext ? 'rounded-br-md' : 'rounded-br-xs') +
                                ' shadow-[0_1px_6px_rgba(114,81,154,0.18)]'
                              : 'bg-white text-[#51376D] border border-[#D5C6EC] rounded-2xl ' +
                                (isSameSenderAsNext ? 'rounded-bl-md' : 'rounded-bl-xs') +
                                ' shadow-[0_1px_3px_rgba(81,55,109,0.03)]')
                          }
                        >
                          {msg.hasAudio ? (
                            <AudioPill
                              src={() => fetchVoiceUrl(msg.id)}
                              label="Voice note"
                              durationMs={msg.audioDurationMs}
                              tone={isMe ? 'onBrand' : 'light'}
                              showProgress
                              className="-mx-1"
                            />
                          ) : translations[msg.id]?.showing && translations[msg.id]?.text ? (
                            <span className="block">
                              <span className="block">{msg.text}</span>
                              <span className="block mt-1.5 pt-1.5 border-t border-[#D5C6EC] italic text-[#51376D]">
                                {translations[msg.id]?.text}
                              </span>
                              <span className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#E8DFF5]/60 text-[9.5px] font-semibold not-italic text-[#72519A]">
                                Translated
                              </span>
                            </span>
                          ) : (
                            msg.text
                          )}
                        </div>
                      </div>

                      {earlyContact && (
                        <p className="mt-1 ml-8 max-w-[84%] rounded-xl border border-[#D5C6EC] bg-white px-2.5 py-1.5 text-[10.5px] leading-snug text-[#51376D]/70">
                          {EARLY_CONTACT_NOTICE}
                        </p>
                      )}

                      {(!isSameSenderAsNext || canTranslate || msg.failed || showActions) && (
                        <div
                          className={
                            'flex items-center gap-1 mt-1 text-[10px] text-[#51376D]/55 select-none ' +
                            (isMe ? 'pr-0.5' : 'pl-8')
                          }
                        >
                          {msg.failed ? (
                            <>
                              <span className="text-[#72519A] font-semibold">Not delivered</span>
                              <span aria-hidden>·</span>
                              <button type="button" onClick={() => retryMessage(msg)} className="font-semibold text-[#72519A] hover:underline">
                                Retry
                              </button>
                            </>
                          ) : (
                            (!isSameSenderAsNext || showActions) && <span>{msg.pending ? 'Sending...' : msg.time}</span>
                          )}
                          {showActions && (
                            <>
                              <span aria-hidden>·</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setReportMessageId(msg.id);
                                  setActiveMsgId(null);
                                }}
                                className="font-semibold text-[#51376D]/60 hover:text-[#72519A]"
                              >
                                Report message
                              </button>
                            </>
                          )}
                          {canTranslate && (
                            <>
                              {!isSameSenderAsNext && <span aria-hidden>·</span>}
                              <button
                                type="button"
                                onClick={() => toggleTranslation(msg)}
                                disabled={translations[msg.id]?.loading}
                                className="font-semibold text-[#72519A] hover:underline cursor-pointer disabled:opacity-60 inline-flex items-center gap-1"
                              >
                                {translations[msg.id]?.loading && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                {translations[msg.id]?.loading
                                  ? 'Translating...'
                                  : translations[msg.id]?.showing
                                    ? 'Translated · Show original'
                                    : 'Translate'}
                              </button>
                            </>
                          )}
                          {/* Delivered / Read indicators: Plus (free members see timestamps only) */}
                          {isMe && !msg.pending && isPlus && (
                            msg.read ? (
                              <CheckCheck className="w-3 h-3 text-[#72519A]" />
                            ) : (
                              <Check className="w-3 h-3 text-[#51376D]/55" />
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
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#72519A] text-white text-xs font-semibold shadow-lg hover:bg-[#51376D] transition cursor-pointer"
        >
          <span>New message</span>
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Docked Flex Composer (Never overlaps message feed) */}
      <div className="shrink-0 w-full bg-white/95 backdrop-blur-md border-t border-[#D5C6EC] px-3 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))] z-20">
        {!isInitialLoading && !gateUnlocked && (() => {
          // One friendly line; shows whichever side still needs messages (each member needs 3).
          const mine = Math.min(liveGate.senderSubstantiveCount, CONTACT_UNLOCK_TURNS);
          const theirs = Math.min(liveGate.receiverSubstantiveCount, CONTACT_UNLOCK_TURNS);
          const them = targetInfo.name || 'them';
          const progress =
            mine < CONTACT_UNLOCK_TURNS && theirs < CONTACT_UNLOCK_TURNS
              ? `You: ${mine}/${CONTACT_UNLOCK_TURNS} · ${them}: ${theirs}/${CONTACT_UNLOCK_TURNS}`
              : mine < CONTACT_UNLOCK_TURNS
                ? `You: ${mine}/${CONTACT_UNLOCK_TURNS}`
                : `${them}: ${theirs}/${CONTACT_UNLOCK_TURNS}`;
          return (
            <p
              className="text-xs text-[#51376D]/55 bg-white border border-[#D5C6EC] py-1.5 px-3 rounded-xl mx-auto mb-2 text-center max-w-md flex items-center justify-center gap-1.5"
              aria-live="polite"
              title="Messages count when they have a few words (15+ characters)."
            >
              <Lock className="w-3.5 h-3.5 shrink-0 text-[#72519A]" aria-hidden />
              <span>
                Voice notes &amp; contact sharing unlock after {CONTACT_UNLOCK_TURNS} meaningful messages each ({progress})
              </span>
            </p>
          );
        })()}
        {!isInitialLoading && gateUnlocked && gateLockedOnOpen && (
          <p
            className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-xl mx-auto mb-2 text-center max-w-md flex items-center justify-center gap-1.5"
            aria-live="polite"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden />
            <span>Safety Gate unlocked · Voice notes &amp; direct sharing now available</span>
          </p>
        )}
        {cooldownSeconds > 0 ? (
          <div className="p-3 rounded-2xl bg-white border border-[#D5C6EC] flex flex-col items-center gap-2 shadow-xs text-center">
            <div className="flex items-center gap-1.5 text-xs text-[#51376D]/85">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Next free message unlocks in</span>
            </div>
            <span className="text-lg font-bold tracking-wider text-[#51376D]">
              {formatTimer(cooldownSeconds)}
            </span>
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-full bg-[#72519A] hover:bg-[#51376D] text-white font-semibold text-xs shadow-sm transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Skip the Wait with Plus
            </button>
          </div>
        ) : voice.state !== 'idle' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (voice.state === 'recording' ? voice.cancel() : voice.reset())}
              disabled={voiceSending}
              aria-label="Discard voice note"
              className="w-9 h-9 rounded-full border border-[#D5C6EC] text-[#51376D]/55 hover:text-[#72519A] flex items-center justify-center shrink-0 disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex-1 h-10 rounded-3xl bg-white border border-[#D5C6EC] px-3 flex items-center gap-2 min-w-0">
              {voice.state === 'recording' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#9474C3] animate-pulse shrink-0" />
                  <span className="text-xs font-semibold text-[#51376D] tabular-nums shrink-0">
                    {formatSeconds(voice.elapsedMs)} / {formatSeconds(VOICE_NOTE_MAX_MS)}
                  </span>
                  <span className="flex-1 flex items-center gap-[2px] h-5 min-w-0 overflow-hidden" aria-hidden>
                    {voice.levels.map((l, i) => (
                      <span key={i} className="flex-1 rounded-full bg-[#72519A]" style={{ height: `${Math.round(l * 100)}%` }} />
                    ))}
                  </span>
                </>
              ) : voicePreviewUrl ? (
                <AudioPill
                  key={voicePreviewUrl}
                  src={voicePreviewUrl}
                  label="Preview"
                  durationMs={voice.durationMs}
                  size="sm"
                />
              ) : null}
            </div>
            {voice.state === 'recording' ? (
              <button
                type="button"
                onClick={voice.stop}
                aria-label="Stop recording"
                className="w-9 h-9 rounded-full bg-[#51376D] text-white flex items-center justify-center shrink-0"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={sendVoiceNote}
                disabled={voiceSending || !voice.blob}
                aria-label="Send voice note"
                className="w-9 h-9 rounded-full bg-[#72519A] hover:bg-[#51376D] text-white flex items-center justify-center shrink-0 disabled:opacity-40"
              >
                {voiceSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 translate-x-[0.5px]" />}
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1 bg-white border border-[#D5C6EC] focus-within:border-[#72519A] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#72519A]/15 rounded-3xl px-3.5 py-2 transition-all flex items-center">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Write a message..."
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  setTimeout(() => scrollToBottom('smooth'), 180);
                }}
                className="w-full bg-transparent text-[#51376D] placeholder-[#51376D]/55 text-[13.5px] leading-snug outline-none resize-none max-h-28 overflow-y-auto"
              />
            </div>
            {!inputText.trim() && (
              <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-full shrink-0">
                <button
                  type="button"
                  onClick={startVoiceNote}
                  aria-label={voiceAllowed ? 'Record a voice note' : 'Voice notes are locked'}
                  title={voiceAllowed ? `Record a voice note (up to ${VOICE_NOTE_MAX_MS / 1000}s)` : voiceLockedMessage}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition cursor-pointer active:scale-95 ${
                    voiceAllowed
                      ? 'border-[#D5C6EC] bg-[#E8DFF5]/60 text-[#72519A] hover:bg-[#E8DFF5]/60'
                      : 'border-[#D5C6EC] bg-white text-[#D5C6EC]'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                {!voiceAllowed && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white text-[#72519A] rounded-full flex items-center justify-center shadow-xs border border-[#D5C6EC]"
                  >
                    <Lock className="w-2 h-2" strokeWidth={3} />
                  </span>
                )}
              </span>
            )}
            <button
              type="submit"
              disabled={!inputText.trim()}
              aria-label="Send message"
              className="w-9 h-9 rounded-full bg-[#72519A] hover:bg-[#51376D] active:scale-90 disabled:opacity-35 text-white flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4 translate-x-[0.5px]" />
            </button>
          </form>
        )}
      </div>

      <InAppToast
        message={toast}
        onClose={closeToast}
        icon={toast === VOICE_LOCKED_MESSAGE || toast === VOICE_REP_LOCKED_MESSAGE ? <Lock className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
      />

      {showUpgradeModal && (
        <UpgradeModal isOpen onClose={() => setShowUpgradeModal(false)} triggerContext="chat" />
      )}
      <ReputationModal
        isOpen={showRepModal}
        onClose={() => setShowRepModal(false)}
        name={targetInfo.name}
        score={targetInfo.rep}
      />
      {(showReportModal || reportMessageId) && (
      <ReportModal
        open
        messageId={reportMessageId ?? undefined}
        reportedId={resolvedTargetUuid || rawParam}
        name={targetInfo.name || 'this member'}
        context="chat"
        onClose={() => {
          setShowReportModal(false);
          setReportMessageId(null);
        }}
        onDone={() => {
          setShowReportModal(false);
          setReportMessageId(null);
          setReportThanks(true);
        }}
      />
      )}
      <InAppToast
        message={reportThanks ? 'Thank you for keeping our community safe. Our team is reviewing this profile.' : null}
        onClose={closeReportThanks}
        durationMs={8000}
        icon={<ShieldAlert className="w-3.5 h-3.5" />}
        action={{ label: `Block ${targetInfo.name || 'member'}`, onClick: handleBlockUser }}
      />
    </div>
  );
}