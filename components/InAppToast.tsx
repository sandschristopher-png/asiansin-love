'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, MessageSquareHeart } from 'lucide-react';

interface ToastData {
  id: string;
  senderName: string;
  avatarUrl: string;
  message: string;
  chatUrl: string;
}

export default function InAppToast() {
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    // Listen for custom trigger or incoming WebSocket / SSE events
    const handleNotification = (e: CustomEvent<ToastData>) => {
      setToast(e.detail);
    };

    window.addEventListener('ail-notification' as any, handleNotification);
    return () => window.removeEventListener('ail-notification' as any, handleNotification);
  }, []);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="fixed top-4 left-4 right-4 max-w-sm mx-auto z-50 animate-bounce-in">
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#241E2F]/95 backdrop-blur-xl border border-[#653C87]/60 shadow-2xl">
        <Link href={toast.chatUrl} onClick={() => setToast(null)} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#9A79BA] shrink-0">
            <Image src={toast.avatarUrl} alt={toast.senderName} fill className="object-cover object-[50%_20%]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-[#E6D7FA] flex items-center gap-1.5">
              <MessageSquareHeart className="w-3.5 h-3.5 text-[#9A79BA]" />
              {toast.senderName}
            </span>
            <p className="text-[11px] text-[#7D7E92] truncate">
              {toast.message}
            </p>
          </div>
        </Link>
        <button
          onClick={() => setToast(null)}
          className="p-1 rounded-full text-[#7D7E92] hover:text-[#E6D7FA] transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}