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
}

export interface MessageItem {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
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
  
  // Photo Browser States
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

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat_${targetUser.id}_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
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

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIndex((prev) => (prev + 1) % allPhotos.length);
  };

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col h-[calc(100vh-90px)] max-h-[820px]">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#725A7A]/25 shrink-0">
        <Link
          href="/messages"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#E6D7FA] hover:text-white transition-colors"
        >
          <span className="text-base font-bold">←</span> Back to All Messages
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-[#B8AAC3]">Verified Direct Connection</span>
        </div>
      </div>

      {/* Balanced 5:7 Proportional Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
        
        {/* Left Column: Easy-to-Read Profile Dossier & Photo Browser (5 cols) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between rounded-3xl bg-[#241e2f] border border-[#725A7A]/30 p-5 overflow-y-auto shadow-2xl">
          <div className="space-y-4">
            
            {/* Interactive Photo Stage with Click-to-Zoom */}
            <div className="space-y-2.5">
              <div 
                onClick={() => setIsLightboxOpen(true)}
                className="group relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#17131f] border border-[#725A7A]/30 shadow-inner cursor-zoom-in"
              >
                <img
                  src={allPhotos[activePhotoIndex]}
                  alt={targetUser.fullName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#17131f] via-transparent to-transparent opacity-80" />

                {/* Verification Pill */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                  {targetUser.isVerified && (
                    <span className="px-3 py-1 rounded-lg bg-[#653C87] border border-[#9A79BA] text-xs font-bold text-white shadow-lg">
                      ✓ Verified Profile
                    </span>
                  )}
                  {targetUser.trustPill && (
                    <span className="px-3 py-1 rounded-lg bg-amber-950 border border-amber-500 text-xs font-bold text-amber-300">
                      {targetUser.trustPill}
                    </span>
                  )}
                </div>

                {/* Photo Counter & Expand Button */}
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    🔍 {activePhotoIndex + 1} / {allPhotos.length}
                  </span>
                </div>

                {/* Prev / Next Arrows */}
                {allPhotos.length > 1 && (
                  <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                    <button
                      type="button"
                      onClick={handlePrevPhoto}
                      className="h-9 w-9 rounded-full bg-black/70 hover:bg-[#653C87] text-white flex items-center justify-center pointer-events-auto border border-white/20 transition-all active:scale-95 shadow-lg text-sm font-bold"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPhoto}
                      className="h-9 w-9 rounded-full bg-black/70 hover:bg-[#653C87] text-white flex items-center justify-center pointer-events-auto border border-white/20 transition-all active:scale-95 shadow-lg text-sm font-bold"
                    >
                      ›
                    </button>
                  </div>
                )}

                {/* Location Bar */}
                <div className="absolute bottom-3 left-3.5 right-3.5 pointer-events-none">
                  <p className="text-sm text-white font-semibold drop-shadow-md">
                    📍 {targetUser.city}, {targetUser.country}
                  </p>
                </div>
              </div>

              {/* Thumbnails Row */}
              {allPhotos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allPhotos.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative h-14 w-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        activePhotoIndex === idx
                          ? 'border-[#9A79BA] ring-2 ring-[#653C87]'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="h-14 px-3 rounded-xl bg-[#1d1827] border border-[#725A7A]/30 text-xs font-semibold text-[#E6D7FA] hover:text-white hover:bg-[#282136] shrink-0 transition-colors"
                  >
                    View Fullscreen
                  </button>
                </div>
              )}
            </div>

            {/* Profile Heading */}
            <div>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {targetUser.fullName}, <span className="text-[#D1B8E8] font-normal">{targetUser.age}</span>
                </h2>
                <Link
                  href={`/profile/${targetUser.id}`}
                  className="text-xs font-semibold text-[#B8AAC3] hover:text-white underline"
                >
                  View Full Bio
                </Link>
              </div>
              {targetUser.jobTitle && (
                <p className="text-sm font-medium text-[#E6D7FA] mt-0.5">{targetUser.jobTitle}</p>
              )}
            </div>

            {/* Courtship Goal Box */}
            <div className="p-3.5 rounded-2xl bg-[#1d1827] border border-[#725A7A]/30">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D1B8E8] block mb-1">
                Relationship Goal
              </span>
              <p className="text-sm font-semibold text-white">{targetUser.relationshipIntent}</p>
            </div>

            {/* Languages */}
            {targetUser.languages && targetUser.languages.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D1B8E8] block mb-1.5">
                  Languages Spoken
                </span>
                <div className="flex flex-wrap gap-2">
                  {targetUser.languages.map((lang) => (
                    <span key={lang} className="px-3 py-1 rounded-lg bg-[#1d1827] border border-[#725A7A]/30 text-xs font-medium text-white">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio Preview */}
            {targetUser.bio && (
              <div className="p-3.5 rounded-2xl bg-[#1d1827]/60 border border-[#725A7A]/20">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D1B8E8] block mb-1">
                  About Her
                </span>
                <p className="text-sm text-[#F3EBF9] leading-relaxed line-clamp-4 font-normal">
                  {targetUser.bio}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowReviewModal(true)}
            className="w-full mt-4 py-3 rounded-xl bg-[#1d1827] hover:bg-[#282136] border border-[#725A7A]/30 text-xs font-bold text-white transition-colors"
          >
            Leave Private Feedback
          </button>
        </div>

        {/* Right Column: High-Legibility Chat Canvas (7 cols) */}
        <div className="col-span-1 lg:col-span-7 flex flex-col rounded-3xl bg-[#241e2f] border border-[#725A7A]/30 shadow-2xl overflow-hidden min-h-0">
          
          {/* Active Person Header */}
          <div className="px-5 py-3.5 bg-[#1d1827] border-b border-[#725A7A]/25 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="relative h-11 w-11 rounded-full overflow-hidden bg-[#17131f] border border-[#725A7A]/40 shrink-0 hover:ring-2 hover:ring-[#9A79BA] transition-all"
                title="Tap to view photos"
              >
                <img
                  src={targetUser.avatarUrl || '/logo-mark.png'}
                  alt={targetUser.fullName}
                  className="h-full w-full object-cover"
                />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-white">{targetUser.fullName}</h3>
                  {targetUser.isVerified && (
                    <span className="px-2 py-0.5 rounded-md bg-[#653C87] text-white text-[11px] font-bold">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#D1B8E8] font-medium">
                  {targetUser.city}, {targetUser.country}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#17131f] border border-[#725A7A]/30 hover:bg-[#282136] text-xs font-semibold text-[#E6D7FA] transition-colors"
              >
                📷 Photos ({allPhotos.length})
              </button>

              <button
                type="button"
                onClick={() => setShowMobileBio(!showMobileBio)}
                className="lg:hidden px-3 py-1.5 rounded-lg bg-[#653C87] text-white text-xs font-bold"
              >
                {showMobileBio ? 'Close Bio' : 'Profile'}
              </button>
            </div>
          </div>

          {/* Mobile Profile Dropdown */}
          {showMobileBio && (
            <div className="lg:hidden p-4 bg-[#1d1827] border-b border-[#725A7A]/30 text-sm space-y-2.5 shrink-0 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#D1B8E8]">{targetUser.relationshipIntent}</span>
                <Link href={`/profile/${targetUser.id}`} className="text-xs text-white underline font-semibold">
                  Full Page Bio
                </Link>
              </div>
              <p className="text-xs text-[#F3EBF9] leading-relaxed">{targetUser.bio || 'No bio written yet.'}</p>
            </div>
          )}

          {/* High-Visibility Safety Notice */}
          <div className="px-5 py-2.5 bg-[#17131f]/90 border-b border-[#725A7A]/20 flex items-center justify-between text-xs text-[#E6D7FA] shrink-0">
            <span>
              <strong className="text-white font-bold">Safety Rule:</strong> Never send money, allowances, or gifts. Report any requests.
            </span>
          </div>

          {/* Message Thread Scroll Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3.5 min-h-0">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2.5">
                <div className="h-12 w-12 rounded-full bg-[#1d1827] border border-[#725A7A]/40 flex items-center justify-center text-xl text-[#B8AAC3]">
                  💌
                </div>
                <div>
                  <p className="text-base text-white font-bold">Start your conversation with {targetUser.fullName}</p>
                  <p className="text-xs text-[#D1B8E8] max-w-sm mt-1 leading-relaxed">
                    Say hello! Genuine cross-border romance begins with honest, respectful conversation.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender_id === currentUserId;
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[78%] px-4 py-3 rounded-2xl text-[14px] sm:text-[15px] leading-relaxed ${
                        isMe
                          ? 'bg-[#653C87] text-white rounded-br-none shadow-md shadow-[#41384E]/40 font-medium'
                          : 'bg-[#1d1827] border border-[#725A7A]/30 text-white rounded-bl-none font-normal'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <span className={`text-[10px] mt-1.5 block text-right font-mono font-medium ${isMe ? 'text-[#F3EBF9]' : 'text-[#D1B8E8]'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Inline Moderation Error Banner */}
          {errorMessage && (
            <div className="px-5 py-3 bg-rose-950 border-t border-rose-500 text-rose-200 text-xs font-semibold flex items-center justify-between shrink-0">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="text-xs underline ml-3 text-white font-bold">
                Dismiss
              </button>
            </div>
          )}

          {/* Bottom Send Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-[#725A7A]/25 bg-[#1d1827] flex gap-3 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Write a message to ${targetUser.fullName}...`}
              disabled={isSending}
              className="flex-1 px-4 py-3 rounded-xl bg-[#17131f] border border-[#725A7A]/30 text-sm sm:text-base text-white placeholder-[#A8A2AB] focus:outline-none focus:border-[#9A79BA] transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="px-6 py-3 rounded-xl bg-[#653C87] hover:bg-[#7a49a2] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-[#41384E]/50 transition-all active:scale-[0.98]"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </form>

        </div>

      </div>

      {/* FULLSCREEN PHOTO LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            className="relative max-w-3xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between py-2 text-white mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">{targetUser.fullName}</span>
                <span className="text-xs text-[#B8AAC3] font-mono">
                  ({activePhotoIndex + 1} of {allPhotos.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#241e2f] border border-[#725A7A]/40 text-sm font-bold text-white hover:bg-[#653C87] transition-colors"
              >
                ✕ Close (Esc)
              </button>
            </div>

            {/* Main Stage Photo */}
            <div className="relative w-full max-h-[70vh] aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-[#725A7A]/30 flex items-center justify-center shadow-2xl">
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/75 hover:bg-[#653C87] text-white text-2xl font-bold flex items-center justify-center border border-white/20 transition-all active:scale-95 shadow-2xl"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/75 hover:bg-[#653C87] text-white text-2xl font-bold flex items-center justify-center border border-white/20 transition-all active:scale-95 shadow-2xl"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Bottom Thumbnail Strip */}
            {allPhotos.length > 1 && (
              <div className="flex gap-2.5 mt-4 overflow-x-auto max-w-full pb-2">
                {allPhotos.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative h-16 w-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activePhotoIndex === idx
                        ? 'border-[#9A79BA] ring-2 ring-[#653C87] scale-105'
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
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
          alert('Thank you. Your feedback helps safeguard the community.');
        }}
      />

    </div>
  );
}
