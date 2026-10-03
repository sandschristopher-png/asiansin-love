'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Shield, Bell, Lock, FileText, CheckCircle2, Crown } from 'lucide-react';


export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'account' | 'app' | 'alerts' | 'privacy' | 'reports'>('account');
  const [username, setUsername] = useState('cos');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveHandle = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-32 space-y-6">
      {/* Category Pills Navigation */}
      <div className="sticky top-[60px] z-20 flex items-center gap-2 px-4 py-3 bg-white/50 border-b border-gray-100 overflow-x-auto no-scrollbar">
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
              onClick={() => setActiveTab(tab.key as any)}
              className={'px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all shrink-0 ' + (
                active
                  ? 'bg-[#6555b8] text-white shadow-xs'
                  : 'text-[#524B5E] hover:text-[#1C1924] hover:bg-[#F3EFFC]'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-3xl border border-[#DDD7E5] p-5 sm:p-8 shadow-xs space-y-8">
        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* Handle & Identity Section */}
            <div className="space-y-2">
              <h2 className="text-sm sm:text-base font-medium text-[#1C1924] flex items-center gap-2">
                <User className="w-4 h-4 text-[#6555b8]" /> Handle & Account Identity
              </h2>
              <p className="text-xs sm:text-sm text-[#756D82]">
                Your unique handle used across direct messages, links, and public previews.
              </p>
            </div>

            <form onSubmit={handleSaveHandle} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-[#524B5E]">
                  Username Handle
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm text-[#8C849B]">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-8 pr-24 py-2.5 bg-white border border-[#DDD7E5] rounded-2xl text-sm font-semibold text-[#1C1924] focus:outline-none focus:border-[#6555b8] focus:ring-2 focus:ring-[#6555b8]/15 transition shadow-xs"
                    placeholder="username"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 px-4 py-1.5 rounded-xl bg-[#6555b8] hover:bg-[#52449e] text-white text-xs font-semibold transition active:scale-95 shadow-xs"
                  >
                    Save
                  </button>
                </div>
                <p className="text-[11px] text-[#8C849B]">
                  Letters, numbers, underscores, and periods are permitted.
                </p>
                {savedSuccess && (
                  <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Handle updated successfully!
                  </p>
                )}
              </div>
            </form>

            {/* Premium Tier Card */}
            <div className="p-5 rounded-2xl bg-[#FAF8FD] border border-[#DDD7E5] flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#F3EFFC] text-[#6555b8] flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-xs sm:text-sm font-medium text-[#1C1924]">
                  Premium Member Features
                </h3>
                <p className="text-xs sm:text-sm text-[#524B5E] leading-relaxed">
                  Direct international translation, prioritized introduction badges, and unlimited verified passport filters.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    className="px-4 py-1.5 rounded-full bg-white border border-[#DDD7E5] hover:border-[#6555b8] text-xs font-semibold text-[#6555b8] hover:bg-[#F3EFFC] transition shadow-xs"
                  >
                    View Membership Tiers &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'account' && (
          <div className="py-12 text-center space-y-2">
            <h2 className="text-base font-medium text-[#1C1924] capitalize">{activeTab} Preferences</h2>
            <p className="text-xs sm:text-sm text-[#756D82]">
              Configured automatically for verified accounts.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
