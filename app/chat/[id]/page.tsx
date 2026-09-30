'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Send, Zap, ShieldAlert, CheckCheck, Clock } from 'lucide-react';
import UpgradeModal from '@/components/UpgradeModal';
import ReputationModal from '@/components/ReputationModal';
import { supabase } from '@/lib/supabaseClient';


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

  const [currentUserId, setCurrentUserId] = useState<string>('guest-user');
  const [targetInfo, setTargetInfo] = useState({
    name: 'Member',
    avatar: '/placeholder-avatar.svg',
    rep: 98,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);

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
          name: prof.display_name || prof.full_name || prof.username || 'Member',
          avatar: prof.avatar_url || '/placeholder-avatar.svg',
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
    <main className="min-h-screen bg-[#F8F7FA] text-[#1C1924] flex flex-col justify-between">
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#9A8CC3]/30">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="text-[#9A8CC3] hover:text-[#1C1924] transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#9A8CC3]/50">
            <Image src={targetInfo.avatar} alt={targetInfo.name} fill className="object-cover object-[50%_20%]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#1C1924] leading-tight">{targetInfo.name}</span>
            <span className="text-[10px] text-emerald-400 font-medium">Active now</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRepModal(true)}
          className="px-2.5 py-1 rounded-full bg-[#FFFFFF] hover:bg-[#EAE6F2] border border-[#9A8CC3]/30 hover:border-[#9A8CC3]/60 text-[10px] font-semibold text-[#1C1924] transition active:scale-95 cursor-pointer"
          title="View Conduct and Behavior Breakdown"
        >
          {targetInfo.rep}% Rep
        </button>
          <button onClick={() => setShowReportModal(true)} className="flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-500 hover:border-rose-300 hover:text-rose-600 dark:border-zinc-700 dark:text-zinc-400" title="Safety Options"><ShieldAlert className="h-3.5 w-3.5" /><span>Report</span></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-md mx-auto w-full">
        {showSafetyNotice && (
          <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-amber-400/50 text-[11px] text-amber-200 flex items-start gap-2 shadow-md">
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
                  ? 'bg-[#6555B8] text-white font-medium rounded-br-xs shadow-md shadow-[#6555B8]/30'
                  : 'bg-[#FFFFFF] text-white border border-[#9A8CC3]/35 rounded-bl-xs shadow-md'
              }`}
            >
              {msg.text}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-[#B2A4D7]">
              <span>{msg.time}</span>
              {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-[#9A8CC3]" />}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="sticky bottom-0 z-30 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#9A8CC3]/30 p-3 max-w-md mx-auto w-full">
        {cooldownSeconds > 0 ? (
          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#9A8CC3]/50 flex flex-col items-center gap-2.5 shadow-xl text-center">
            <div className="flex items-center gap-1.5 text-xs text-[#9A8CC3]">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Next free message unlocks in</span>
            </div>
            <span className="text-2xl font-extrabold tracking-wider text-[#1C1924]">
              {formatTimer(cooldownSeconds)}
            </span>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#6555B8] hover:bg-[#7D4B9F] text-white font-bold text-xs shadow-lg shadow-[#6555B8]/40 active:scale-95 transition"
            >
              <Zap className="w-4 h-4 fill-current" />
              Skip the Wait â€” Unlock Instant Chat
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Write a sincere message..."
              className="flex-1 bg-[#FFFFFF] border border-[#FFFFFF] focus:border-[#6555B8] rounded-full px-4 py-2.5 text-xs text-[#1C1924] placeholder-[#E6E1EC] outline-none transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-full bg-[#6555B8] hover:bg-[#7D4B9F] text-white disabled:opacity-40 transition shrink-0 shadow-md shadow-[#6555B8]/40 active:scale-95"
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
        <h3 className="font-semibold text-zinc-900 dark:text-[#1C1924]">Safety & Moderation</h3>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Take action regarding this member. Reports are reviewed by human moderators within 24 hours.</p>
      {actionDoneMsg ? (
        <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{actionDoneMsg}</div>
      ) : (
        <div className="mt-5 space-y-2">
          <button onClick={() => { setActionDoneMsg("User has been blocked. Messages from this user are now muted."); setTimeout(() => { setShowReportModal(false); setActionDoneMsg(null); }, 1800); }} className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">Block Member</button>
          <button onClick={() => { setActionDoneMsg("Report submitted. Thank you for keeping Asians in Love safe."); setTimeout(() => { setShowReportModal(false); setActionDoneMsg(null); }, 1800); }} className="w-full rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-[#1C1924] shadow-sm hover:bg-rose-700">Report Violation / Scammer</button>
        </div>
      )}
      <button onClick={() => { setShowReportModal(false); setActionDoneMsg(null); }} className="mt-3 w-full py-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">Cancel</button>
    </div>
  </div>
)}
    </main>
  );
}
