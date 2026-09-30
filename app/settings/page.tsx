'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Bell,
  Smartphone,
  UserX,
  ShieldAlert,
  User,
  Lock,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import UpgradeModal from '@/components/UpgradeModal';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'account' | 'app' | 'notifications' | 'privacy' | 'reports'>('account');
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [imperialUnits, setImperialUnits] = useState(true);
  const [vibrations, setVibrations] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyVisits, setNotifyVisits] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);

  const [blockedUsers, setBlockedUsers] = useState([
    { id: '1', name: 'Member_489', date: 'Blocked Sep 12, 2026' },
  ]);

  
  React.useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        setProfile(data);
        setUsernameInput(data.username || '');
      }
    }
    loadProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.id) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (data) {
          setProfile(data);
          setUsernameInput(data.username || '');
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  // Determine user category
  const isForeignMan = Boolean(
    profile &&
    !profile.is_sea_local &&
    (profile.gender?.toLowerCase().includes('man') || profile.gender?.toLowerCase().includes('male'))
  );

  // Check 30-day cooldown for SEA / non-premium members
  const getCooldownStatus = () => {
    if (!profile?.username_changed_at) return { allowed: true, daysRemaining: 0 };
    const lastChanged = new Date(profile.username_changed_at).getTime();
    const now = Date.now();
    const daysSince = (now - lastChanged) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) {
      return {
        allowed: false,
        daysRemaining: Math.ceil(30 - daysSince),
        canChangeDate: new Date(lastChanged + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      };
    }
    return { allowed: true, daysRemaining: 0 };
  };

  const cooldown = getCooldownStatus();
  const isForeignBlocked = isForeignMan && !profile?.is_premium;
  const canEdit = !isForeignBlocked && (profile?.is_premium || cooldown.allowed);

  const handleSaveUsername = async () => {
    if (isForeignBlocked) {
      setShowUpgradeModal(true);
      return;
    }
    if (!cooldown.allowed && !profile?.is_premium) {
      setUsernameError(`Usernames can only be updated once every 30 days. Next available change: ${cooldown.canChangeDate}.`);
      return;
    }

    const clean = usernameInput.trim().replace(/[^a-zA-Z0-9_.]/g, '');
    if (clean.length < 3) {
      setUsernameError('Username must be at least 3 characters long.');
      return;
    }
    
    // Only skip if the exact casing is already identical
    if (clean === profile?.username) {
      setIsEditingUsername(false);
      return;
    }

    setIsSavingUsername(true);
    setUsernameError(null);

    try {
      // Get active user ID dynamically
      const { data: { user } } = await supabase.auth.getUser();
      const targetId = profile?.id || user?.id;

      if (!targetId) {
        setUsernameError('Could not verify authenticated user session.');
        setIsSavingUsername(false);
        return;
      }

      // Check collision with other users (case-insensitive)
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', clean)
        .neq('id', targetId)
        .maybeSingle();

      if (checkError) {
        console.warn('Username collision check error:', checkError);
      }

      if (existing) {
        setUsernameError('This username is already taken. Please try another.');
        setIsSavingUsername(false);
        return;
      }

      // Perform update with exact casing
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          username: clean,
          username_changed_at: new Date().toISOString()
        })
        .eq('id', targetId);

      if (updateError) {
        // Fallback if username_changed_at is not a column
        if (updateError.message.includes('username_changed_at')) {
          const { error: retryError } = await supabase
            .from('profiles')
            .update({ username: clean })
            .eq('id', targetId);

          if (retryError) {
            setUsernameError(retryError.message);
            setIsSavingUsername(false);
            return;
          }
        } else {
          setUsernameError(updateError.message);
          setIsSavingUsername(false);
          return;
        }
      }

      setProfile((prev: any) => ({ 
        ...(prev || {}), 
        id: targetId,
        username: clean, 
        username_changed_at: new Date().toISOString() 
      }));
      setUsernameInput(clean);
      setUsernameSuccess(true);
      setIsEditingUsername(false);
      setTimeout(() => setUsernameSuccess(false), 3000);
    } catch (err: any) {
      setUsernameError(err?.message || 'Failed to save username.');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleUnblock = (id: string) => {
    setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F8F7FA] text-[#1C1924]">
      <main className="max-w-xl mx-auto w-full px-4 py-8 pb-28 space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#9A8CC3]/25">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-10 w-10 rounded-2xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] hover:text-[#1C1924] flex items-center justify-center text-sm active:scale-90 transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-[#1C1924] tracking-tight">
              Account Settings
            </h1>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A8CC3] hover:text-[#1C1924] transition"
          >
            <span>My Bio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Segmented Tab Bar */}
          <div className="p-1.5 rounded-2xl bg-[#FFFFFF] border border-[#9A8CC3]/35 grid grid-cols-5 gap-1 shadow-lg">
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'account'
                  ? 'bg-[#6555B8] text-white shadow-md shadow-[#6555B8]/40'
                  : 'text-[#9A8CC3] hover:text-white hover:bg-[#FFFFFF]/50'
              }`}
            >
              Account
            </button>
          <button
            type="button"
            onClick={() => setActiveTab('app')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'app'
                ? 'bg-[#6555B8] text-white shadow-md shadow-[#6555B8]/40'
                : 'text-[#9A8CC3] hover:text-white hover:bg-[#FFFFFF]/50'
            }`}
          >
            App
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'notifications'
                ? 'bg-[#6555B8] text-white shadow-md shadow-[#6555B8]/40'
                : 'text-[#9A8CC3] hover:text-white hover:bg-[#FFFFFF]/50'
            }`}
          >
            Alerts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'privacy'
                ? 'bg-[#6555B8] text-white shadow-md shadow-[#6555B8]/40'
                : 'text-[#9A8CC3] hover:text-white hover:bg-[#FFFFFF]/50'
            }`}
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'reports'
                ? 'bg-[#6555B8] text-white shadow-md shadow-[#6555B8]/40'
                : 'text-[#9A8CC3] hover:text-white hover:bg-[#FFFFFF]/50'
            }`}
          >
            Reports
          </button>
        </div>

        
          {/* Tab 0: Account */}
          {activeTab === 'account' && (
            <div className="rounded-3xl bg-[#FFFFFF] border border-[#9A8CC3]/35 p-6 space-y-6 shadow-2xl">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#B2A4D7]" />
                  Handle & Account Identity
                </h2>
                <p className="mt-1 text-xs text-[#1C1924]/70">
                  Your distinct identifier used in profile links and direct messages.
                </p>
              </div>

              {usernameSuccess && (
                <div className="rounded-2xl bg-emerald-950/50 border border-emerald-500/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Username updated successfully!
                </div>
              )}

              {usernameError && (
                <div className="rounded-2xl bg-rose-950/50 border border-rose-500/40 p-3 text-xs text-rose-300">
                  {usernameError}
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#1C1924]">Username Handle</label>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#9A8CC3]">@</span>
                    <input
                      type="text"
                      disabled={!isEditingUsername}
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/30 text-sm font-semibold text-[#1C1924] focus:outline-none focus:border-[#B2A4D7] disabled:opacity-75 disabled:cursor-not-allowed"
                      placeholder="Username"
                    />
                  </div>

                  {!isEditingUsername ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (isForeignBlocked) {
                          setShowUpgradeModal(true);
                        } else if (!cooldown.allowed && !profile?.is_premium) {
                          setUsernameError(`Usernames can only be updated once every 30 days. Available on ${cooldown.canChangeDate}.`);
                        } else {
                          setIsEditingUsername(true);
                          setUsernameError(null);
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6555B8] hover:bg-[#7D4B9F] text-white text-xs font-bold transition shadow-md shadow-[#6555B8]/30"
                    >
                      {isForeignBlocked && <Lock className="w-3.5 h-3.5 text-amber-300" />}
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSaveUsername}
                        disabled={isSavingUsername}
                        className="px-4 py-2.5 rounded-xl bg-[#6555B8] hover:bg-[#7D4B9F] text-white text-xs font-bold transition disabled:opacity-50"
                      >
                        {isSavingUsername ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingUsername(false);
                          setUsernameInput(profile?.username || '');
                          setUsernameError(null);
                        }}
                        className="px-3 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/30 text-[#9A8CC3] hover:text-[#1C1924] text-xs font-bold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* State Guidance Banners */}
                {isForeignBlocked ? (
                  <div className="mt-2 rounded-2xl bg-amber-950/30 border border-amber-500/30 p-3.5 flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-amber-200">Premium Suitor Feature</p>
                      <p className="text-amber-300/80 leading-relaxed">
                        Custom username modification for foreign gentlemen is reserved for Premium members to preserve authentic identity and safety.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowUpgradeModal(true)}
                        className="inline-block mt-1 font-bold text-[#1C1924] underline hover:text-[#1C1924]"
                      >
                        Upgrade to Premium →
                      </button>
                    </div>
                  </div>
                ) : !cooldown.allowed && !profile?.is_premium ? (
                  <div className="mt-2 rounded-2xl bg-sky-950/30 border border-sky-500/30 p-3.5 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-sky-200">30-Day Anti-Abuse Cooldown Active</p>
                      <p className="text-sky-300/80 leading-relaxed">
                        To protect members against impersonation and handle flipping, handles can only be changed once every 30 days. You can change yours again on <strong>{cooldown.canChangeDate}</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#9A8CC3]">
                    Letters (uppercase and lowercase), numbers, underscores, and periods are permitted.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab 1: App */}
        {activeTab === 'app' && (
          <div className="rounded-3xl bg-[#FFFFFF] border border-[#9A8CC3]/35 p-6 space-y-5 shadow-2xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#B2A4D7]" />
              Display & Measurement
            </h2>

            <div className="flex items-center justify-between py-3 border-b border-[#9A8CC3]/20">
              <div>
                <p className="text-sm font-bold text-[#1C1924]">Imperial Units</p>
                <p className="text-xs text-[#1C1924] mt-0.5">Show height in feet/inches and distances in miles</p>
              </div>
              <button
                type="button"
                onClick={() => setImperialUnits(!imperialUnits)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  imperialUnits ? 'bg-[#6555B8]' : 'bg-[#FFFFFF] border border-[#9A8CC3]/40'
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
                <p className="text-sm font-bold text-[#1C1924]">Haptic Touch Vibrations</p>
                <p className="text-xs text-[#1C1924] mt-0.5">Provide tactile feedback when tapping actions</p>
              </div>
              <button
                type="button"
                onClick={() => setVibrations(!vibrations)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  vibrations ? 'bg-[#6555B8]' : 'bg-[#FFFFFF] border border-[#9A8CC3]/40'
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
          <div className="rounded-3xl bg-[#FFFFFF] border border-[#9A8CC3]/35 p-6 space-y-5 shadow-2xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#B2A4D7]" />
              Notification Preferences
            </h2>

            <div className="flex items-center justify-between py-3 border-b border-[#9A8CC3]/20">
              <div>
                <p className="text-sm font-bold text-[#1C1924]">New Direct Messages</p>
                <p className="text-xs text-[#1C1924] mt-0.5">Instant notification when a courtship match replies</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyMessages(!notifyMessages)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notifyMessages ? 'bg-[#6555B8]' : 'bg-[#FFFFFF] border border-[#9A8CC3]/40'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    notifyMessages ? 'left-6.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#9A8CC3]/20">
              <div>
                <p className="text-sm font-bold text-[#1C1924]">Profile Visits</p>
                <p className="text-xs text-[#1C1924] mt-0.5">Notify when a member views your bio</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyVisits(!notifyVisits)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notifyVisits ? 'bg-[#6555B8]' : 'bg-[#FFFFFF] border border-[#9A8CC3]/40'
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
                <p className="text-sm font-bold text-[#1C1924]">Email Digest</p>
                <p className="text-xs text-[#1C1924] mt-0.5">Receive an email if you have unread messages after 1 hour</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailDigest(!emailDigest)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  emailDigest ? 'bg-[#6555B8]' : 'bg-[#FFFFFF] border border-[#9A8CC3]/40'
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
          <div className="rounded-3xl bg-[#FFFFFF] border border-[#9A8CC3]/35 p-6 space-y-5 shadow-2xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3] flex items-center gap-2">
              <UserX className="w-4 h-4 text-[#B2A4D7]" />
              Safety & Blocked Profiles
            </h2>

            {blockedUsers.length > 0 ? (
              <div className="divide-y divide-[#9A8CC3]/20">
                {blockedUsers.map((user) => (
                  <div key={user.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#1C1924]">{user.name}</p>
                      <p className="text-xs text-[#9A8CC3]">{user.date}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnblock(user.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 hover:border-[#9A8CC3] text-xs font-bold text-[#1C1924] hover:text-[#1C1924] transition active:scale-95"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-[#1C1924]">
                <p className="text-xs font-semibold">Your blocked list is empty.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Reports */}
        {activeTab === 'reports' && (
          <div className="rounded-3xl bg-[#FFFFFF] border border-[#9A8CC3]/35 p-8 text-center space-y-3 shadow-2xl">
            <div className="h-14 w-14 rounded-2xl bg-[#FFFFFF] border border-[#9A8CC3]/35 mx-auto flex items-center justify-center text-[#9A8CC3]">
              <ShieldAlert className="w-6 h-6 text-[#B2A4D7]" />
            </div>
            <h2 className="text-base font-bold text-[#1C1924]">No Active Reports</h2>
            <p className="text-xs text-[#1C1924] leading-relaxed max-w-sm mx-auto">
              Thanks for helping keep our community sincere. Any flagged safety violations or fraudulent solicitations will appear here.
            </p>
          </div>
        )}

        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} onSelectPlan={() => setShowUpgradeModal(false)} />
      </main>
    </div>
  );
}
