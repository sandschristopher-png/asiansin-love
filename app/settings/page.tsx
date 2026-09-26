'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldCheck, Bell, Smartphone, UserX, ShieldAlert } from 'lucide-react';

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
    <div className="min-h-screen bg-[#130F18] text-[#E6D7FA]">
      <main className="max-w-xl mx-auto w-full px-4 py-8 pb-28 space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#9A79BA]/25">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-10 w-10 rounded-2xl bg-[#261F33] border border-[#9A79BA]/35 text-[#E6D7FA] hover:text-white flex items-center justify-center text-sm active:scale-90 transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Account Settings
            </h1>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A79BA] hover:text-white transition"
          >
            <span>My Bio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Segmented Tab Bar */}
        <div className="p-1.5 rounded-2xl bg-[#261F33] border border-[#9A79BA]/35 grid grid-cols-4 gap-1 shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab('app')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'app'
                ? 'bg-[#653C87] text-white shadow-md shadow-[#653C87]/40'
                : 'text-[#9A79BA] hover:text-white hover:bg-[#181222]/50'
            }`}
          >
            App
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'notifications'
                ? 'bg-[#653C87] text-white shadow-md shadow-[#653C87]/40'
                : 'text-[#9A79BA] hover:text-white hover:bg-[#181222]/50'
            }`}
          >
            Alerts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'privacy'
                ? 'bg-[#653C87] text-white shadow-md shadow-[#653C87]/40'
                : 'text-[#9A79BA] hover:text-white hover:bg-[#181222]/50'
            }`}
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'reports'
                ? 'bg-[#653C87] text-white shadow-md shadow-[#653C87]/40'
                : 'text-[#9A79BA] hover:text-white hover:bg-[#181222]/50'
            }`}
          >
            Reports
          </button>
        </div>

        {/* Tab 1: App */}
        {activeTab === 'app' && (
          <div className="rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 p-6 space-y-5 shadow-2xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9A79BA] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#C9A4E8]" />
              Display & Measurement
            </h2>

            <div className="flex items-center justify-between py-3 border-b border-[#9A79BA]/20">
              <div>
                <p className="text-sm font-bold text-white">Imperial Units</p>
                <p className="text-xs text-[#E6D7FA] mt-0.5">Show height in feet/inches and distances in miles</p>
              </div>
              <button
                type="button"
                onClick={() => setImperialUnits(!imperialUnits)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  imperialUnits ? 'bg-[#653C87]' : 'bg-[#181222] border border-[#9A79BA]/40'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    imperialUnits ? 'left-6.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-bold text-white">Haptic Touch Vibrations</p>
                <p className="text-xs text-[#E6D7FA] mt-0.5">Provide tactile feedback when tapping actions</p>
              </div>
              <button
                type="button"
                onClick={() => setVibrations(!vibrations)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  vibrations ? 'bg-[#653C87]' : 'bg-[#181222] border border-[#9A79BA]/40'
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
          <div className="rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 p-6 space-y-5 shadow-2xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9A79BA] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#C9A4E8]" />
              Notification Preferences
            </h2>

            <div className="flex items-center justify-between py-3 border-b border-[#9A79BA]/20">
              <div>
                <p className="text-sm font-bold text-white">New Direct Messages</p>
                <p className="text-xs text-[#E6D7FA] mt-0.5">Instant notification when a courtship match replies</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyMessages(!notifyMessages)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notifyMessages ? 'bg-[#653C87]' : 'bg-[#181222] border border-[#9A79BA]/40'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    notifyMessages ? 'left-6.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#9A79BA]/20">
              <div>
                <p className="text-sm font-bold text-white">Profile Visits</p>
                <p className="text-xs text-[#E6D7FA] mt-0.5">Notify when a member views your bio</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyVisits(!notifyVisits)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notifyVisits ? 'bg-[#653C87]' : 'bg-[#181222] border border-[#9A79BA]/40'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    notifyVisits ? 'left-6.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-bold text-white">Email Digest</p>
                <p className="text-xs text-[#E6D7FA] mt-0.5">Receive an email if you have unread messages after 1 hour</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailDigest(!emailDigest)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  emailDigest ? 'bg-[#653C87]' : 'bg-[#181222] border border-[#9A79BA]/40'
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
          <div className="rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 p-6 space-y-5 shadow-2xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9A79BA] flex items-center gap-2">
              <UserX className="w-4 h-4 text-[#C9A4E8]" />
              Safety & Blocked Profiles
            </h2>

            {blockedUsers.length > 0 ? (
              <div className="divide-y divide-[#9A79BA]/20">
                {blockedUsers.map((user) => (
                  <div key={user.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{user.name}</p>
                      <p className="text-xs text-[#9A79BA]">{user.date}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnblock(user.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#181222] border border-[#9A79BA]/35 hover:border-[#9A79BA] text-xs font-bold text-[#E6D7FA] hover:text-white transition active:scale-95"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-[#E6D7FA]">
                <p className="text-xs font-semibold">Your blocked list is empty.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Reports */}
        {activeTab === 'reports' && (
          <div className="rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 p-8 text-center space-y-3 shadow-2xl">
            <div className="h-14 w-14 rounded-2xl bg-[#181222] border border-[#9A79BA]/35 mx-auto flex items-center justify-center text-[#9A79BA]">
              <ShieldAlert className="w-6 h-6 text-[#C9A4E8]" />
            </div>
            <h2 className="text-base font-bold text-white">No Active Reports</h2>
            <p className="text-xs text-[#E6D7FA] leading-relaxed max-w-sm mx-auto">
              Thanks for helping keep our community sincere. Any flagged safety violations or fraudulent solicitations will appear here.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
