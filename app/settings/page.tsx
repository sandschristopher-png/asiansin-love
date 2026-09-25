'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'app' | 'notifications' | 'privacy' | 'reports'>('app');

  const [imperialUnits, setImperialUnits] = useState(true);
  const [vibrations, setVibrations] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyVisits, setNotifyVisits] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);

  const [blockedUsers, setBlockedUsers] = useState([
    { id: '1', name: 'Member_489', date: 'Blocked Sep 12, 2026' },
  ]);

  const handleUnblock = (id: string) => {
    setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <main className="max-w-xl mx-auto w-full px-4 py-6 pb-24 space-y-5">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#725A7A]/25">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-8 w-8 rounded-full bg-[#241E2F] border border-[#725A7A]/35 text-[#DDD8D4] hover:text-white flex items-center justify-center text-sm active:scale-90 transition-transform"
            aria-label="Back"
          >
            ←
          </button>
          <h1 className="text-xl font-black text-white tracking-tight">
            Account Settings
          </h1>
        </div>
        <Link
          href="/profile"
          className="text-xs font-bold text-[#DDD8D4] hover:text-white"
        >
          My Bio →
        </Link>
      </div>

      {/* Segmented Tab Bar */}
      <div className="p-1 rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('app')}
          className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'app'
              ? 'bg-[#653C87] text-white shadow-md'
              : 'text-[#B8AAC3] hover:text-white'
          }`}
        >
          App
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'notifications'
              ? 'bg-[#653C87] text-white shadow-md'
              : 'text-[#B8AAC3] hover:text-white'
          }`}
        >
          Alerts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'privacy'
              ? 'bg-[#653C87] text-white shadow-md'
              : 'text-[#B8AAC3] hover:text-white'
          }`}
        >
          Privacy
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'reports'
              ? 'bg-[#653C87] text-white shadow-md'
              : 'text-[#B8AAC3] hover:text-white'
          }`}
        >
          Reports
        </button>
      </div>

      {/* Tab 1: App */}
      {activeTab === 'app' && (
        <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-5 space-y-4 shadow-xl">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#B8AAC3]">
            Display & Measurement
          </h2>

          <div className="flex items-center justify-between py-2 border-b border-[#725A7A]/20">
            <div>
              <p className="text-sm font-bold text-white">Imperial Units</p>
              <p className="text-xs text-[#DDD8D4]">Show height in feet/inches and distances in miles</p>
            </div>
            <button
              type="button"
              onClick={() => setImperialUnits(!imperialUnits)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                imperialUnits ? 'bg-[#653C87]' : 'bg-[#17131F] border border-[#725A7A]/40'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  imperialUnits ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-bold text-white">Haptic Touch Vibrations</p>
              <p className="text-xs text-[#DDD8D4]">Provide tactile feedback when tapping actions</p>
            </div>
            <button
              type="button"
              onClick={() => setVibrations(!vibrations)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                vibrations ? 'bg-[#653C87]' : 'bg-[#17131F] border border-[#725A7A]/40'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  vibrations ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Notifications */}
      {activeTab === 'notifications' && (
        <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-5 space-y-4 shadow-xl">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#B8AAC3]">
            Notification Preferences
          </h2>

          <div className="flex items-center justify-between py-2 border-b border-[#725A7A]/20">
            <div>
              <p className="text-sm font-bold text-white">New Direct Messages</p>
              <p className="text-xs text-[#DDD8D4]">Instant notification when a courtship match replies</p>
            </div>
            <button
              type="button"
              onClick={() => setNotifyMessages(!notifyMessages)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                notifyMessages ? 'bg-[#653C87]' : 'bg-[#17131F] border border-[#725A7A]/40'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  notifyMessages ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#725A7A]/20">
            <div>
              <p className="text-sm font-bold text-white">Profile Visits</p>
              <p className="text-xs text-[#DDD8D4]">Notify when a member views your bio</p>
            </div>
            <button
              type="button"
              onClick={() => setNotifyVisits(!notifyVisits)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                notifyVisits ? 'bg-[#653C87]' : 'bg-[#17131F] border border-[#725A7A]/40'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  notifyVisits ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-bold text-white">Email Digest</p>
              <p className="text-xs text-[#DDD8D4]">Receive an email if you have unread messages after 1 hour</p>
            </div>
            <button
              type="button"
              onClick={() => setEmailDigest(!emailDigest)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                emailDigest ? 'bg-[#653C87]' : 'bg-[#17131F] border border-[#725A7A]/40'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  emailDigest ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Privacy */}
      {activeTab === 'privacy' && (
        <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-5 space-y-4 shadow-xl">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#B8AAC3]">
            Safety & Blocked Profiles
          </h2>

          {blockedUsers.length > 0 ? (
            <div className="divide-y divide-[#725A7A]/20">
              {blockedUsers.map((user) => (
                <div key={user.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-white">{user.name}</p>
                    <p className="text-[11px] text-[#725A7A]">{user.date}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnblock(user.id)}
                    className="px-3 py-1.5 rounded-xl bg-[#17131F] border border-[#725A7A]/35 hover:border-[#978FA8] text-xs font-bold text-[#DDD8D4] hover:text-white transition-all active:scale-95"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-[#DDD8D4]">
              <p className="text-xs font-semibold">Your blocked list is empty.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Reports */}
      {activeTab === 'reports' && (
        <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-6 text-center space-y-2.5 shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-[#17131F] border border-[#725A7A]/35 mx-auto flex items-center justify-center text-[#B8AAC3]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-base font-black text-white">No Active Reports</h2>
          <p className="text-xs text-[#DDD8D4] leading-relaxed max-w-sm mx-auto">
            Thanks for helping keep our community sincere. Any flagged safety violations or fraudulent solicitations will appear here.
          </p>
        </div>
      )}

    </main>
  );
}