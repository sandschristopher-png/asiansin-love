'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ChatPageProps {
  params: Promise<{ userId: string }>;
}

export default function ChatScreen(props: ChatPageProps) {
  const [inputText, setInputText] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'Camille',
      text: 'Good morning! Thank you for the warm message. How was your weekend in the States?',
      timestamp: '9:30 AM',
      isMe: false,
    },
    {
      id: '2',
      sender: 'Me',
      text: 'Good morning Camille. Weekend was quiet, enjoyed relaxing. How was your week?',
      timestamp: '9:35 AM',
      isMe: true,
    },
  ]);

  const FINANCIAL_KEYWORDS = [
    'gcash', 'money', 'western union', 'crypto', 'remit', 'allowance',
    'hospital bill', 'send cash', 'wire money', 'emergency fund', 'gift card'
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const lower = inputText.toLowerCase();
    const flagged = FINANCIAL_KEYWORDS.some((word) => lower.includes(word));

    if (flagged) {
      setWarning(
        'Platform Safety Advisory: asiansin.love strictly prohibits financial requests, remittances, or gifts. Genuine courtship is built on mutual respect and transparent conversation, not money transfers.'
      );
      return;
    }

    setWarning(null);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'Me',
        text: inputText.trim(),
        timestamp: 'Just now',
        isMe: true,
      },
    ]);
    setInputText('');
  };

  return (
    <main className="max-w-4xl mx-auto w-full px-3 sm:px-6 py-4 flex-1 flex flex-col">
      <div className="p-3 sm:p-4 rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 shadow-md flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="h-8 w-8 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-[#DDD8D4] hover:text-white flex items-center justify-center text-sm font-bold"
          >
            ←
          </Link>
          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-[#17131F] shrink-0 border border-[#725A7A]/40">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop"
              alt="Camille"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-white">Camille, 26</h2>
              <span className="px-1.5 py-0.2 rounded-md bg-[#653C87] text-white text-[10px] font-bold">
                ✓ Verified
              </span>
            </div>
            <p className="text-[11px] text-[#DDD8D4]">📍 Makati, Philippines • Online</p>
          </div>
        </div>

        <Link
          href="/profile/demo-1"
          className="px-3 py-1.5 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-xs font-bold text-[#DDD8D4] hover:text-white transition-colors"
        >
          View Bio
        </Link>
      </div>

      <div className="flex-1 rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 p-4 overflow-y-auto space-y-3 min-h-[360px]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                m.isMe
                  ? 'bg-[#653C87] text-white rounded-br-xs'
                  : 'bg-[#17131F] text-[#F3EBF9] border border-[#725A7A]/30 rounded-bl-xs'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[10px] text-[#978FA8] mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}
      </div>

      {warning && (
        <div className="mt-3 p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs leading-relaxed animate-in fade-in flex items-start justify-between gap-3">
          <div>
            <p className="font-bold mb-0.5">⚠️ Security Warning</p>
            <p>{warning}</p>
          </div>
          <button
            type="button"
            onClick={() => setWarning(null)}
            className="text-white hover:text-rose-200 font-bold px-2 py-1 bg-rose-900 rounded-lg text-[10px]"
          >
            Acknowledge
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a polite and sincere message..."
          className="flex-1 px-4 py-3 rounded-xl bg-[#241E2F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8]"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-5 py-3 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md transition-all active:scale-[0.98]"
        >
          Send
        </button>
      </form>
    </main>
  );
}
