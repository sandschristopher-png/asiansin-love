'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'fake_profile', label: 'Fake profile, catfish, or stolen photos' },
  { id: 'financial_scam', label: 'Asking for money, wire transfers, crypto, or financial aid' },
  { id: 'commercial_solicitation', label: 'Commercial solicitation, selling content, or escort services' },
  { id: 'inappropriate_content', label: 'Inappropriate photos, nudity, or offensive behavior' },
  { id: 'underage', label: 'Underage member (must be 18+)' },
  { id: 'off_platform_steering', label: 'Aggressive steering off-platform (WhatsApp, Telegram, Line)' },
  { id: 'other', label: 'Other safety concern' },
];

/**
 * Reason-based "Report Profile" bottom sheet (z-[70], above the BottomNav). Posts to /api/reports
 * and, unless unticked, also blocks the member. `onDone(blocked)` fires after a successful report.
 */
export function ReportModal({
  open,
  reportedId,
  name,
  onClose,
  onDone,
}: {
  open: boolean;
  reportedId: string;
  name: string;
  onClose: () => void;
  onDone: (blocked: boolean) => void;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
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
        body: JSON.stringify({ reported_id: reportedId, reason_category: category, details, block: alsoBlock }),
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
          <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-2" />
        </div>
        <div className="flex items-start justify-between gap-3 px-5 pb-3 border-b border-[#F0EDF5] shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#2D264B]">Report Profile</h2>
            <p className="text-xs text-[#8A839E] truncate">{name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C849B] hover:bg-[#F3EFFC] shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
          <div className="space-y-2" role="radiogroup" aria-label="Reason">
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
                    selected ? 'border-[#6555B8] bg-[#6555B8]/5 text-[#2D264B] font-semibold' : 'border-[#ECE8F4] text-[#2D264B] hover:bg-[#F9F8FC]'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      selected ? 'border-[#6555B8]' : 'border-[#CFC8DC]'
                    }`}
                  >
                    {selected && <span className="w-2 h-2 rounded-full bg-[#6555B8]" />}
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
            placeholder="Provide any additional context (optional)..."
            className="w-full p-3 rounded-2xl bg-[#F9F8FC] border border-[#ECE8F4] text-xs text-[#2D264B] placeholder:text-[#A8A1B5] focus:outline-none focus:border-[#6555B8] resize-none"
          />

          <label className="flex items-start gap-2.5 text-xs text-[#2D264B] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={alsoBlock}
              onChange={(e) => setAlsoBlock(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#6555B8]"
            />
            <span>Also block {name} so they cannot view your profile or message you.</span>
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-[11px] font-semibold text-rose-700">
              {error}
            </p>
          )}
        </div>

        <div className="px-5 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom,16px))] shrink-0">
          <button
            type="button"
            onClick={submit}
            disabled={!category || submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#6555B8] hover:bg-[#524496] text-white font-semibold text-sm py-2.5 rounded-full shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;
