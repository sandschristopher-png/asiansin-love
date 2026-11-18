'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, Lock, ScanFace, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { QrCode } from '@/components/QrCode';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { useStepUp } from '@/components/verify/useStepUp';

type View = 'loading' | 'needPhoto' | 'ready' | 'done';

/**
 * Get verified. The same circular head-turn check as the identity check (components/verify/StepUpFlow), opened
 * as soon as the page loads: three random directions out of left / right / up / down, captured automatically,
 * with the camera analysed on the phone. It replaces the old two-photo hand-gesture flow.
 *
 * A good result never grants the badge by itself: the check is queued at /admin/verifications, marked as a
 * fast-track when the pre-screen liked it, and a member of the team approves it.
 */
export default function VerifyPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { run, element } = useStepUp();
  const [view, setView] = useState<View>('loading');
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [fastTrack, setFastTrack] = useState(false);

  const begin = useCallback(async () => {
    const result = await run({ reason: 'verification' });
    if (result?.status === 'manual_review') {
      setFastTrack(Boolean(result.fastTrack));
      setView('done');
      window.setTimeout(() => router.push('/discover'), 4000);
    }
  }, [run, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // A main profile photo is required: the live check is compared against it.
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (!cancelled) router.replace('/login?returnTo=%2Fverify');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('avatar_url, is_verified').eq('id', userData.user.id).maybeSingle();
      if (cancelled) return;
      setAlreadyVerified(profile?.is_verified === true);
      if (!profile?.avatar_url) {
        setView('needPhoto');
        return;
      }
      setView('ready');
      void begin(); // straight into the check; closing it leaves the intro card below
    })();
    return () => {
      cancelled = true;
    };
  }, [begin, router]);

  const bullets = ['stepup.introBullet1', 'stepup.introBullet2', 'stepup.introBullet3'] as const;
  const icons = [ScanFace, ShieldCheck, Lock];

  return (
    <main className="min-h-[100dvh] bg-white text-[#413B5E] flex flex-col justify-start">
      {element}
      <div className="flex items-center justify-between pt-3 pb-4 border-b border-[#D0CDE1] px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-10 w-10 rounded-2xl bg-white border border-[#D0CDE1] text-[#413B5E] hover:bg-[#E8E6F1]/70 flex items-center justify-center active:scale-95 transition shadow-xs"
          aria-label={t('verify.back')}
        >
          <ArrowLeft className="w-5 h-5 text-[#413B5E]" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-5 h-5 text-[#8574B7] shrink-0" />
          <h1 className="text-xl font-medium text-[#413B5E] truncate">{t('verify.title')}</h1>
        </div>
        <div className="w-10" />
      </div>

      {view === 'loading' && (
        <div className="p-6 text-center" role="status" aria-label={t('verify.title')}>
          <Loader2 className="w-8 h-8 text-[#8574B7] animate-spin mx-auto" />
        </div>
      )}

      {view === 'needPhoto' && (
        <div className="rounded-3xl bg-white border border-[#D0CDE1] p-8 text-center space-y-4 shadow-sm mx-4 mt-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-[#F6F4FB] border border-[#D0CDE1] text-[#8574B7] flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <p className="text-sm text-[#413B5E]/75 leading-relaxed">{t('verify.needPhoto')}</p>
          <button type="button" onClick={() => router.push('/profile/edit')} className="text-xs font-medium text-[#8574B7] hover:text-[#413B5E] transition">
            {t('verify.addPhoto')}
          </button>
        </div>
      )}

      {view === 'done' && (
        <div className="rounded-3xl bg-white border border-[#D0CDE1] p-8 text-center space-y-4 shadow-xl mx-4 mt-4">
          <div className="w-44 h-44 mx-auto rounded-3xl overflow-hidden bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/verification/approved.png" alt="" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-medium text-[#413B5E]">{t('verify.doneTitle')}</h2>
          <p className="text-sm text-[#413B5E]/75 leading-relaxed">
            {fastTrack ? t('verify.doneFast') : t('verify.doneQueued')} {t('verify.doneBack')}
          </p>
        </div>
      )}

      {view === 'ready' && (
        <div className="mx-4 mt-4 space-y-4 pb-28">
          {alreadyVerified && (
            <div role="note" className="flex items-start gap-2 p-3 rounded-2xl bg-[#F6F4FB] border border-[#E6E2F0] text-xs text-[#413B5E]/85 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#8574B7] shrink-0 mt-0.5" aria-hidden />
              <span>{t('verify.alreadyVerified')}</span>
            </div>
          )}
          <div className="p-5 rounded-3xl bg-white border border-[#D0CDE1] space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-[#413B5E]">{t('stepup.introTitle')}</h2>
            <ul className="space-y-3">
              {bullets.map((key, i) => {
                const Icon = icons[i];
                return (
                  <li key={key} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6F4FB] text-[#8574B7]">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="pt-1.5 text-sm leading-snug text-[#413B5E]">{t(key)}</span>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => void begin()}
              className="w-full h-12 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-sm font-semibold flex items-center justify-center active:scale-[0.99] transition"
            >
              {t('stepup.start')}
            </button>
          </div>

          {/* Desktop: hand off to the phone camera (front cameras on laptops make poor selfies). */}
          <div className="hidden md:flex items-center gap-4 p-4 rounded-3xl bg-white border border-[#D0CDE1]">
            <QrCode value="https://meetin.asia/verify" size={112} label={t('verify.qrLabel')} className="shrink-0 rounded-xl" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#413B5E]">{t('verify.phoneTitle')}</p>
              <p className="mt-1 text-xs text-[#413B5E]/75 leading-relaxed">{t('verify.phoneBody')}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
