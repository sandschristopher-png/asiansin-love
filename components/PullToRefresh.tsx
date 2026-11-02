'use client';

import React, { useState, useRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className = '' }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const activeTouchId = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    startY.current = 0;
    activeTouchId.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (refreshing) return;
    // Track one finger only; ignore extra touches
    if (activeTouchId.current !== null) return;
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      activeTouchId.current = e.touches[0].identifier;
      startY.current = e.touches[0].clientY;
    } else {
      startY.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeTouchId.current === null || refreshing) return;
    // Follow only the tracked finger
    const touch = Array.from(e.touches).find(t => t.identifier === activeTouchId.current);
    if (!touch) return;
    // Cancel the pull if the container scrolled away from the top mid-drag
    if (containerRef.current && containerRef.current.scrollTop > 0) {
      setPullY(0);
      reset();
      return;
    }
    const diff = touch.clientY - startY.current;
    if (diff > 0) {
      const damped = Math.min(diff * 0.4, 75);
      setPullY(damped);
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (activeTouchId.current === null) return;
    const touch = Array.from(e.changedTouches).find(t => t.identifier === activeTouchId.current);
    if (!touch) return; // a different finger lifted; keep tracking
    const triggered = pullY > 48 && !refreshing;
    reset();
    if (triggered) {
      setRefreshing(true);
      setPullY(48);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
  };

  const handleTouchCancel = () => {
    reset();
    setPullY(0);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className={`relative flex-1 overflow-y-auto overscroll-y-contain ${className}`}
    >
      {/* Elastic Spinner Indicator */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 flex items-center justify-center transition-transform duration-150 ease-out z-20"
        style={{
          transform: `translateY(${pullY - 40}px)`,
          opacity: pullY > 10 ? 1 : 0,
        }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-[#1C142B] shadow-md border border-[#6555B8]/20">
          <Loader2
            className={`h-4 w-4 text-[#6555B8] ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: refreshing ? undefined : `rotate(${pullY * 4}deg)` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          transform: pullY > 0 ? `translateY(${pullY}px)` : 'none',
          transition: refreshing || pullY === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
