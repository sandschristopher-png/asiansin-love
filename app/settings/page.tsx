'use client';

import dynamic from 'next/dynamic';

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
  Ghost,
  Loader2,
  MessageCircle, Trash2, AlertTriangle, CreditCard, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { hardSignOut } from '@/lib/hardSignOut';
import { PushDeviceRow } from '@/components/PushDeviceRow';
import { AppLanguageRow } from '@/components/i18n/AppLanguageRow';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { localizeError } from '@/lib/i18n/errors';
import { InstallAppCard } from '@/components/InstallAppCard';
import { HapticsRow } from '@/components/HapticsRow';
import { AlertPrefsRows } from '@/components/AlertPrefsRows';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { Switch } from '@/components/ui/Switch';
import { isPlusProfile } from '@/lib/plus';
import { getCachedSubscription, setCachedSubscription } from '@/lib/subscriptionStatus';

/** Loaded on first open (keeps the Plus checkout sheet out of the settings bundle). */
const AILPlusModal = dynamic(() => import('@/components/AILPlusModal').then((m) => m.AILPlusModal), { ssr: false });

type SettingsKey = 'hide_profile' | 'show_active_status' | 'notify_sparks' | 'notify_messages';


// Module-level cache for instantaneous 0ms paint
let cachedSettingsData: {
  hide_profile: boolean;
  show_active_status: boolean;
  notify_sparks: boolean;
  notify_messages: boolean;
} | null = null;

const SettingRow = ({
  icon,
  title,
  subtitle,
  on,
  onClick,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
  on: boolean;
  onClick: () => void;
}) => (
  <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#E8E6F1]/40 transition">
    <div className="flex items-center gap-3 pr-4">
      <div className="w-8 h-8 rounded-xl bg-white text-[#413B5E]/85 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xs font-semibold text-[#413B5E]">{title}</div>
        <p className="text-[11px] text-[#413B5E]/75">{subtitle}</p>
      </div>
    </div>
    {/* Optimistic: flips at once, saves in the background, rolls back only on failure. */}
    <Switch on={on} onClick={onClick} label={typeof title === 'string' ? title : undefined} />
  </div>
);

export default function SettingsHubPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(() => !cachedSettingsData);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Plus status: null until known (cached from an earlier page in this tab when available), so
  // Plus members never see a "Plus ·" upsell or a missing billing row while it loads.
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(() => getCachedSubscription());
  const isPlus = isSubscribed === true;
  // Stripe subscriber (the billing row); complimentary Plus has features but nothing to manage.
  // A known free member has no subscription; otherwise unknown until the profile read.
  const [hasPlusBilling, setHasPlusBilling] = useState<boolean | null>(() => (getCachedSubscription() === false ? false : null));
  const [gender, setGender] = useState<string | null>(null);
  const [plusModalOpen, setPlusModalOpen] = useState(false);
  const [plusModalKey, setPlusModalKey] = useState<'settings.unlockPrivate' | 'settings.unlockGhost'>('settings.unlockPrivate');
  // Ghost Mode (Plus): browse without leaving a footprint. Read on its own so a database without
  // the ghost_mode column (20261114_privacy_features.sql) still loads the other settings.
  const [ghostMode, setGhostMode] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [settings, setSettings] = useState(() => cachedSettingsData || {
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

      // Plus members get a "Manage Subscription" row (Stripe billing portal).
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: plus }) => {
          const hasPlus = isPlusProfile(plus);
          setIsSubscribed(hasPlus);
          setCachedSubscription(hasPlus);
          setHasPlusBilling(Boolean(plus?.is_plus));
          setGender(plus?.gender ?? null);
          setGhostMode(plus?.ghost_mode === true);
        });

      if (error) {
        // Column(s) missing — remind to run the migration
        setErrorMsg(t('errors.loadFailed'));
      } else if (data) {
        const loadedSettings = {
            hide_profile: Boolean(data.hide_profile),
            show_active_status: data.show_active_status ?? true,
            notify_sparks: data.notify_sparks ?? true,
            notify_messages: data.notify_messages ?? true,
          };
          cachedSettingsData = loadedSettings;
          setSettings(loadedSettings);
      }
      setLoading(false);
    }
    loadSettings();
  }, [router]);

  const handleToggle = async (key: SettingsKey) => {
    const nextVal = !settings[key];
    // Private Mode is free for women; men need Plus (also enforced in the database).
    if (key === 'hide_profile' && nextVal && gender === 'male' && !isPlus) {
      setPlusModalKey('settings.unlockPrivate');
      setPlusModalOpen(true);
      return;
    }
    setSettings((prev) => ({ ...prev, [key]: nextVal }));
    setErrorMsg(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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
      setErrorMsg(t('errors.saveFailed'));
    }
  };

  /** Ghost Mode is Plus-only: free members get the upgrade sheet and the switch stays off. */
  const toggleGhostMode = async () => {
    if (isSubscribed === null) return; // status still loading: no upsell to a Plus member
    if (!isPlus) {
      setPlusModalKey('settings.unlockGhost');
      setPlusModalOpen(true);
      return;
    }
    const nextVal = !ghostMode;
    setGhostMode(nextVal);
    setErrorMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const { error } = await supabase.from('profiles').update({ ghost_mode: nextVal }).eq('id', user.id);
    if (error) {
      setGhostMode(!nextVal);
      setErrorMsg(t('errors.saveFailed'));
    }
  };

  const openBillingPortal = async () => {
    setOpeningPortal(true);
    setPortalError(null);
    // Never spin forever: give up after 15 s and show an error instead.
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_path: '/settings' }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw Object.assign(new Error(data.error || 'portal'), { status: res.status, code: data.code });
      window.location.href = data.url;
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      setPortalError(aborted ? t('settings.portalTimeout') : localizeError(err instanceof Error ? err : null, t, 'settings.portalFailed'));
      setOpeningPortal(false);
    } finally {
      window.clearTimeout(timer);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await hardSignOut();
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data.error) {
        setDeleteError(localizeError({ status: res.status, code: data.code, message: data.error }, t, 'settings.deleteFailed'));
        setDeletingAccount(false);
        return;
      }
      await hardSignOut();
      window.location.href = '/';
    } catch {
      setDeleteError(t('errors.network'));
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#8574B7]" />
      </div>
    );
  }

  return (
    <div className="relative flex-1 w-full bg-white text-[#413B5E] font-sans min-h-screen">
      {/* Sticky Header */}
      <header className="flex items-center gap-3 px-4 py-3.5 bg-white/95 backdrop-blur-md border-b border-[#D0CDE1] sticky top-0 z-20">
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#413B5E]/85 hover:text-[#413B5E] hover:bg-[#E8E6F1]/70 transition cursor-pointer"
          aria-label={t('settings.back')}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-sm font-semibold text-[#413B5E] tracking-tight">
          {t('settings.title')}
        </h1>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 space-y-4 pb-[calc(8rem+env(safe-area-inset-bottom,0px))]">

        {errorMsg && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        {/* App language: menus and buttons (not the languages spoken on the profile) */}
        <div className="rounded-3xl bg-white border border-[#D0CDE1] p-2 shadow-2xs">
          <AppLanguageRow />
        </div>

        {/* CARD 1: ACCOUNT & TRUST */}
        <div className="rounded-3xl bg-white border border-[#D0CDE1] p-2 shadow-2xs space-y-1">
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8574B7]">
              {t('settings.accountTrust')}
            </span>
          </div>

          <Link
            href="/verify"
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#E8E6F1]/40 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#413B5E]">{t('settings.identityVerification')}</p>
                <p className="text-[11px] text-[#413B5E]/75">{t('settings.identityVerificationSub')}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </Link>

          <Link
            href="/profile/reputation"
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#E8E6F1]/40 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#E8E6F1]/60 text-[#8574B7] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#413B5E]">{t('settings.reputation')}</p>
                <p className="text-[11px] text-[#413B5E]/75">{t('settings.reputationSub')}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </Link>
        </div>

        {/* CARD 2: PRIVACY & DISCRETION */}
        <div className="rounded-3xl bg-white border border-[#D0CDE1] p-2 shadow-2xs space-y-1">
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8574B7]">
              {t('settings.privacyDiscretion')}
            </span>
          </div>

          <SettingRow
            icon={<EyeOff className="w-4 h-4" />}
            title={t('settings.privateMode')}
            subtitle={
              gender === 'male' && isSubscribed === false
                ? `Plus · ${t('settings.privateModeSub')}`
                : t('settings.privateModeSub')
            }
            on={settings.hide_profile}
            onClick={() => handleToggle('hide_profile')}
          />

          <SettingRow
            icon={<Ghost className="w-4 h-4" />}
            title={
              <span className="inline-flex items-center gap-1.5">
                {t('settings.ghostMode')}
                <PlusBadge />
              </span>
            }
            subtitle={t('settings.ghostModeSub')}
            on={isPlus && ghostMode}
            onClick={toggleGhostMode}
          />

          <SettingRow
            icon={<Smartphone className="w-4 h-4" />}
            title={t('settings.activeStatus')}
            subtitle={t('settings.activeStatusSub')}
            on={settings.show_active_status}
            onClick={() => handleToggle('show_active_status')}
          />
        </div>

        {/* CARD 3: NOTIFICATIONS */}
        <div className="rounded-3xl bg-white border border-[#D0CDE1] p-2 shadow-2xs space-y-1">
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8574B7]">
              {t('settings.notifications')}
            </span>
          </div>

          <SettingRow
            icon={<Bell className="w-4 h-4" />}
            title={t('settings.newSparks')}
            subtitle={t('settings.newSparksSub')}
            on={settings.notify_sparks}
            onClick={() => handleToggle('notify_sparks')}
          />

          <SettingRow
            icon={<MessageCircle className="w-4 h-4" />}
            title={t('settings.chatMessages')}
            subtitle={t('settings.chatMessagesSub')}
            on={settings.notify_messages}
            onClick={() => handleToggle('notify_messages')}
          />

          <InstallAppCard variant="settings" />
          <PushDeviceRow />
          <AlertPrefsRows />
          <HapticsRow />
        </div>

        {/* CARD 4: SAFETY & SUPPORT */}
        <div className="rounded-3xl bg-white border border-[#D0CDE1] p-2 shadow-2xs space-y-1">
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8574B7]">
              {t('settings.safetySupport')}
            </span>
          </div>

          <Link
            href="/standards"
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#E8E6F1]/40 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-[#413B5E]/85 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#413B5E]">{t('settings.guidelines')}</p>
                <p className="text-[11px] text-[#413B5E]/75">{t('settings.guidelinesSub')}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </Link>

          {[
            { href: '/safety', title: t('settings.safetyGuide'), subtitle: t('settings.safetyGuideSub') },
            { href: '/terms', title: t('settings.terms'), subtitle: t('settings.termsSub') },
            { href: '/privacy', title: t('settings.privacyPolicy'), subtitle: t('settings.privacyPolicySub') },
          ].map((row) => (
            <Link
              key={row.href}
              href={row.href}
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#E8E6F1]/40 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white text-[#413B5E]/85 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#413B5E]">{row.title}</p>
                  <p className="text-[11px] text-[#413B5E]/75">{row.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </Link>
          ))}
        </div>

        {/* Plus BILLING (subscribers only); neutral placeholder until the status is known */}
        {hasPlusBilling === null && (
          <div aria-hidden className="rounded-3xl bg-white border border-[#D0CDE1] p-2 shadow-2xs">
            <div className="h-11 w-full rounded-full bg-[#E8E6F1]/70 animate-pulse" />
          </div>
        )}
        {hasPlusBilling === true && (
          <div className="rounded-3xl bg-white border border-[#D0CDE1] p-2 shadow-2xs">
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={openingPortal}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#E8E6F1]/40 transition cursor-pointer text-left disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#E8E6F1]/60 text-[#8574B7] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#413B5E]">{t('settings.manageSub')}</p>
                  <p className="text-[11px] text-[#413B5E]/75">{t('settings.manageSubSub')}</p>
                </div>
              </div>
              {openingPortal ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#8574B7]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
            </button>
            {portalError && (
              <p role="alert" className="mx-3 mb-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[11px] font-semibold text-red-700">
                {portalError}
              </p>
            )}
          </div>
        )}

        {/* CARD 5: ACCOUNT LIFECYCLE */}
        <div className="rounded-3xl bg-white border border-[#D0CDE1] p-2 shadow-2xs space-y-1">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#E8E6F1]/40 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#413B5E]">{t('settings.logOut')}</p>
                <p className="text-[11px] text-[#413B5E]/75">{t('settings.logOutSub')}</p>
              </div>
            </div>
            {loggingOut && <Loader2 className="w-4 h-4 animate-spin text-[#8574B7]" />}
          </button>

          <div className="my-1 border-t border-[#D0CDE1]" />

          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setDeleteConfirmText('');
              setShowDeleteModal(true);
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-red-50/60 transition cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100 transition">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-red-600">{t('settings.deleteAccount')}</p>
                <p className="text-[11px] text-[#413B5E]/75">{t('settings.deleteAccountSub')}</p>
              </div>
            </div>
          </button>
        </div>

  {/* Account Deletion Confirmation Modal */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60"
            onClick={() => !deletingAccount && setShowDeleteModal(false)}
          >
            <div
              className="relative w-full max-w-[340px] bg-white rounded-3xl border border-[#D0CDE1]/60 shadow-2xl p-5 text-[#413B5E] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>

              <h2 className="text-base font-semibold text-[#413B5E]">{t('settings.deleteTitle')}</h2>
              <p className="text-xs text-[#413B5E]/75 mt-1.5 leading-relaxed">
                {t('settings.deleteBody')}
              </p>

              {deleteError && (
                <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[11px] font-medium leading-tight">
                  {deleteError}
                </div>
              )}

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={t('settings.deleteType', { word: 'DELETE' })}
                disabled={deletingAccount}
                autoComplete="off"
                spellCheck={false}
                className="w-full mt-4 px-3 py-2.5 rounded-xl border border-[#D0CDE1] bg-white text-xs text-[#413B5E] placeholder:text-[#413B5E]/55 focus:outline-none focus:border-[#8574B7] transition"
              />

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                  onClick={handleDeleteAccount}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs tracking-wide shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {deletingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('settings.deleting')}</span>
                    </>
                  ) : (
                    <span>{t('settings.deleteConfirm')}</span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-[#E8E6F1]/60 text-[#413B5E]/75 hover:text-[#413B5E] font-medium text-xs transition cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      {plusModalOpen && (
      <AILPlusModal
        open
        onClose={() => setPlusModalOpen(false)}
        title={t(plusModalKey)}
        returnPath="/settings"
      />
      )}
      </main>
    </div>
  );
}