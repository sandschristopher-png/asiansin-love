'use client';

import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

/**
 * Pill-style select that opens a bottom sheet. The sheet renders at z-[70] with a dark backdrop,
 * so it always covers the floating BottomNav (z-50), unlike a native <select> on some phones.
 */
export function SelectSheet({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  // Close on Escape and keep the page behind from scrolling while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${label}: ${value || placeholder}`}
        className="inline-flex max-w-[60vw] items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-xl bg-[#E8DFF5]/60 border border-[#72519A]/20 text-xs font-semibold text-[#72519A] cursor-pointer active:scale-95 transition"
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm ail-fade-in"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <div
            className="w-full max-w-[430px] max-h-[75dvh] flex flex-col rounded-t-3xl bg-white border border-[#D5C6EC] shadow-xl ail-sheet-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-2.5 shrink-0" aria-hidden>
              <div className="w-10 h-1 rounded-full bg-[#E8DFF5] mx-auto mb-3" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 border-b border-[#D5C6EC] shrink-0">
              <h3 className="text-sm font-bold text-[#51376D]">{label}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#51376D]/55 hover:bg-[#E8DFF5]/70"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="overflow-y-auto px-3 py-2 pb-[calc(1rem+env(safe-area-inset-bottom,16px))]">
              {options.map((opt) => {
                const selected = opt === value;
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(opt);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-left text-sm transition ${
                        selected ? 'bg-[#E8DFF5]/60 font-semibold text-[#72519A]' : 'text-[#51376D] hover:bg-[#E8DFF5]/40'
                      }`}
                    >
                      <span>{opt}</span>
                      {selected && <Check className="w-4 h-4" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
