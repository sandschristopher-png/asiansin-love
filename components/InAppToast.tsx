'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, MessageSquareHeart } from 'lucide-react';

export interface ToastData {
  id: string;
  senderName: string;
  avatarUrl: string;
  message: string;
  chatUrl: string;
}

export default function InAppToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const startY = useRef<number | null>(null);
  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);

  // Listen for incoming notifications
  useEffect(() => {
    const handleNotification = (e: CustomEvent<ToastData>) => {
      setToast(e.detail);
      setIsDismissing(false);
      setDragOffset(0);
    };

    window.addEventListener('ail-notification' as any, handleNotification);
    return () => window.removeEventListener('ail-notification' as any, handleNotification);
  }, []);

  // 5-second automatic dismiss
  useEffect(() => {
    if (!toast) return;

    if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);

    autoDismissTimer.current = setTimeout(() => {
      dismissToast();
    }, 5000);

    return () => {
      if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
    };
  }, [toast]);

  const dismissToast = () => {
    setIsDismissing(true);
    setTimeout(() => {
      setToast(null);
      setIsDismissing(false);
      setDragOffset(0);
    }, 280);
  };

  // Touch handlers for mobile swipe-up dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff < 0) {
      setDragOffset(diff); // Follow finger upwards
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset < -40) {
      dismissToast();
    } else {
      setDragOffset(0); // Snap back down if swipe threshold not met
    }
    startY.current = null;
  };

  if (!toast) return null;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${dragOffset}px)`,
        transition: dragOffset === 0 ? 'transform 0.25s ease-out, opacity 0.28s ease-out' : 'none'
      }}
      className={`fixed top-3 left-4 right-4 z-50 max-w-sm mx-auto select-none pointer-events-auto ${
        isDismissing ? 'opacity-0 -translate-y-6 pointer-events-none' : 'opacity-100 animate-slide-down'
      }`}
    >
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#241E2F]/95 backdrop-blur-xl border border-[#653C87]/70 shadow-2xl shadow-black/60">
        <Link
          href={toast.chatUrl}
          onClick={dismissToast}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#9A79BA] shrink-0 bg-[#17131F]">
            <Image
              src={toast.avatarUrl}
              alt={toast.senderName}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-[#E6D7FA] flex items-center gap-1.5 leading-tight">
              <MessageSquareHeart className="w-3.5 h-3.5 text-[#9A79BA] shrink-0" />
              {toast.senderName}
            </span>
            <p className="text-[11px] text-[#8e849c] truncate mt-0.5">
              {toast.message}
            </p>
          </div>
        </Link>

        <button
          onClick={dismissToast}
          className="p-1.5 rounded-full text-[#8e849c] hover:text-[#E6D7FA] transition shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Subtle indicator bar for swipe affordance */}
      <div className="w-8 h-1 bg-[#653C87]/40 rounded-full mx-auto mt-1.5" />
    </div>
  );
}