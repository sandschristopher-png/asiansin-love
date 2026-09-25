'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Send, Zap, ShieldAlert, CheckCheck, Clock } from 'lucide-react';

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
  const isForeignUser = true; 
  const freeMessageLimit = 5;

  const [messages, setMessages] = useState<Array<{ id: string; sender: 'me' | 'them'; text: string; time: string }>>([
    {
      id: '1',
      sender: 'them',
      text: 'Hi there! Nice to meet you. Loved your bio about traveling across Asia.',
      time: '1:15 PM'
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [sentCount, setSentCount] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || cooldownSeconds > 0) return;

    const { sanitized, wasMasked } = sanitizeMessage(inputText.trim());
    if (wasMasked) setShowSafetyNotice(true);

    const newMsg = {
      id: Date.now().toString(),
      sender: 'me' as const,
      text: sanitized,
      time: 'Just now'
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    if (isForeignUser) {
      const nextCount = sentCount + 1;
      setSentCount(nextCount);
      if (nextCount >= freeMessageLimit) {
        setCooldownSeconds(300);
      }
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <main className="min-h-screen bg-[#15101C] text-[#E6D7FA] flex flex-col justify-between">
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#15101C]/90 backdrop-blur-md border-b border-[#241E2F]">
        <div className="flex items-center gap-3">
          <Link href="/discover" className="text-[#9A79BA] hover:text-[#E6D7FA] transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#653C87]">
            <Image src="/dummy-1.jpg" alt="Camille" fill className="object-cover object-[50%_20%]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#E6D7FA] leading-tight">Camille</span>
            <span className="text-[10px] text-emerald-400 font-medium">Active now</span>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-[#241E2F] border border-[#653C87]/50 text-[10px] font-semibold text-[#E6D7FA]">
          98% Rep
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-md mx-auto w-full">
        {showSafetyNotice && (
          <div className="p-3 rounded-2xl bg-[#241E2F]/80 border border-amber-500/40 text-[11px] text-amber-200 flex items-start gap-2 shadow-md">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Courtship Safety: External contact handles and phone digits are masked during initial intros to prevent unverified off-platform spam.
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                msg.sender === 'me'
                  ? 'bg-[#653C87] text-[#E6D7FA] rounded-br-xs'
                  : 'bg-[#241E2F] text-[#E6D7FA] border border-[#241E2F] rounded-bl-xs'
              }`}
            >
              {msg.text}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[9px] text-[#7D7E92]">
              <span>{msg.time}</span>
              {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-[#9A79BA]" />}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="sticky bottom-0 z-30 bg-[#15101C]/95 backdrop-blur-md border-t border-[#241E2F] p-3 max-w-md mx-auto w-full">
        {cooldownSeconds > 0 ? (
          <div className="p-4 rounded-2xl bg-[#241E2F] border border-[#653C87]/60 flex flex-col items-center gap-2.5 shadow-xl text-center">
            <div className="flex items-center gap-1.5 text-xs text-[#9A79BA]">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Next free message unlocks in</span>
            </div>
            <span className="text-2xl font-bold tracking-wider text-[#E6D7FA]">
              {formatTimer(cooldownSeconds)}
            </span>
            <button
              onClick={() => alert('Opens AIL Club Membership Upgrade Modal')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-gradient-to-r from-[#653C87] to-[#9A79BA] text-[#15101C] font-bold text-xs shadow-lg hover:opacity-95 transition"
            >
              <Zap className="w-4 h-4 fill-current" />
              Skip the Wait — Unlock Instant Chat
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Write a sincere message..."
              className="flex-1 bg-[#241E2F] border border-[#241E2F] focus:border-[#653C87] rounded-full px-4 py-2.5 text-xs text-[#E6D7FA] placeholder-[#7D7E92] outline-none transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-full bg-[#653C87] text-[#E6D7FA] disabled:opacity-40 hover:bg-[#9A79BA] hover:text-[#15101C] transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </main>
  );
}