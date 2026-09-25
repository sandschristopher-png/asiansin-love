'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { DUMMY_PROFILES } from '@/lib/dummyProfiles';

export default function ChatConversationPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const profile = DUMMY_PROFILES.find((p) => p.id === userId) || DUMMY_PROFILES[0];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'them',
      text: 'Good morning! Thank you for the warm message. How was your weekend?',
      time: '9:30 AM',
    },
    {
      id: '2',
      sender: 'me',
      text: 'Good morning Camille. Weekend was quiet, enjoyed relaxing. How was your week?',
      time: '9:35 AM',
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'me',
        text: inputMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputMessage('');
  };

  return (
    <div className="fixed inset-0 top-16 z-40 bg-[#17131F] flex flex-col justify-between max-w-3xl mx-auto w-full border-x border-[#725A7A]/20">
      
      {/* Thread Header */}
      <div className="px-4 py-3 bg-[#241E2F] border-b border-[#725A7A]/35 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-8 w-8 rounded-full bg-[#17131F] border border-[#725A7A]/35 text-white flex items-center justify-center text-sm active:scale-90 transition-transform"
            aria-label="Back"
          >
            ←
          </button>
          
          <div className="relative h-10 w-10 rounded-full overflow-hidden border border-[#978FA8]/40">
            <Image
              src={profile.avatarUrl}
              alt={profile.fullName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-extrabold text-white">
                {profile.fullName}, {profile.age}
              </h2>
              {profile.isVerified && (
                <span className="text-[10px] font-bold text-white bg-[#653C87] px-1.5 py-0.2 rounded">
                  ✓
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#DDD8D4] flex items-center gap-1 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {profile.city} • Online
            </p>
          </div>
        </div>

        <Link
          href={`/profile/${profile.id}`}
          className="px-3 py-1.5 rounded-xl bg-[#17131F] border border-[#725A7A]/40 text-xs font-bold text-[#DDD8D4] hover:text-white active:scale-95 transition-all"
        >
          View Bio
        </Link>
      </div>

      {/* Message History Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-thin">
        {messages.map((msg) => {
          const isMe = msg.sender === 'me';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[82%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed font-medium shadow-md ${
                  isMe
                    ? 'bg-[#653C87] text-white rounded-br-sm'
                    : 'bg-[#241E2F] border border-[#725A7A]/30 text-[#F3EBF9] rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-[#725A7A] mt-1 px-1 font-semibold">
                {msg.time}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Input Bar */}
      <div className="p-3 sm:p-4 bg-[#241E2F] border-t border-[#725A7A]/35 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a polite and sincere message..."
            className="flex-1 px-4 py-3.5 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white placeholder-[#725A7A] text-base sm:text-sm focus:outline-none focus:border-[#978FA8]"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-5 py-3.5 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] disabled:opacity-40 text-white font-extrabold text-sm active:scale-95 transition-all shadow-md"
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
}