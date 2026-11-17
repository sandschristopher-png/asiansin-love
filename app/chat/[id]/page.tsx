'use client';

import dynamic from 'next/dynamic';
import VerifiedBadge from '@/components/VerifiedBadge';
import { ChatSafetyBanner } from '@/components/chat/ChatSafetyBanner';
import { TraitIcebreakers } from '@/components/chat/TraitIcebreakers';
import { FirstMessageShield } from '@/components/chat/FirstMessageShield';
import { SafetyBanner } from '@/components/chat/SafetyBanner';
import { localizeError } from '@/lib/i18n/errors';
import { inspectFirstMessageSafety } from '@/lib/safety/shield';
import { isPlusProfile } from '@/lib/plus';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { publicName } from '@/lib/publicName';

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
  Mic,
  Flag,
  Lock,
  Square,
  Trash2,
  Loader2,
  MoreVertical,
  Phone,
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
import { RepBadge } from '@/components/profile/RhythmBadges';
import { hapticError, hapticSuccess, hapticTap } from '@/lib/utils/haptics';
import { BackButton } from '@/components/BackButton';
import { Switch } from '@/components/ui/Switch';
import { useStepUp } from '@/components/verify/useStepUp';
import { isReverificationError, useReverification } from '@/lib/useReverification';
import { useCall } from '@/components/calls/CallProvider';
import { CallLogPill } from '@/components/calls/CallLogPill';
import { callUnlockState, missLockUntil, pairKey, type CallEndReason } from '@/lib/callRules';

/** Loaded on first open (keeps the upgrade sheet out of the page bundle). */
/** Loaded on first open (keeps the report sheet out of the page bundle). */
const ReportModal = dynamic(() => import('@/components/ReportModal').then((m) => m.ReportModal), { ssr: false });

interface CallLogRow {
  id: string;
  caller_id: string;
  started_at: string;
  ended_at: string | null;
  duration_sec: number;
  end_reason: CallEndReason;
}

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
  /** Warning-banner category for a received message the filters flagged (recipient-only). */
  safety?: string | null;
  /** The Moment photo this message was sent from ("Spark this Moment"). */
  moment?: { imageUrl: string } | null;
  hasAudio?: boolean;
  audioDurationMs?: number | null;
}

/** Inline notice under an early incoming message that tries to move the chat off the app. */
const EARLY_CONTACT_NOTICE =
  'Safety Notice: Off-platform contact shared early. Keep conversations on Meet in Asia until mutual trust is established.';
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
  const [myTraits, setMyTraits] = useState<string[]>([]);
  const [theirTraits, setTheirTraits] = useState<string[]>([]);
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
  const [reportDuplicate, setReportDuplicate] = useState(false);
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
  const { t } = useLocale();
  // Verified women message without limits (server rule in /api/messages), so no wait timer for them.
  const [isVerifiedWoman, setIsVerifiedWoman] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);
  const [showRepModal, setShowRepModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportThanks, setReportThanks] = useState(false);
  const closeReportThanks = useCallback(() => setReportThanks(false), []);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [showScrollPill, setShowScrollPill] = useState(false);

  // ---- Voice calls (lib/callEngine.ts; the screens live in components/calls) ----------------------------------
  const call = useCall();
  // Step-up identity check: when the account is restricted the composer is replaced by a locked card.
  const reverification = useReverification();
  const stepUp = useStepUp();
  const confirmIdentity = async () => {
    const result = await stepUp.run();
    if (result?.status === 'passed') reverification.clear();
  };
  const [myVerified, setMyVerified] = useState(false);
  const [callLogs, setCallLogs] = useState<CallLogRow[]>([]);
  const [callsMuted, setCallsMuted] = useState(false);
  const [callNote, setCallNote] = useState<string | null>(null);
  const [callConfirm, setCallConfirm] = useState(false);
  const [callStarting, setCallStarting] = useState(false);
  const [headerMenu, setHeaderMenu] = useState(false);
  // "Now" for the pause check, refreshed every 30 s so a lifted pause unlocks the button without a reload.
  const [callNowMs, setCallNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setCallNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const callMatchKey = currentUserId && resolvedTargetUuid ? pairKey(currentUserId, resolvedTargetUuid) : null;

  // Unlock: both members selfie-verified and 5+ messages in the thread, at least one from each.
  const callUnlock = React.useMemo(() => {
    const real = messages.filter((m) => !m.pending && !m.failed);
    return callUnlockState({
      fromMe: real.filter((m) => m.sender === 'me').length,
      fromThem: real.filter((m) => m.sender === 'them').length,
      meVerified: myVerified,
      theyVerified: targetInfo.verified,
    });
  }, [messages, myVerified, targetInfo.verified]);
  // Two missed or declined calls in a row pause calling for 60 minutes, or until they write again.
  const callPausedUntil = React.useMemo(() => {
    const outgoing = callLogs
      .filter((l) => l.caller_id === currentUserId)
      .map((l) => ({ endedAt: Date.parse(l.ended_at ?? l.started_at), reason: l.end_reason }))
      .sort((a, b) => b.endedAt - a.endedAt);
    const lastFromThem = messages.filter((m) => m.sender === 'them' && !m.pending).map((m) => Date.parse(m.createdAt));
    return missLockUntil(outgoing, lastFromThem.length ? Math.max(...lastFromThem) : null, callNowMs);
  }, [callLogs, messages, currentUserId, callNowMs]);
  const callReady = callUnlock === 'ok' && !callPausedUntil;

  useEffect(() => {
    if (!callMatchKey) return;
    let alive = true;
    supabase
      .from('call_logs')
      .select('id, caller_id, started_at, ended_at, duration_sec, end_reason')
      .eq('match_id', callMatchKey)
      .order('started_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (alive && data) setCallLogs(data as CallLogRow[]);
      });
    return () => {
      alive = false;
    };
  }, [callMatchKey, call.logVersion]);

  useEffect(() => {
    if (!currentUserId || !resolvedTargetUuid) return;
    let alive = true;
    supabase
      .from('call_mutes')
      .select('peer_id')
      .eq('user_id', currentUserId)
      .eq('peer_id', resolvedTargetUuid)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setCallsMuted(Boolean(data));
      });
    return () => {
      alive = false;
    };
  }, [currentUserId, resolvedTargetUuid]);

  useEffect(() => {
    if (!callNote) return;
    const id = window.setTimeout(() => setCallNote(null), 4500);
    return () => window.clearTimeout(id);
  }, [callNote]);

  const closeCallPopovers = () => {
    setCallConfirm(false);
    setCallNote(null);
    setHeaderMenu(false);
  };

  const onPhoneTap = () => {
    setHeaderMenu(false);
    if (call.inCall) {
      setCallNote(call.peerId === resolvedTargetUuid ? null : t('call.inAnother'));
      return;
    }
    if (callUnlock === 'few_messages') return setCallNote(t('call.lockedTip'));
    if (callUnlock === 'unverified') return setCallNote(t('call.unverifiedTip'));
    if (callPausedUntil) return setCallNote(t('call.pausedTip'));
    setCallNote(null);
    setCallConfirm((open) => !open);
  };

  const confirmCall = async () => {
    if (!resolvedTargetUuid || callStarting) return;
    setCallConfirm(false);
    setCallStarting(true);
    try {
      const res = await call.startCall(resolvedTargetUuid);
      if (res.ok) return;
      const why: Record<string, string> = {
        mic_denied: t('call.micBlocked'),
        mic_missing: t('call.micMissing'),
        mic_busy: t('call.micBusy'),
        few_messages: t('call.lockedTip'),
        unverified: t('call.unverifiedTip'),
        paused: t('call.pausedTip'),
        unavailable: t('call.unavailable'),
        busy: t('call.inAnother'),
        network: t('call.failed'),
      };
      setCallNote(why[res.reason] ?? t('call.failed'));
    } finally {
      setCallStarting(false);
    }
  };

  const toggleCallMute = async () => {
    if (!currentUserId || !resolvedTargetUuid) return;
    const next = !callsMuted;
    setCallsMuted(next); // optimistic; rolled back if the save fails
    const { error } = next
      ? await supabase.from('call_mutes').upsert({ user_id: currentUserId, peer_id: resolvedTargetUuid })
      : await supabase.from('call_mutes').delete().eq('user_id', currentUserId).eq('peer_id', resolvedTargetUuid);
    if (error) {
      setCallsMuted(!next);
      setToast(t('call.muteFailed'));
      return;
    }
    if (next) call.terminateFor(resolvedTargetUuid); // muting also ends a call or ring with them right now
  };

  /** Call pills whose time falls in [from, to): placed between the messages they happened between. */
  const callPillsBetween = (from: number, to: number) =>
    callLogs
      .filter((l) => {
        const at = Date.parse(l.started_at);
        return Number.isFinite(at) && at >= from && at < to;
      })
      .map((l) => <CallLogPill key={l.id} reason={l.end_reason} durationSec={l.duration_sec} />);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Opened from a push notification's Reply button (?reply=1): focus the composer once loaded.
  useEffect(() => {
    if (typeof window === 'undefined' || !new URLSearchParams(window.location.search).has('reply')) return;
    const t = window.setTimeout(() => textareaRef.current?.focus(), 600);
    return () => window.clearTimeout(t);
  }, []);
  const hasScrolledInitialRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const forceScrollNextRef = useRef(false);
  // Server-computed contact-reveal state (GET /api/messages); realtime rows are masked with it too.
  const contactUnlockedRef = useRef(false);

  // The gate can open right here, the moment the last needed message arrives, before the server's flag is
  // read again. Unmask at once: stop masking new messages, and re-read the thread once so contact details
  // that were hidden earlier show without a page refresh.
  useEffect(() => {
    if (!liveGate.isUnlocked || contactUnlockedRef.current || !resolvedTargetUuid) return;
    contactUnlockedRef.current = true;
    let alive = true;
    fetch(`/api/messages?target_user_id=${resolvedTargetUuid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d?.messages) return;
        const fresh = new Map<string, { text: string; wasMasked: boolean }>(d.messages.map((x: { id: string; text: string; wasMasked: boolean }) => [x.id, x]));
        setMessages((prev) =>
          prev.map((m) => {
            const f = fresh.get(m.id);
            return f && m.wasMasked && !f.wasMasked ? { ...m, text: f.text, wasMasked: false } : m;
          })
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [liveGate.isUnlocked, resolvedTargetUuid]);

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

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawParam);
      // Your own id is not a conversation (the API refuses it too): leave at once instead of waiting on a load that fails.
      if (isUuid && rawParam.toLowerCase() === user.id.toLowerCase()) {
        router.replace('/messages');
        return;
      }

      if (isMounted) setCurrentUserId(user.id);
      // Handles only: strip anything that could alter the PostgREST .or() filter (commas, parens, dots).
      const handleParam = decodeURIComponent(rawParam).replace(/^@+/, '').replace(/[^a-zA-Z0-9_]/g, '');
      if (!isUuid && !handleParam) {
        router.replace('/messages');
        return;
      }

      const [myProfRes, targetProfRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('is_plus, is_premium, subscription_status, current_period_end, plus_expires_at, gender, is_verified, verification_status, interests, languages, reputation_score')
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
              // Exact username only: matching display_name (the Google real name) would let anyone look up
              // which username belongs to a real name, and the raw URL text must never reach a filter string.
              .eq('username', String(handleParam).toLowerCase().replace(/[^a-z0-9_]/g, ''))
              .limit(1)
              .maybeSingle(),
      ]);

      const myProf = myProfRes.data;
      if (isPlusProfile(myProf)) {
        if (isMounted) setIsPlus(true);
      }
      if (isMounted && myProf?.is_verified === true && String(myProf?.gender || '').toLowerCase() === 'female') {
        setIsVerifiedWoman(true);
      }
      const myInterests: string[] = Array.isArray(myProf?.interests) ? myProf.interests : [];
      if (isMounted && typeof myProf?.reputation_score === 'number') setMyRep(myProf.reputation_score);
      if (isMounted) setMyVerified(myProf?.is_verified === true || myProf?.verification_status === 'verified');

      const profData: any = targetProfRes.data;
      const targetUuid: string | null = profData?.id || (isUuid ? rawParam : null);

      // Also catches your own @username typed into the address.
      if (!targetUuid || targetUuid === user.id) {
        router.replace('/messages');
        return;
      }

      const [blockRes, remoteMsgsRes, convStateRes] = await Promise.all([
        supabase
          .from('user_blocks')
          .select('id')
          .or(
            'and(blocker_id.eq.' + user.id + ',blocked_id.eq.' + targetUuid + '),and(blocker_id.eq.' + targetUuid + ',blocked_id.eq.' + user.id + ')'
          )
          .maybeSingle(),
        fetch(`/api/messages?target_user_id=${targetUuid}`).then(r => r.ok ? r.json() : Promise.reject(new Error('Chat load failed'))),
        // Messages list swipe state (20261115_conversation_states.sql); errors (table not migrated
        // yet) just mean no state.
        supabase
          .from('conversation_states')
          .select('marked_unread')
          .eq('user_id', user.id)
          .eq('partner_id', targetUuid)
          .maybeSingle(),
      ]);
      // Opening the chat clears a manual "Mark unread".
      if (convStateRes.data?.marked_unread) {
        supabase
          .from('conversation_states')
          .update({ marked_unread: false, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('partner_id', targetUuid)
          .then(() => {});
      }

      if (blockRes.data) {
        router.replace('/messages');
        return;
      }

      if (!isMounted) return;

      setResolvedTargetUuid(targetUuid);

      if (profData) {
        const cleanHandle = publicName(profData);

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
        setMyTraits(myInterests);
        setTheirTraits(theirInterests.filter((t) => typeof t === 'string' && t.trim().length > 0));
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
          remoteMsgsRes.messages
            // Deleted from the Messages list: only what came after stays visible (for this member).
            .map((m: any) => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            createdAt: m.createdAt,
            time: formatTimeShort(m.createdAt),
            wasMasked: m.wasMasked,
            safety: m.safety ?? null,
            moment: m.moment ?? null,
            read: Boolean(m.read ?? m.is_read),
            hasAudio: Boolean(m.hasAudio),
            audioDurationMs: m.audioDurationMs ?? null,
          }))
        );
      }

      setIsInitialLoading(false);
    }

    initUserAndTarget().catch((err) => {
      // Without this a failed load (the API refuses a bad target, the network drops) left the skeleton up forever.
      console.error('[chat] could not open the conversation', err);
      if (isMounted) router.replace('/messages');
    });
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

        // Warning banner for a flagged incoming message: the server writes the flag a moment after the
        // message, so look it up (recipient-only table) with two retries.
        if (!isMe) {
          const lookUpFlag = (attempt: number) => {
            supabase
              .from('message_safety_flags')
              .select('category')
              .eq('message_id', row.id)
              .maybeSingle()
              .then(({ data }) => {
                if (!isMounted) return;
                if (data?.category) {
                  setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, safety: data.category as string } : m)));
                } else if (attempt < 2) {
                  setTimeout(() => lookUpFlag(attempt + 1), 900);
                }
              });
          };
          lookUpFlag(0);
          // A message sent from a Moment gets its photo attached a moment after delivery.
          setTimeout(() => {
            fetch(`/api/messages?target_user_id=${resolvedTargetUuid}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => {
                const fresh = d?.messages?.find((m: any) => m.id === row.id);
                if (isMounted && fresh?.moment) setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, moment: fresh.moment } : m)));
              })
              .catch(() => {});
          }, 1500);
        }

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

  /** The newest message I sent that is on the server: the one place free members see the read-receipt prompt. */
  const lastOwnMessageId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.sender === 'me' && !m.pending && !m.failed) return m.id;
    }
    return null;
  })();

  const submitMessage = async (override?: string) => {
    const clean = (override ?? inputText).trim();
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
    if (override === undefined) {
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    setShowIcebreaker(false);
    await deliver(tempId, clean);
  };

  /**
   * A conversation starter was tapped: send it now instead of copying it into the box. The starters hide
   * at once (the bubble appears optimistically and the empty state goes away), a second tap while the first
   * is still going out is ignored, and a refusal (safety gate, daily limit) puts the text back in the box
   * through deliver() like any other message.
   */
  const starterSendingRef = useRef(false);
  const sendStarter = async (text: string) => {
    if (starterSendingRef.current || !text.trim()) return;
    starterSendingRef.current = true;
    hapticTap(); // synchronous, inside the tap
    setShowIcebreaker(false);
    try {
      await submitMessage(text);
    } finally {
      starterSendingRef.current = false;
    }
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
        if (isReverificationError(resData)) {
          reverification.markRequired(); // the composer swaps to the locked card
          return;
        }
        if (resData.courtshipLocked) setShowSafetyNotice(true);
        if (resData.code === 'OUTREACH_LIMIT_REACHED') {
          // A calm explanation, then the comparison screen; the draft is kept above.
          setErrorBanner(t('chat.outreachLimit', { n: 5 }));
          router.push('/plus?feature=conversations');
          return;
        }
        setErrorBanner(String(resData.code || '').startsWith('NETWORK_') ? localizeError({ code: resData.code }, t) : resData.error || 'Message could not be delivered.');
        return;
      }

      const nextCount = sentCount + 1;
      setSentCount(nextCount);
      // The wait only slows cold outreach: a thread the other member has replied in is a mutual
      // conversation, which /plus promises unlimited, and verified women are exempt server-side too.
      const partnerHasReplied = messages.some((m) => m.sender === 'them');
      if (nextCount >= 5 && !isPlus && !isVerifiedWoman && !partnerHasReplied) {
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
        if (isReverificationError(data)) {
          reverification.markRequired();
          return;
        }
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
        call.terminateFor(target); // blocking ends any call with them and revokes calling
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
    <div className="w-full h-[100dvh] max-h-[100dvh] flex flex-col bg-white text-[#413B5E] font-sans relative overflow-hidden">
      {/* Room for the slim "Return to call" bar pinned above the header while the call screen is minimized */}
      {call.inCall && call.minimized && call.phase !== 'incoming' && <div className="h-9 shrink-0" aria-hidden />}
      {/* Sticky Header */}
      <header className="relative flex items-center justify-between px-3.5 py-2.5 bg-white/95 backdrop-blur-md border-b border-[#D0CDE1] shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <BackButton fallback="/messages" />

          {isInitialLoading ? (
            <div className="flex items-center gap-2.5 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-[#E8E6F1]/60" />
              <div className="space-y-1.5">
                <div className="w-24 h-3.5 bg-[#E8E6F1]/60 rounded-full" />
                <div className="w-16 h-2.5 bg-[#E8E6F1]/60 rounded-full" />
              </div>
            </div>
          ) : (
            <Link
              href={'/profile/' + (resolvedTargetUuid || rawParam)}
              className="flex items-center gap-2.5 min-w-0 group"
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#D0CDE1] shrink-0 bg-[#E8E6F1]/60">
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
                    className="text-[13.5px] font-semibold text-[#413B5E] group-hover:text-[#8574B7] transition leading-tight truncate"
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
                      {label && <span className="text-[11px] text-slate-600 font-medium truncate shrink-0">{label}</span>}
                      {cityLabel && (
                        <span className="px-1.5 py-px rounded-full bg-[#E8E6F1]/60 text-[10px] font-semibold text-[#8574B7] whitespace-nowrap truncate">
                          {cityLabel}
                        </span>
                      )}
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
          {!isInitialLoading && (
            // The call button is the one obvious action up here: a 40px circle on the lavender surface.
            <button
              type="button"
              onClick={onPhoneTap}
              aria-label={t('call.phoneLabel')}
              title={t('call.phoneLabel')}
              aria-disabled={!callReady}
              className={`w-10 h-10 flex items-center justify-center rounded-full bg-[#F6F4FB] ring-1 ring-[#E6E2F0] transition active:scale-95 cursor-pointer ${
                callReady ? 'text-[#8574B7] hover:text-[#534377] hover:bg-[#E8E6F1]' : 'text-[#413B5E]/35 hover:bg-[#E8E6F1]/60'
              }`}
            >
              {callStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Phone className="w-5 h-5" />}
            </button>
          )}
          {!isInitialLoading && (
            <button
              type="button"
              onClick={() => {
                setCallConfirm(false);
                setCallNote(null);
                setHeaderMenu((open) => !open);
              }}
              aria-label={t('call.menuLabel')}
              aria-haspopup="menu"
              aria-expanded={headerMenu}
              className="w-8 h-8 -mr-1 flex items-center justify-center text-[#413B5E] hover:bg-[#E8E6F1]/70 rounded-full transition cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Voice call: confirm popover, lock / error tooltip, and the chat menu */}
        {callConfirm && (
          <div role="dialog" aria-label={t('call.phoneLabel')} className="absolute right-3 top-full z-30 mt-1.5 w-[270px] rounded-2xl border border-[#D0CDE1] bg-white p-3.5 shadow-[0_12px_30px_rgba(65,59,94,0.16)]">
            <p className="text-sm font-semibold leading-snug text-[#413B5E]">{t('call.confirmTitle', { name: targetInfo.name || 'Member' })}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={closeCallPopovers} className="h-10 rounded-full border border-[#D0CDE1] bg-white text-xs font-semibold text-[#413B5E] transition hover:bg-[#F6F4FB]">
                {t('call.confirmCancel')}
              </button>
              <button type="button" onClick={confirmCall} className="h-10 rounded-full bg-[#8574B7] text-xs font-semibold text-white transition hover:bg-[#534377]">
                {t('call.confirmCall')}
              </button>
            </div>
          </div>
        )}
        {callNote && !callConfirm && (
          <div role="status" className="absolute right-3 top-full z-30 mt-1.5 w-[270px] rounded-2xl border border-[#D0CDE1] bg-white px-3.5 py-3 text-xs font-medium leading-relaxed text-[#413B5E] shadow-[0_12px_30px_rgba(65,59,94,0.16)]">
            {callNote}
          </div>
        )}
        {headerMenu && (
          <div role="menu" className="absolute right-3 top-full z-30 mt-1.5 w-[250px] rounded-2xl border border-[#D0CDE1] bg-white p-1.5 shadow-[0_12px_30px_rgba(65,59,94,0.16)]">
            <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
              <span className="text-sm text-[#413B5E]">{t('call.menuMute')}</span>
              <Switch on={callsMuted} onClick={toggleCallMute} label={t('call.menuMute')} />
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setHeaderMenu(false);
                setShowReportModal(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-[#413B5E] transition hover:bg-[#F6F4FB]"
            >
              <ShieldAlert className="h-4 w-4 text-slate-600" aria-hidden />
              Safety &amp; Moderation
            </button>
          </div>
        )}
      </header>
      {(callConfirm || callNote || headerMenu) && (
        <button type="button" aria-hidden tabIndex={-1} onClick={closeCallPopovers} className="fixed inset-0 z-[15] cursor-default" />
      )}

      {/* Isolated Auto-Scrolling Message Stream */}
      <div
        ref={scrollContainerRef}
        onScroll={handleContainerScroll}
        className="flex-1 min-h-0 overflow-y-auto px-3.5 py-4 overscroll-contain no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {resolvedTargetUuid && <ChatSafetyBanner conversationKey={resolvedTargetUuid} />}
        {isInitialLoading ? (
          <div className="space-y-4 py-4 animate-pulse">
            <div className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-[#E8E6F1]/60 shrink-0" />
              <div className="w-48 h-10 bg-white rounded-2xl rounded-bl-xs border border-[#D0CDE1]" />
            </div>
            <div className="flex justify-end">
              <div className="w-52 h-11 bg-[#8574B7]/20 rounded-2xl rounded-br-xs" />
            </div>
            <div className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-[#E8E6F1]/60 shrink-0" />
              <div className="w-40 h-9 bg-white rounded-2xl rounded-bl-xs border border-[#D0CDE1]" />
            </div>
          </div>
        ) : (
          <>
            {showIcebreaker && icebreakerPrompt && messages.length > 0 && messages.length < 3 && (
              <div className="mb-3 p-3.5 rounded-2xl bg-white border border-[#D0CDE1] shadow-[0_2px_10px_rgba(102,93,150,0.05)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8574B7]">
                    <Lightbulb className="w-3.5 h-3.5 text-[#8574B7]" />
                    <span>Conversation Starter</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowIcebreaker(false)}
                    className="text-slate-600 hover:text-[#413B5E] p-0.5 cursor-pointer"
                    aria-label="Dismiss icebreaker"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#413B5E] leading-relaxed bg-white p-2.5 rounded-xl border border-[#D0CDE1]">
                  &ldquo;{icebreakerPrompt}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => void sendStarter(icebreakerPrompt)}
                  className="text-[11px] font-medium text-[#8574B7] hover:underline cursor-pointer"
                >
                  Tap to send this starter &rarr;
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
              <div className="mb-3 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium text-center">
                {errorBanner}
              </div>
            )}

            {showSafetyNotice && (
              <div className="mb-3 p-3 rounded-2xl bg-[#E8E6F1]/60 border border-[#D0CDE1] text-xs text-[#8574B7] flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#8574B7] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="font-semibold">Safety Gate:</strong> Contact details and voice notes unlock after 3 substantive replies from both members.
                </p>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-12 h-12 rounded-full overflow-hidden mx-auto border border-[#D0CDE1] bg-[#E8E6F1]/60 relative">
                  <Image
                    src={targetInfo.avatar}
                    alt={targetInfo.name || 'Member'}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <p className="text-xs font-semibold text-[#413B5E]">
                  Start a conversation with  {targetInfo.name}
                </p>
                <p className="text-[11px] text-slate-600 max-w-[240px] mx-auto leading-relaxed">
                  {sharedInterests.length > 0
                    ? `You both love ${sharedInterests.slice(0, 2).join(' & ')}! Break the ice with a suggestion below.`
                    : 'Send a friendly note to break the ice.'}
                </p>
                {theirTraits.length > 0 ? (
                  <div className="pt-3 max-w-[320px] mx-auto">
                    <TraitIcebreakers
                      myTraits={myTraits}
                      theirTraits={theirTraits}
                      theirName={targetInfo.name}
                      onSelectPrompt={(text) => void sendStarter(text)}
                    />
                  </div>
                ) : (starterChips.length > 0 || icebreakerPrompt) && (
                  <div className="pt-3 flex flex-wrap justify-center gap-2 max-w-[320px] mx-auto">
                    {(starterChips.length > 0
                      ? starterChips
                      : [{ label: 'Say hello', text: icebreakerPrompt as string }]
                    ).map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => void sendStarter(chip.text)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8E6F1]/60 border border-[#D0CDE1] text-[#8574B7] text-[11.5px] font-medium hover:bg-[#E8E6F1]/60 active:scale-95 transition"
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
                const pillsBefore = callPillsBetween(idx === 0 ? -Infinity : Date.parse(messages[idx - 1].createdAt), Date.parse(msg.createdAt));
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
                // First message received in the thread. The API masks contact details before the
                // client sees them, so a masked message counts as well as a scanner hit.
                const showFirstMessageShield =
                  !isMe &&
                  idx < EARLY_THREAD_MESSAGES &&
                  !msg.hasAudio &&
                  !messages.slice(0, idx).some((m) => m.sender !== 'me') &&
                  (Boolean(msg.wasMasked) || inspectFirstMessageSafety(msg.text || '').isSuspicious);
                const isRealId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(msg.id);
                const showActions = !isMe && isRealId && activeMsgId === msg.id;

                return (
                  <React.Fragment key={msg.id}>
                    {pillsBefore}
                    {showDateHeader && (
                      <div className="flex justify-center my-1.5 select-none">
                        <span className="px-3 py-0.5 rounded-full bg-[#E8E6F1]/60 text-slate-600 text-[10px] font-semibold tracking-wide">
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
                              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#D0CDE1] bg-[#E8E6F1]/60">
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
                              ? 'bg-[#8574B7] text-white rounded-2xl ' +
                                (isSameSenderAsNext ? 'rounded-br-md' : 'rounded-br-xs') +
                                ' shadow-[0_1px_6px_rgba(102,93,150,0.18)]'
                              : 'bg-white text-[#413B5E] border border-[#D0CDE1] rounded-2xl ' +
                                (isSameSenderAsNext ? 'rounded-bl-md' : 'rounded-bl-xs') +
                                ' shadow-[0_1px_3px_rgba(65,59,94,0.03)]')
                          }
                        >
                          {msg.moment && (
                            <span className="relative mb-2 block h-36 w-28 overflow-hidden rounded-xl border border-[#D0CDE1]/60 bg-[#E8E6F1]/50">
                              <Image src={msg.moment.imageUrl} alt={t('moments.attachedAlt')} fill sizes="112px" className="object-cover" />
                            </span>
                          )}
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
                              <span className="block mt-1.5 pt-1.5 border-t border-[#D0CDE1] italic text-[#413B5E]">
                                {translations[msg.id]?.text}
                              </span>
                              <span className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#E8E6F1]/60 text-[9.5px] font-semibold not-italic text-[#8574B7]">
                                Translated
                              </span>
                            </span>
                          ) : (
                            msg.text
                          )}
                        </div>
                        {/* One-tap report on every received message. */}
                        {!isMe && isRealId && !msg.hasAudio && (
                          <button
                            type="button"
                            onClick={() => setReportMessageId(msg.id)}
                            aria-label={t('report.messageTitle')}
                            title={t('report.messageTitle')}
                            className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-[#E8E6F1]/70 hover:text-[#8574B7]"
                          >
                            <Flag className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        )}
                      </div>

                      {showFirstMessageShield && <FirstMessageShield senderName={targetInfo.name} />}
                      {!isMe && isRealId && msg.safety && <SafetyBanner kind={msg.safety} onReport={() => setReportMessageId(msg.id)} />}

                      {earlyContact && !showFirstMessageShield && (
                        <p className="mt-1 ml-8 max-w-[84%] rounded-xl border border-[#D0CDE1] bg-white px-2.5 py-1.5 text-[10.5px] leading-snug text-slate-600">
                          {EARLY_CONTACT_NOTICE}
                        </p>
                      )}

                      {(!isSameSenderAsNext || canTranslate || msg.failed || showActions) && (
                        <div
                          className={
                            'flex items-center gap-1 mt-1 text-[10px] text-slate-600 select-none ' +
                            (isMe ? 'pr-0.5' : 'pl-8')
                          }
                        >
                          {msg.failed ? (
                            <>
                              <span className="text-red-600 font-semibold">Not delivered</span>
                              <span aria-hidden>·</span>
                              <button type="button" onClick={() => retryMessage(msg)} className="font-medium text-[#8574B7] hover:underline">
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
                                className="font-medium text-slate-600 hover:text-red-600"
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
                                className="font-medium text-[#8574B7] hover:underline cursor-pointer disabled:opacity-60 inline-flex items-center gap-1"
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
                              <CheckCheck className="w-3 h-3 text-[#8574B7]" />
                            ) : (
                              <Check className="w-3 h-3 text-slate-600" />
                            )
                          )}
                          {/* Free senders see timestamps only; one quiet prompt under the latest message. */}
                          {isMe && !isPlus && msg.id === lastOwnMessageId && (
                            <>
                              <span aria-hidden>·</span>
                              <Link href="/plus?feature=receipts" className="font-medium text-[#8574B7] hover:underline">
                                {t('plus.page.receiptsPrompt')}
                              </Link>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })
            )}
            {messages.length > 0 && callPillsBetween(Date.parse(messages[messages.length - 1].createdAt), Infinity)}
          </>
        )}
      </div>

      {/* Floating Scroll-to-Bottom Pill when scrolled up */}
      {showScrollPill && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#8574B7] text-white text-xs font-medium shadow-lg hover:bg-[#413B5E] transition cursor-pointer"
        >
          <span>New message</span>
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Restricted account: the composer gives way to the identity prompt (step-up check) */}
      {reverification.required && (
        <div className="shrink-0 w-full border-t border-[#8574B7]/20 bg-[#F6F4FB] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center z-20">
          <p className="text-sm font-semibold text-[#413B5E]">{t('stepup.lockedTitle')}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#413B5E]/75">{t('stepup.lockedBody')}</p>
          <button type="button" onClick={confirmIdentity} className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-[#8574B7] text-sm font-semibold text-white transition hover:bg-[#534377]">
            {t('stepup.continue')}
          </button>
        </div>
      )}
      {stepUp.element}
      {/* Docked Flex Composer (Never overlaps message feed) */}
      <div className={`shrink-0 w-full bg-white/95 backdrop-blur-md border-t border-[#D0CDE1] px-3 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))] z-20 ${reverification.required ? 'hidden' : ''}`}>
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
              className="text-xs text-slate-600 bg-white border border-[#D0CDE1] py-1.5 px-3 rounded-xl mx-auto mb-2 text-center max-w-md flex items-center justify-center gap-1.5"
              aria-live="polite"
              title="Messages count when they have a few words (15+ characters)."
            >
              <Lock className="w-3.5 h-3.5 shrink-0 text-[#8574B7]" aria-hidden />
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
            <span>Safety Gate unlocked · Voice notes &amp; direct sharing now available</span>
          </p>
        )}
        {cooldownSeconds > 0 ? (
          // A calm nudge, not an error: what happened, how it opens up, when the next message can go.
          <div role="status" className="p-3.5 rounded-2xl bg-[#FAF9FC] border border-[#8574B7]/25 flex flex-col gap-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[13px] font-semibold leading-snug text-[#413B5E]">
              <Clock className="w-4 h-4 shrink-0 text-[#8574B7]" aria-hidden />
              <span>{t('chat.cooldownTitle', { n: 5 })}</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">{t('chat.cooldownBody', { time: formatTimer(cooldownSeconds) })}</p>
            <Link
              href="/plus?feature=conversations"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white font-medium text-xs shadow-sm transition"
            >
              <Zap className="w-3.5 h-3.5 fill-current" aria-hidden />
              {t('chat.cooldownCta')}
            </Link>
          </div>
        ) : voice.state !== 'idle' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (voice.state === 'recording' ? voice.cancel() : voice.reset())}
              disabled={voiceSending}
              aria-label="Discard voice note"
              className="w-9 h-9 rounded-full border border-[#D0CDE1] text-slate-600 hover:text-red-600 flex items-center justify-center shrink-0 disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex-1 h-10 rounded-3xl bg-white border border-[#D0CDE1] px-3 flex items-center gap-2 min-w-0">
              {voice.state === 'recording' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <span className="text-xs font-semibold text-[#413B5E] tabular-nums shrink-0">
                    {formatSeconds(voice.elapsedMs)} / {formatSeconds(VOICE_NOTE_MAX_MS)}
                  </span>
                  <span className="flex-1 flex items-center gap-[2px] h-5 min-w-0 overflow-hidden" aria-hidden>
                    {voice.levels.map((l, i) => (
                      <span key={i} className="flex-1 rounded-full bg-[#8574B7]" style={{ height: `${Math.round(l * 100)}%` }} />
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
                className="w-9 h-9 rounded-full bg-[#413B5E] text-white flex items-center justify-center shrink-0"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={sendVoiceNote}
                disabled={voiceSending || !voice.blob}
                aria-label="Send voice note"
                className="w-9 h-9 rounded-full bg-[#8574B7] hover:bg-[#413B5E] text-white flex items-center justify-center shrink-0 disabled:opacity-40"
              >
                {voiceSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 translate-x-[0.5px]" />}
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1 bg-white border border-[#D0CDE1] focus-within:border-[#8574B7] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#8574B7]/15 rounded-3xl px-3.5 py-2 transition-all flex items-center">
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
                className="w-full bg-transparent text-[#413B5E] placeholder-[#413B5E]/55 text-[13.5px] leading-snug outline-none resize-none max-h-28 overflow-y-auto"
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
                      ? 'border-[#D0CDE1] bg-[#E8E6F1]/60 text-[#8574B7] hover:bg-[#E8E6F1]/60'
                      : 'border-[#D0CDE1] bg-white text-[#D0CDE1]'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                {!voiceAllowed && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white text-[#8574B7] rounded-full flex items-center justify-center shadow-xs border border-[#D0CDE1]"
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
              className="w-9 h-9 rounded-full bg-[#8574B7] hover:bg-[#413B5E] active:scale-90 disabled:opacity-35 text-white flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer"
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
        onDone={(_blocked, duplicate) => {
          setShowReportModal(false);
          setReportMessageId(null);
          setReportDuplicate(Boolean(duplicate));
          setReportThanks(true);
        }}
      />
      )}
      <InAppToast
        message={reportThanks ? (reportDuplicate ? t('report.already') : t('report.thanks')) : null}
        onClose={closeReportThanks}
        durationMs={8000}
        icon={<ShieldAlert className="w-3.5 h-3.5" />}
        action={{ label: t('report.blockUnmatch'), onClick: handleBlockUser }}
      />
    </div>
  );
}
