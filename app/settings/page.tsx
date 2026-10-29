'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Bell,
  LogOut,
  ChevronRight,
  HelpCircle,
  Smartphone,
  EyeOff,
  Loader2,
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type SettingsKey = 'hide_profile' | 'show_active_status' | 'notify_sparks' | 'notify_messages';

export default function SettingsHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [savingKey, setSavingKey] = useState<SettingsKey | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    hide_profile: false,
    show_active_status: true,
    notify_sparks: true,
    notify_messages: true,
  });

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('hide_profile, show_active_status, notify_sparks, notify_messages')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        // Column(s) missing — remind to run the migration
        setErrorMsg('Settings storage not initialized. Run the profiles migration.');
      } else if (data) {
        setSettings({
          hide_profile: Boolean(data.hide_profile),
          show_active_status: data.show_active_status ?? true,
          notify_sparks: data.notify_sparks ?? true,
          notify_messages: data.notify_messages ?? true,
        });
      }
      setLoading(false);
    }
    loadSettings();
  }, [router]);

  const handleToggle = async (key: SettingsKey) => {
    const nextVal = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: nextVal }));
    setErrorMsg(null);
    setSavingKey(key);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSavingKey(null);
      router.push('/login');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ [key]: nextVal })
      .eq('id', user.id);

    if (error) {
      // Roll back the optimistic flip so UI matches reality
      setSettings((prev) => ({ ...prev, [key]: !nextVal }));
      setErrorMsg('Could not save setting. Check your connection and try again.');
    }
    setSavingKey(null);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FA] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#6555B8]" />
      </div>
    );
  }

  const ToggleSwitch = ({ on, onClick, busy }: { on: boolean; onClick: () => void; busy: boolean }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-checked={on}
      role="switch"
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
        on ? 'bg-[#6555B8]' : 'bg-[#DDD7E5]'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 left-0 transition-transform duration-200 ${
          on ? 'translate-x-6' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  const SettingRow = ({
    icon,
    title,
    subtitle,
    on,
    busy,
    onClick,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    on: boolean;
    busy: boolean;
    onClick: () => void;
  }) => (
    <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#F8F7FA] transition">
      <div className="flex items-center gap-3 pr-4">
        <div className="w-8 h-8 rounded-xl bg-[#F8F7FA] text-[#524B5E] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-[#1C1924]">{title}</p>
          <p className="text-[11px] text-[#6C637B]">{subtitle}</p>
        </div>
      </div>
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin text-[#6555B8] shrink-0" />
      ) : (
        <ToggleSwitch on={on} onClick={onClick} busy={busy} />
      )}
    </div>
  );

  return (
    <div className="relative flex-1 w-full bg-[#F8F7FA] text-[#1C1924] font-sans min-h-screen">
      {/* Sticky Header */}
      <header className="flex items-center gap-3 px-4 py-3.5 bg-white/95 backdrop-blur-md border-b border-[#E5E1EC] sticky top-0 z-20">
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#524B5E] hover:text-[#1C1924] hover:bg-[#F3EFFC] transition cursor-pointer"
          aria-label="Back to profile"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-sm font-semibold text-[#1C1924] tracking-tight">
          Settings &amp; Privacy
        </h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4 pb-32">

        {errorMsg && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* CARD 1: ACCOUNT & TRUST */}
        <div className="rounded-3xl bg-white border border-[#DDD7E5] p-2 shadow-2xs space-y-1">
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6555B8]">
              Account &amp; Trust
            </span>
          </div>

          <Link
            href="/verify"
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#F8F7FA] transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1C1924]">Identity Verification</p>
                <p className="text-[11px] text-[#6C637B]">GPS &amp; selfie trust badge status</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C849B]" />
          </Link>

          <Link
            href="/profile/reputation"
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#F8F7FA] transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F3EFFC] text-[#6555B8] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1C1924]">Reputation &amp; Conduct Standing</p>
                <p className="text-[11px] text-[#6C637B]">Community health score (100/100)</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C849B]" />
          </Link>
        </div>

        {/* CARD 2: PRIVACY & DISCRETION */}
        <div className="rounded-3xl bg-white border border-[#DDD7E5] p-2 shadow-2xs space-y-1">
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6555B8]">
              Privacy &amp; Discretion
            </span>
          </div>

          <SettingRow
            icon={<EyeOff className="w-4 h-4" />}
            title="Pause Profile (Break Mode)"
            subtitle="Hide from discovery stack while keeping existing chats"
            on={settings.hide_profile}
            busy={savingKey === 'hide_profile'}
            onClick={() => handleToggle('hide_profile')}
          />

          <SettingRow
            icon={<Smartphone className="w-4 h-4" />}
            title="Show Active Status"
            subtitle="Display green presence indicator on your profile"
            on={settings.show_active_status}
            busy={savingKey === 'show_active_status'}
            onClick={() => handleToggle('show_active_status')}
          />
        </div>

        {/* CARD 3: NOTIFICATIONS */}
        <div className="rounded-3xl bg-white border border-[#DDD7E5] p-2 shadow-2xs space-y-1">
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6555B8]">
              Notifications
            </span>
          </div>

          <SettingRow
            icon={<Bell className="w-4 h-4" />}
            title="New Sparks &amp; Matches"
            subtitle="Alerts when someone sparks your profile"
            on={settings.notify_sparks}
            busy={savingKey === 'notify_sparks'}
            onClick={() => handleToggle('notify_sparks')}
          />

          <SettingRow
            icon={<MessageCircle className="w-4 h-4" />}
            title="Chat Messages"
            subtitle="Alerts for new direct messages"
            on={settings.notify_messages}
            busy={savingKey === 'notify_messages'}
            onClick={() => handleToggle('notify_messages')}
          />
        </div>

        {/* CARD 4: SAFETY & SUPPORT */}
        <div className="rounded-3xl bg-white border border-[#DDD7E5] p-2 shadow-2xs space-y-1">
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6555B8]">
              Safety &amp; Support
            </span>
          </div>

          <Link
            href="/standards"
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#F8F7FA] transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F8F7FA] text-[#524B5E] flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1C1924]">Community Guidelines &amp; Anti-Scam</p>
                <p className="text-[11px] text-[#6C637B]">How we keep asiansin.love secure</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C849B]" />
          </Link>
        </div>

        {/* CARD 5: ACCOUNT LIFECYCLE */}
        <div className="rounded-3xl bg-white border border-[#DDD7E5] p-2 shadow-2xs space-y-1">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#F8F7FA] transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1C1924]">Log Out</p>
                <p className="text-[11px] text-[#6C637B]">Sign out of this browser session</p>
              </div>
            </div>
            {loggingOut && <Loader2 className="w-4 h-4 animate-spin text-[#6555B8]" />}
          </button>
        </div>

      </main>
    </div>
  );
}