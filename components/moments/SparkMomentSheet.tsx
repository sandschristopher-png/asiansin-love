'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, Zap } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { localizeError } from '@/lib/i18n/errors';
import type { MomentItem } from '@/lib/moments';

/**
 * "Spark this Moment": the Moment's photo sits at the top of the sheet, then a short hello. Sending
 * Sparks the author and starts the conversation with that photo attached, so they see exactly which
 * Moment caught the sender's eye. The daily Spark limit and the new-conversation limit lead to
 * /plus, the same as everywhere else in the app.
 */
export function SparkMomentSheet({
  moment,
  onClose,
  onSent,
}: {
  moment: MomentItem;
  onClose: () => void;
  onSent: () => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const sparkRes = await fetch('/api/spark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: moment.userId }),
      });
      const sparkData = await sparkRes.json().catch(() => ({}));
      if (!sparkRes.ok) {
        if (sparkRes.status === 429 && sparkData?.code === 'QUOTA_EXCEEDED') {
          router.push('/plus?feature=sparks');
          return;
        }
        setError(localizeError({ status: sparkRes.status, code: sparkData?.code, message: sparkData?.error }, t));
        return;
      }
      const msgRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: moment.userId, content: text.trim() || t('moments.sparkDefault'), momentId: moment.id }),
      });
      const msgData = await msgRes.json().catch(() => ({}));
      if (!msgRes.ok) {
        if (msgData?.code === 'OUTREACH_LIMIT_REACHED') {
          router.push('/plus?feature=conversations');
          return;
        }
        setError(localizeError({ status: msgRes.status, code: msgData?.code, message: msgData?.error }, t));
        return;
      }
      onSent();
    } catch {
      setError(t('errors.network'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet title={t('moments.sparkTitle')} onClose={onClose}>
      <div className="mt-4 flex items-start gap-3">
        <div className="relative h-32 w-[6.4rem] shrink-0 overflow-hidden rounded-2xl border border-[#D0CDE1] bg-[#EAE9F2]/50">
          <Image src={moment.imageUrl} alt={t('moments.attachedAlt')} fill sizes="104px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-[#413B5E]">{moment.author.username}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{t('moments.sparkHint')}</p>
        </div>
      </div>
      <textarea
        rows={3}
        value={text}
        maxLength={300}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('moments.sparkPlaceholder')}
        className="mt-4 w-full resize-none rounded-xl border border-[#D0CDE1] bg-white px-3.5 py-2.5 text-sm text-[#413B5E] placeholder:text-slate-400 focus:border-[#726E97] focus:outline-none"
      />
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium leading-relaxed text-red-600">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={send}
        disabled={busy}
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#726E97] text-sm font-medium text-white transition-colors hover:bg-[#524E75] disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Zap className="h-4 w-4 fill-current" aria-hidden />}
        {t('moments.sparkSend')}
      </button>
    </BottomSheet>
  );
}

export default SparkMomentSheet;
