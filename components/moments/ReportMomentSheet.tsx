'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { localizeError } from '@/lib/i18n/errors';
import type { MomentReportReason } from '@/lib/moments';
import type { TKey } from '@/lib/i18n';

const REASONS: { id: MomentReportReason; label: TKey }[] = [
  { id: 'explicit_photo', label: 'moments.reasonExplicit' },
  { id: 'financial_scam', label: 'moments.reasonScam' },
  { id: 'sex_solicitation', label: 'moments.reasonSolicitation' },
  { id: 'spam_link', label: 'moments.reasonSpam' },
  { id: 'fake_or_underage', label: 'moments.reasonFake' },
];

/** "Report this Moment": five reasons, one report per member and Moment (a repeat is accepted quietly). */
export function ReportMomentSheet({
  momentId,
  onClose,
  onDone,
}: {
  momentId: string;
  onClose: () => void;
  onDone: (result: { duplicate: boolean; hidden: boolean }) => void;
}) {
  const { t } = useLocale();
  const [reason, setReason] = useState<MomentReportReason | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!reason || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/moments/${momentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(localizeError({ status: res.status, code: data?.code, message: data?.error }, t));
        return;
      }
      onDone({ duplicate: Boolean(data.duplicate), hidden: Boolean(data.hidden) });
    } catch {
      setError(t('errors.network'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet title={t('moments.reportTitle')} onClose={onClose}>
      <p className="mt-3 text-xs leading-relaxed text-[#413B5E]/75">{t('report.sub')}</p>
      <div className="mt-3 space-y-2" role="radiogroup" aria-label={t('moments.reportTitle')}>
        {REASONS.map((r) => {
          const on = reason === r.id;
          return (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setReason(r.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-[13px] leading-snug transition ${
                on ? 'border-[#8574B7] bg-[#8574B7]/5 font-medium text-[#413B5E]' : 'border-[#D0CDE1] text-[#413B5E] hover:bg-[#E8E6F1]/40'
              }`}
            >
              <span aria-hidden className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-[#8574B7]' : 'border-[#D0CDE1]'}`}>
                {on && <span className="h-2 w-2 rounded-full bg-[#8574B7]" />}
              </span>
              <span>{t(r.label)}</span>
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={!reason || busy}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#8574B7] text-sm font-medium text-white transition-colors hover:bg-[#534377] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {t('report.submit')}
      </button>
    </BottomSheet>
  );
}

export default ReportMomentSheet;
