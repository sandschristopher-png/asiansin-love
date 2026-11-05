'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';

/** Must match REPORT_CATEGORIES in app/api/reports/route.ts. */
const CATEGORIES: { id: string; label: string }[] = [
  { id: 'commercial_solicitation', label: 'Commercial solicitation / Selling services or products' },
  { id: 'financial_scam', label: 'Asking for money / Financial fraud' },
  { id: 'off_platform_steering', label: 'Asking for off-platform contact too quickly (WhatsApp/Telegram/Line)' },
  { id: 'inappropriate_content', label: 'Inappropriate or abusive language' },
  { id: 'fake_profile', label: 'Fake photos or impersonation' },
  { id: 'underage', label: 'Underage member (must be 18+)' },
  { id: 'other', label: 'Other community concern' },
];

/**
 * "Report Member" bottom sheet (z-[70], above the BottomNav). Posts to /api/reports, which files a
 * pending report for the admin review queue. Blocking is offered afterwards by the caller
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
  onDone: (blocked: boolean) => void;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (!res.ok) throw new Error(data.error || 'Could not submit your report.');
      setCategory(null);
      setDetails('');
      onDone(Boolean(data.blocked));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your report.');
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
      aria-label={`Report ${name}`}
    >
      <div
        className="w-full max-w-[430px] max-h-[90dvh] flex flex-col rounded-t-3xl bg-white shadow-xl ail-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-2.5 shrink-0" aria-hidden>
          <div className="w-10 h-1 rounded-full bg-[#E8DFF5] mx-auto mb-2" />
        </div>
        <div className="flex items-start justify-between gap-3 px-5 pb-3 border-b border-[#D5C6EC] shrink-0">
          <div className="min-w-0">
            <h2 className="font-brand text-base font-bold text-[#51376D]">{messageId ? 'Report Message' : 'Report Member'}</h2>
            <p className="text-xs text-[#51376D]/75 leading-relaxed mt-0.5">
              Reports are confidential. We review every report to protect community safety.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#51376D]/55 hover:bg-[#E8DFF5]/70 shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
          <div className="space-y-2" role="radiogroup" aria-label={`Reason for reporting ${name}`}>
            {CATEGORIES.map((c) => {
              const selected = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setCategory(c.id)}
                  className={`w-full flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-[13px] transition ${
                    selected ? 'border-[#72519A] bg-[#72519A]/5 text-[#51376D] font-semibold' : 'border-[#D5C6EC] text-[#51376D] hover:bg-[#E8DFF5]/40'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      selected ? 'border-[#72519A]' : 'border-[#D5C6EC]'
                    }`}
                  >
                    {selected && <span className="w-2 h-2 rounded-full bg-[#72519A]" />}
                  </span>
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value.slice(0, 300))}
            maxLength={300}
            rows={3}
            placeholder="Provide additional context (optional)..."
            className="w-full p-3 rounded-2xl bg-white border border-[#D5C6EC] text-base sm:text-xs text-[#51376D] placeholder:text-[#51376D]/55 focus:outline-none focus:border-[#72519A] resize-none"
          />

          {error && (
            <p role="alert" className="rounded-xl bg-[#E8DFF5]/50 border border-[#D5C6EC] px-3 py-2 text-[11px] font-semibold text-[#51376D]">
              {error}
            </p>
          )}
        </div>

        <div className="px-5 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom,16px))] shrink-0 space-y-1.5">
          <button
            type="button"
            onClick={submit}
            disabled={!category || submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#51376D] text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-[#51376D] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Report
          </button>
          <button type="button" onClick={onClose} className="w-full py-2 text-[#51376D]/55 hover:text-[#51376D]/85 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;
