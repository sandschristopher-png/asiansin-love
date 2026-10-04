'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'account' | 'app' | 'alerts' | 'privacy' | 'reports'>('account');
  const [username, setUsername] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Drag-to-scroll refs & state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [draggedDistance, setDraggedDistance] = useState(0);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setInitialLoading(false);
          return;
        }

        setUserId(session.user.id);

        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();

        if (!error && data?.username) {
          setUsername(data.username);
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
      } finally {
        setInitialLoading(false);
      }
    }

    loadUserProfile();
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDraggedDistance(0);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftState - walk;
    setDraggedDistance(Math.abs(walk));
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleSaveHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSavedSuccess(false);

    if (!userId) {
      setErrorMessage('You must be signed in to update your handle.');
      return;
    }

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setErrorMessage('Username cannot be empty.');
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 24) {
      setErrorMessage('Username must be between 3 and 24 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
      setErrorMessage('Only letters, numbers, underscores, and periods are allowed.');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: cleanUsername })
        .eq('id', userId);

      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
          setErrorMessage('That username handle is already taken. Please pick another.');
        } else {
          setErrorMessage(error.message || 'Failed to update username handle.');
        }
        return;
      }

      setUsername(cleanUsername);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = ([
    { key: 'account', label: 'All orders' },
    { key: 'account', label: 'Account' },
    { key: 'app', label: 'Preferences' },
    { key: 'alerts', label: 'Alerts' },
    { key: 'privacy', label: 'Privacy' },
    { key: 'reports', label: 'Reports' },
  ] as const).filter((t, i, arr) => arr.findIndex(x => x.label === t.label) === i);

  return (
    <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-1.5 pb-20 space-y-3">
      {/* Native App-Style Category Filter Bar */}
      <div className="border-b border-[#EBE8F2] pb-2 -mx-4 px-4 bg-white/60">
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {[
            { key: 'account', label: 'Account' },
            { key: 'app', label: 'App' },
            { key: 'alerts', label: 'Alerts' },
            { key: 'privacy', label: 'Privacy' },
            { key: 'reports', label: 'Reports' },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  if (draggedDistance < 5) {
                    setActiveTab(tab.key as any);
                  }
                }}
                className={`shrink-0 px-3.5 py-1 text-xs font-semibold rounded-full transition-all whitespace-nowrap active:scale-95 ${
                  active
                    ? 'bg-[#1C1924] text-white shadow-xs'
                    : 'bg-[#F2EEF7] text-[#524B5E] hover:bg-[#E9E4F0] hover:text-[#1C1924]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border border-[#DDD7E5]/70 p-4 sm:p-5 shadow-xs space-y-5">
        {activeTab === 'account' && (
          <div className="space-y-5">
            <form onSubmit={handleSaveHandle} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#524B5E]">
                  Username Handle
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm text-[#8C849B]">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    disabled={initialLoading || isSaving}
                    className="w-full pl-7 pr-20 py-2 bg-white border border-[#DDD7E5] rounded-xl text-sm font-semibold text-[#1C1924] focus:outline-none focus:border-[#6555b8] focus:ring-2 focus:ring-[#6555b8]/15 transition shadow-xs disabled:opacity-60"
                    placeholder={initialLoading ? 'Loading handle...' : 'username'}
                  />
                  <button
                    type="submit"
                    disabled={initialLoading || isSaving}
                    className="absolute right-1 px-3 py-1 rounded-lg bg-[#6555b8] hover:bg-[#52449e] disabled:opacity-50 text-white text-xs font-semibold transition active:scale-95 shadow-xs flex items-center gap-1"
                  >
                    {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Save</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#8C849B]">
                  Letters, numbers, underscores, and periods are permitted (3–24 characters).
                </p>

                {errorMessage && (
                  <p className="text-xs font-medium text-red-600 flex items-center gap-1.5 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorMessage}
                  </p>
                )}

                {savedSuccess && (
                  <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 pt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Handle updated successfully!
                  </p>
                )}
              </div>
            </form>

            {/* Premium Tier Card */}
            <div className="p-4 rounded-xl bg-[#FAF8FD] border border-[#DDD7E5]/70 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#F3EFFC] text-[#6555b8] flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-xs sm:text-sm font-medium text-[#1C1924]">
                  Premium Member Features
                </h3>
                <p className="text-xs text-[#524B5E] leading-relaxed">
                  Direct international translation, prioritized introduction badges, and unlimited verified passport filters.
                </p>
                <div className="pt-1.5">
                  <button
                    type="button"
                    className="px-3.5 py-1 rounded-full bg-white border border-[#DDD7E5] hover:border-[#6555b8] text-xs font-semibold text-[#6555b8] hover:bg-[#F3EFFC] transition shadow-xs"
                  >
                    View Membership Tiers &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'account' && (
          <div className="py-10 text-center space-y-1.5">
            <div className="text-sm font-medium text-[#8C849B]">Coming soon</div>
            <p className="text-xs text-[#756D82]">
              Configured automatically for verified accounts.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
