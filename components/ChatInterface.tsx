'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { InteractionReviewModal } from './InteractionReviewModal';
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
  content: string;
  created_at: string;
  read?: boolean;
}
interface ChatInterfaceProps {
  currentUserId: string;
  targetUser: TargetUserProfile;
  initialMessages?: MessageItem[];
}
export function ChatInterface({ currentUserId, targetUser, initialMessages = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMobileBio, setShowMobileBio] = useState(false);
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const allPhotos = [targetUser.avatarUrl, ...(targetUser.galleryUrls || [])].filter(Boolean);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(() => {
    async function markAsRead() {
      if (!currentUserId || currentUserId.startsWith('00000000')) return;
      const unreadIds = messages
        .filter((m) => m.sender_id === targetUser.id && m.receiver_id === currentUserId && !m.read)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadIds);
      }
    }
    markAsRead();
  }, [messages, currentUserId, targetUser.id]);
  useEffect(() => {
    const channel = supabase
      .channel(`chat_${targetUser.id}_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as MessageItem;
            const isRelevant =
              (newMsg.sender_id === currentUserId && newMsg.receiver_id === targetUser.id) ||
              (newMsg.sender_id === targetUser.id && newMsg.receiver_id === currentUserId);
            if (isRelevant) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as MessageItem;
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
            );
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, targetUser.id]);
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = input.trim();
    if (!cleanContent || isSending) return;
    setIsSending(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: targetUser.id,
          content: cleanContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Message could not be sent.');
      } else {
        setInput('');
        if (data.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
      }
    } catch {
      setErrorMessage('Network transmission error.');
    } finally {
      setIsSending(false);
    }
  };
  const handleQuickReport = async (category: string, penalty: number, label: string) => {
    setShowSafetyMenu(false);
    if (!confirm(`Are you sure you want to log this report: "${label}"? This will be added to community moderation logs.`)) {
      return;
    }
    try {
      const { error } = await supabase.from('reputation_reports').insert({
        reporter_id: currentUserId,
        target_user_id: targetUser.id,
        violation_category: category,
        penalty_points: penalty,
        notes: `Direct chat report: ${label}`,
      });
      if (error) {
        setErrorMessage('Unable to log incident.');
      } else {
        setFeedbackSuccess(`Incident recorded: ${label}.`);
        setTimeout(() => setFeedbackSuccess(null), 5000);
      }
    } catch {
      setErrorMessage('Network error submitting report.');
    }
  };
  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIndex((prev) => (prev + 1) % allPhotos.length);
  };
  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };
  const rep = targetUser.reputationScore ?? 100;
  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-6 py-2 sm:py-4 flex flex-col h-[calc(100dvh-64px)] max-h-[960px]">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 pb-2 border-b border-[#7D7E92]/25 shrink-0 px-1 sm:px-0">
        <Link
          href="/messages"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#ECE8F4] hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Messages</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#241E2F] border border-[#7D7E92]/30 text-xs font-bold text-[#ECE8F4]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>{rep}% Rep</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-[#B6AEC7] hidden sm:inline">Active</span>
          </div>
        </div>
      </div>
      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 flex-1 min-h-0 overflow-hidden relative">
        
        {/* Left Column: Desktop Profile Dossier */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between rounded-3xl bg-[#241E2F] border border-[#7D7E92]/30 p-5 overflow-y-auto shadow-2xl">
          <div className="space-y-4">
            
            {/* Interactive Photo Stage */}
            <div className="space-y-2.5">
              <div 
                onClick={() => setIsLightboxOpen(true)}
                className="group relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#17131F] border border-[#7D7E92]/30 shadow-inner cursor-zoom-in"
              >
                <img
                  src={allPhotos[activePhotoIndex]}
                  alt={targetUser.fullName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#17131F] via-transparent to-transparent opacity-80" />
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                  {targetUser.isVerified && (
                    <span className="px-3 py-1 rounded-lg bg-[#653C87] border border-[#9A79BA] text-xs font-bold text-white shadow-lg">
                      Verified Profile
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-lg bg-[#17131F]/90 border border-[#7D7E92]/40 text-xs font-bold text-[#ECE8F4]">
                    {rep}% Reputation
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-xs font-mono font-bold text-white">
                    {activePhotoIndex + 1} / {allPhotos.length}
                  </span>
                </div>
                {allPhotos.length > 1 && (
                  <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                    <button
                      type="button"
                      onClick={handlePrevPhoto}
                      className="h-9 w-9 rounded-full bg-black/70 hover:bg-[#653C87] text-white flex items-center justify-center pointer-events-auto border border-white/20 transition-all active:scale-95 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPhoto}
                      className="h-9 w-9 rounded-full bg-black/70 hover:bg-[#653C87] text-white flex items-center justify-center pointer-events-auto border border-white/20 transition-all active:scale-95 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="absolute bottom-3 left-3.5 right-3.5 pointer-events-none">
                  <p className="text-sm text-white font-semibold drop-shadow-md">
                    {targetUser.city}, {targetUser.country}
                  </p>
                </div>
              </div>
              {allPhotos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allPhotos.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative h-14 w-14 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                        activePhotoIndex === idx
                          ? 'border-[#9A79BA] ring-2 ring-[#653C87]'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Profile Info */}
            <div>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {targetUser.fullName}, <span className="text-[#9A79BA] font-normal">{targetUser.age}</span>
                </h2>
                <Link
                  href={`/profile/${targetUser.id}`}
                  className="text-xs font-semibold text-[#B6AEC7] hover:text-white underline"
                >
                  Full Bio
                </Link>
              </div>
              {targetUser.jobTitle && (
                <p className="text-sm font-medium text-[#ECE8F4] mt-0.5">{targetUser.jobTitle}</p>
              )}
            </div>
            {/* Courtship & Dependents */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-[#17131F] border border-[#7D7E92]/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A79BA] block mb-0.5">
                  Courtship Goal
                </span>
                <p className="text-xs font-semibold text-white truncate">{targetUser.relationshipIntent}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#17131F] border border-[#7D7E92]/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A79BA] block mb-0.5">
                  Family Status
                </span>
                <p className="text-xs font-semibold text-[#ECE8F4] truncate">
                  {targetUser.childrenStatus || 'No Dependents'}
                </p>
              </div>
            </div>
            {targetUser.bio && (
              <div className="p-3.5 rounded-2xl bg-[#17131F]/60 border border-[#7D7E92]/20">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9A79BA] block mb-1">
                  About
                </span>
                <p className="text-xs text-[#ECE8F4] leading-relaxed line-clamp-3 font-normal">
                  {targetUser.bio}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowReviewModal(true)}
            className="w-full mt-4 py-3 rounded-2xl bg-[#17131F] hover:bg-[#3B1E42] border border-[#7D7E92]/30 text-xs font-bold text-white transition-colors"
          >
            Leave Courtship Feedback
          </button>
        </div>
        {/* Right Column: Chat Feed & Controls */}
        <div className="col-span-1 lg:col-span-7 flex flex-col rounded-2xl sm:rounded-3xl bg-[#241E2F] border border-[#7D7E92]/30 shadow-2xl overflow-hidden min-h-0">
          
          {/* Active Person Header */}
          <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 bg-[#17131F] border-b border-[#7D7E92]/25 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowMobileBio(true)}
                className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-2xl overflow-hidden bg-[#241E2F] border border-[#7D7E92]/40 shrink-0 hover:ring-2 hover:ring-[#9A79BA] transition-all"
                title="Tap to view bio"
              >
                <img
                  src={targetUser.avatarUrl || '/logo-mark.png'}
                  alt={targetUser.fullName}
                  className="h-full w-full object-cover"
                />
              </button>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-white">{targetUser.fullName}</h3>
                  {targetUser.isVerified && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#653C87] text-white text-[10px] font-bold">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#B6AEC7] font-medium">
                  {targetUser.city}, {targetUser.country}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 relative">
              <button
                type="button"
                onClick={() => setShowSafetyMenu(!showSafetyMenu)}
                className="px-2.5 py-1.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/40 text-xs font-bold text-amber-300 hover:bg-amber-950/40 transition-colors"
              >
                Flag
              </button>
              {/* 1-Tap Safety Menu */}
              {showSafetyMenu && (
                <div className="absolute right-0 top-10 z-30 w-64 rounded-2xl bg-[#17131F] border border-[#7D7E92]/40 shadow-2xl p-2 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A79BA] px-2 py-1">
                    Reputation Incident Flags
                  </p>
                  <button
                    onClick={() => handleQuickReport('sexual_solicitation', 50, 'Sexual Solicitation / Inappropriate')}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/50 transition-colors"
                  >
                    Inappropriate / Sexual Favors (-50 Rep)
                  </button>
                  <button
                    onClick={() => handleQuickReport('financial_solicitation', 40, 'Money / Financial Solicitation')}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-950/50 transition-colors"
                  >
                    Requested Money / Wire (-40 Rep)
                  </button>
                  <button
                    onClick={() => handleQuickReport('undisclosed_dependents', 35, 'Undisclosed Children')}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-[#ECE8F4] hover:bg-[#241E2F] transition-colors"
                  >
                    Undisclosed Children (-35 Rep)
                  </button>
                  <button
                    onClick={() => handleQuickReport('undisclosed_marriage', 40, 'Hidden Marriage / Partner')}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-[#ECE8F4] hover:bg-[#241E2F] transition-colors"
                  >
                    Married / Has Domestic Partner (-40 Rep)
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#241E2F] border border-[#7D7E92]/30 hover:bg-[#653C87] text-[11px] sm:text-xs font-semibold text-[#ECE8F4] transition-colors"
              >
                Photos ({allPhotos.length})
              </button>
              <button
                type="button"
                onClick={() => setShowMobileBio(!showMobileBio)}
                className="lg:hidden px-2.5 py-1.5 rounded-xl bg-[#653C87] hover:bg-[#9A79BA] text-white text-[11px] font-bold transition-all"
              >
                {showMobileBio ? 'Chat' : 'Bio'}
              </button>
            </div>
          </div>
          {/* Safety Rule Banner */}
          <div className="px-3.5 sm:px-5 py-2 bg-[#17131F]/90 border-b border-[#7D7E92]/20 flex items-center justify-between text-[11px] text-[#ECE8F4] shrink-0">
            <span>
              <strong className="text-white font-bold">Safeguard:</strong> Never send financial wires or allowances.
            </span>
          </div>
          {/* Feedback Success Notification */}
          {feedbackSuccess && (
            <div className="px-4 py-2 bg-emerald-950 border-b border-emerald-500 text-emerald-200 text-xs font-semibold shrink-0">
              {feedbackSuccess}
            </div>
          )}
          {/* Message Thread Area */}
          <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="h-10 w-10 rounded-2xl bg-[#17131F] border border-[#7D7E92]/40 flex items-center justify-center text-xs font-bold text-[#9A79BA]">
                  <svg className="w-5 h-5 text-[#9A79BA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm sm:text-base text-white font-bold">Start your conversation with {targetUser.fullName}</p>
                  <p className="text-xs text-[#B6AEC7] max-w-sm mt-1 leading-relaxed">
                    Say hello. Sincere courtship begins with honest communication.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender_id === currentUserId;
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-[#9A79BA]/30 bg-[#261F33] mb-1">
                        <img 
                          src={targetUser.avatarUrl || '/dummy-1.jpg'} 
                          alt={targetUser.fullName} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[78%] px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-[13px] sm:text-[14px] leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-[#653C87] text-white rounded-br-none font-medium'
                          : 'bg-[#55445E] border border-[#7D7E92]/40 text-[#ECE8F4] rounded-bl-none font-normal'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      
                      <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] font-mono">
                        <span className={isMe ? 'text-[#ECE8F4]/80' : 'text-[#D5CEE5]'}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <span
                            className="inline-flex items-center"
                            title={m.read ? 'Read' : 'Delivered'}
                          >
                            {m.read ? (
                              <svg className="w-3.5 h-3.5 text-[#ECE8F4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7M11 13l2 2 6-6" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Composer Bar (16px base text preventing iOS auto-zoom) */}
          <form 
            onSubmit={handleSendMessage} 
            className="p-2 sm:p-3.5 border-t border-[#7D7E92]/25 bg-[#17131F] flex items-center gap-2 sm:gap-3 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write a sincere message..."
              disabled={isSending}
              className="flex-1 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#241E2F] border border-[#7D7E92]/30 text-base sm:text-sm text-white placeholder-[#7D7E92] focus:outline-none focus:border-[#9A79BA] transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#653C87] hover:bg-[#9A79BA] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 shrink-0"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
      {/* MOBILE BIO SLIDEOVER DRAWER */}
      {showMobileBio && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end"
          onClick={() => setShowMobileBio(false)}
        >
          <div 
            className="w-full max-w-sm h-full bg-[#241E2F] border-l border-[#7D7E92]/30 p-5 overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#7D7E92]/20 pb-3">
              <h2 className="text-lg font-bold text-white">Member Dossier</h2>
              <button
                onClick={() => setShowMobileBio(false)}
                className="px-3 py-1 rounded-xl bg-[#17131F] text-xs font-bold text-[#ECE8F4]"
              >
                Close
              </button>
            </div>
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-[#7D7E92]/30">
              <img src={targetUser.avatarUrl} alt={targetUser.fullName} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{targetUser.fullName}, {targetUser.age}</h3>
              <p className="text-xs text-[#B6AEC7]">{targetUser.city}, {targetUser.country}</p>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-xs">
                <span className="text-[10px] font-bold uppercase text-[#9A79BA] block">Courtship Goal</span>
                <span className="font-semibold text-white">{targetUser.relationshipIntent}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-xs">
                <span className="text-[10px] font-bold uppercase text-[#9A79BA] block">Family Transparency</span>
                <span className="font-semibold text-[#ECE8F4]">{targetUser.childrenStatus || 'No Dependents'}</span>
              </div>
            </div>
            {targetUser.bio && (
              <div className="p-3.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/20 text-xs text-[#ECE8F4] leading-relaxed">
                {targetUser.bio}
              </div>
            )}
          </div>
        </div>
      )}
      {/* FULLSCREEN PHOTO LIGHTBOX */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-md"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            className="relative max-w-3xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between py-2 text-white mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base">{targetUser.fullName}</span>
                <span className="text-xs text-[#9A79BA] font-mono">
                  ({activePhotoIndex + 1} of {allPhotos.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="px-3 sm:px-4 py-1.5 rounded-xl bg-[#241E2F] border border-[#7D7E92]/40 text-xs sm:text-sm font-bold text-white hover:bg-[#653C87] transition-colors"
              >
                Close
              </button>
            </div>
            <div className="relative w-full max-h-[70vh] aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-[#7D7E92]/30 flex items-center justify-center shadow-2xl">
              <img
                src={allPhotos[activePhotoIndex]}
                alt={`${targetUser.fullName} photo ${activePhotoIndex + 1}`}
                className="w-full h-full object-contain"
              />
              {allPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/75 hover:bg-[#653C87] text-white flex items-center justify-center border border-white/20 transition-all active:scale-95 shadow-2xl"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/75 hover:bg-[#653C87] text-white flex items-center justify-center border border-white/20 transition-all active:scale-95 shadow-2xl"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <InteractionReviewModal
        isOpen={showReviewModal}
        reviewerId={currentUserId}
        targetUserId={targetUser.id}
        targetUserName={targetUser.fullName}
        onClose={() => setShowReviewModal(false)}
        onSuccess={() => {
          setFeedbackSuccess('Feedback recorded. Thank you for safeguarding the community.');
          setTimeout(() => setFeedbackSuccess(null), 5000);
        }}
      />
    </div>
  );
}
export default ChatInterface;
