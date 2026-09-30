'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Send, Zap, ShieldAlert, CheckCheck, Clock, ShieldCheck, UserCheck, MoreVertical } from 'lucide-react';
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
  const hasOffPlatformWord = offPlatformKeywords.some((kw) => normalized.includes(kw));
  const digitClusterRegex = /(?:\+?\d[\s\.\-_\(\)]*){7,}/g;
  const hasPhoneDigits = digitClusterRegex.test(text);

  if (hasOffPlatformWord || hasPhoneDigits) {
    let masked = text.replace(digitClusterRegex, '[contact info hidden for safety]');
    offPlatformKeywords.forEach((kw) => {
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
    id: targetId,
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
          id: prof.id,
          name: prof.username || prof.display_name || 'Member',
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
  }, [targetId]);

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
            setMessages((prev) => [
              ...prev,
              {
                id: newRow.id,
                sender: 'them',
                text: newRow.content,
                time: new Date(newRow.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedTargetUuid, currentUserId]);

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
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
    <div className="min-h-screen bg-[#F8F7FA] text-[#1C1924] flex flex-col justify-between">
      {/* Outer pairs-style centered container on desktop */}
      <main className="flex-1 max-w-5xl mx-auto w-full flex flex-col sm:px-4 sm:py-6">
        <div className="flex-1 flex flex-col bg-white sm:rounded-3xl sm:border sm:border-[#DDD7E5] sm:shadow-xs overflow-hidden h-[calc(100dvh-1rem)] sm:h-[82vh]">
          
          {/* Pairs-Style Top Navigation Header */}
          <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white/95 backdrop-blur-md border-b border-[#DDD7E5]">
            <div className="flex items-center gap-3">
              <Link
                href="/messages"
                className="w-8 h-8 rounded-full bg-[#FAF8FD] border border-[#DDD7E5] flex items-center justify-center text-[#524B5E] hover:text-[#1C1924] hover:bg-[#F3EFFC] transition shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#DDD7E5] bg-[#EAE6F2] shrink-0">
                <Image src={targetInfo.avatar} alt={targetInfo.name} fill className="object-cover" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1C1924] leading-tight">
                    {targetInfo.name}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                </div>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active now
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRepModal(true)}
                className="px-3 py-1 rounded-full bg-white hover:bg-[#F3EFFC] border border-[#DDD7E5] text-xs font-semibold text-[#6555b8] transition active:scale-95 cursor-pointer shadow-xs"
                title="View Conduct and Behavior Breakdown"
              >
                {targetInfo.rep}% Rep
              </button>
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C849B] hover:text-rose-600 hover:bg-rose-50 border border-[#DDD7E5] transition"
                title="Safety & Report"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Safety Reminder Banner */}
          {showSafetyNotice && (
            <div className="p-3 mx-4 mt-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 shadow-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Courtship Safety: External handles and phone digits are masked during initial intros to prevent off-platform spam.
              </p>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#756D82]">
                <div className="w-12 h-12 rounded-full bg-[#F3EFFC] text-[#6555b8] flex items-center justify-center mb-1">
                  <UserCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-[#1C1924]">Start a sincere conversation</p>
                <p className="text-xs max-w-xs text-[#756D82]">
                  Compliment something from their profile or ask about their day to begin meaningful courtship.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'me'
                        ? 'bg-[#6555b8] text-white font-medium rounded-br-xs shadow-xs'
                        : 'bg-[#F3EFFC] text-[#1C1924] font-medium rounded-bl-xs border border-[#DDD7E5]'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-[#8C849B]">
                    <span>{msg.time}</span>
                    {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-[#6555b8]" />}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Bottom Dock / Input Form */}
          <div className="p-3 sm:p-4 bg-white border-t border-[#DDD7E5]">
            {cooldownSeconds > 0 ? (
              <div className="p-4 rounded-2xl bg-[#FAF8FD] border border-[#DDD7E5] flex flex-col items-center gap-2.5 shadow-xs text-center">
                <div className="flex items-center gap-1.5 text-xs text-[#524B5E]">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Next free message unlocks in</span>
                </div>
                <span className="text-2xl font-extrabold tracking-wider text-[#1C1924]">
                  {formatTimer(cooldownSeconds)}
                </span>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#6555b8] hover:bg-[#52449e] text-white font-bold text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  Skip the Wait â€” Upgrade to Unlimited
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto w-full">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a polite, authentic message..."
                  className="flex-1 px-4 py-2.5 bg-white border border-[#DDD7E5] rounded-full text-xs sm:text-sm text-[#1C1924] placeholder-[#8C849B] focus:outline-none focus:border-[#6555b8] focus:ring-2 focus:ring-[#6555b8]/15 transition shadow-xs"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-full bg-[#6555b8] hover:bg-[#52449e] disabled:opacity-40 disabled:hover:bg-[#6555b8] text-white flex items-center justify-center transition active:scale-95 shrink-0 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Report / Safety Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DDD7E5] max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#1C1924]">Member Safety Options</h3>
            {actionDoneMsg ? (
              <p className="text-xs text-emerald-600 font-semibold">{actionDoneMsg}</p>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleReportUser('Inappropriate behavior')}
                  className="w-full py-2.5 px-4 text-left rounded-xl border border-[#DDD7E5] hover:bg-[#FAF8FD] text-xs font-semibold text-[#1C1924] transition"
                >
                  Report Inappropriate Behavior
                </button>
                <button
                  type="button"
                  onClick={() => handleReportUser('Scam or financial solicitation')}
                  className="w-full py-2.5 px-4 text-left rounded-xl border border-[#DDD7E5] hover:bg-[#FAF8FD] text-xs font-semibold text-[#1C1924] transition"
                >
                  Report Scam or Financial Request
                </button>
                <button
                  type="button"
                  onClick={handleBlockUser}
                  className="w-full py-2.5 px-4 text-left rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition"
                >
                  Block This Member
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="w-full py-2 text-xs font-semibold text-[#756D82] hover:text-[#1C1924]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showUpgradeModal && <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />}
      {showRepModal && <ReputationModal isOpen={showRepModal} onClose={() => setShowRepModal(false)} name={targetInfo.name} score={targetInfo.rep} />}
    </div>
  );
}