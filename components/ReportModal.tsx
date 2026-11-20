'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { localizeError } from '@/lib/i18n/errors';
import type { TKey } from '@/lib/i18n';

/** Reasons offered when reporting one message; the ids must match REPORT_CATEGORIES in app/api/reports/route.ts. */
const MESSAGE_REASONS: { id: string; label: TKey }[] = [
  { id: 'financial_scam', label: 'report.reasonFinancial' },
  { id: 'sex_solicitation', label: 'report.reasonSolicitation' },
  { id: 'adult_content', label: 'report.reasonAdult' },
  { id: 'inappropriate_content', label: 'report.reasonHarassment' },
  { id: 'underage', label: 'report.reasonUnderage' },
  { id: 'off_platform_steering', label: 'report.reasonOffPlatform' },
];

/** Reasons offered when reporting a member from their profile or the chat menu. */
const MEMBER_REASONS: { id: string; label: TKey }[] = [
  { id: 'commercial_solicitation', label: 'report.reasonCommercial' },
  { id: 'financial_scam', label: 'report.reasonFinancial' },
  { id: 'off_platform_steering', label: 'report.reasonOffPlatform' },
  { id: 'inappropriate_content', label: 'report.reasonHarassment' },
  { id: 'fake_profile', label: 'report.reasonFake' },
  { id: 'underage', label: 'report.reasonUnderage' },
  { id: 'other', label: 'report.reasonOther' },
];

/**
 * Report bottom sheet (z-[70], above the BottomNav). Posts to /api/reports: a message report files
 * a review-queue entry, costs the sender reputation at once and is counted once per message;
 * a member report goes to the review queue only. Blocking is offered afterwards by the caller
 * (`onDone`), so a report never silently blocks.
 */
export function ReportModal({
  open,
  reportedId,
  name,
  context,
  messageId,
  onClose,
  onDone,
}: {
  open: boolean;
  reportedId: string;
  name: string;
  /** Where the report is filed from (kept with the report for moderators). */
  context?: 'chat' | 'profile';
  /** Reporting one chat message: the server quotes it plus the 5 messages before it. */
  messageId?: string;
  onClose: () => void;
  onDone: (blocked: boolean, duplicate?: boolean) => void;
}) {
  const { t } = useLocale();
  const [category, setCategory] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reasons = messageId ? MESSAGE_REASONS : MEMBER_REASONS;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async () => {
    if (!category || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reported_id: reportedId, reason_category: category, details, block: false, context, message_id: messageId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data.error || 'report'), { status: res.status, code: data.code });
      setCategory(null);
      setDetails('');
      onDone(Boolean(data.blocked), Boolean(data.duplicate));
    } catch (err) {
      setError(localizeError(err instanceof Error ? err : null, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm ail-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('report.titleFor', { name })}
    >
      <div
        className="w-full max-w-[480px] max-h-[90dvh] flex flex-col rounded-t-3xl bg-white shadow-xl ail-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-2.5 shrink-0" aria-hidden>
          <div className="w-10 h-1 rounded-full bg-[#EAE9F2] mx-auto mb-2" />
        </div>
        <div className="flex items-start justify-between gap-3 px-5 pb-3 border-b border-[#D0CDE1] shrink-0">
          <div className="min-w-0">
            <h2 className="font-brand text-base font-semibold leading-snug text-[#413B5E]">
              {messageId ? t('report.messageTitle') : t('report.memberTitle')}
            </h2>
            <p className="text-xs text-[#413B5E]/75 leading-relaxed mt-0.5">{t('report.sub')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#EAE9F2]/70 shrink-0"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
          <div className="space-y-2" role="radiogroup" aria-label={t('report.reasonFor', { name })}>
            {reasons.map((c) => {
              const selected = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setCategory(c.id)}
                  className={`w-full flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-[13px] leading-snug transition ${
                    selected ? 'border-[#726E97] bg-[#726E97]/5 text-[#413B5E] font-medium' : 'border-[#D0CDE1] text-[#413B5E] hover:bg-[#EAE9F2]/40'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      selected ? 'border-[#726E97]' : 'border-[#D0CDE1]'
                    }`}
                  >
                    {selected && <span className="w-2 h-2 rounded-full bg-[#726E97]" />}
                  </span>
                  <span>{t(c.label)}</span>
                </button>
              );
            })}
          </div>

          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value.slice(0, 300))}
            maxLength={300}
            rows={3}
            placeholder={t('report.details')}
            className="w-full p-3 rounded-2xl bg-white border border-[#D0CDE1] text-base sm:text-xs text-[#413B5E] placeholder:text-[#413B5E]/55 focus:outline-none focus:border-[#726E97] resize-none"
          />

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[11px] font-semibold text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="px-5 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom,16px))] shrink-0 space-y-1.5">
          <button
            type="button"
            onClick={submit}
            disabled={!category || submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#726E97] text-white rounded-xl py-2.5 font-medium text-sm hover:bg-[#524E75] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('report.submit')}
          </button>
          <button type="button" onClick={onClose} className="w-full py-2 text-slate-600 hover:text-[#413B5E]/85 text-sm">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;
