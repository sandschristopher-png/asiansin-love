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
        className="inline-flex max-w-[60vw] items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-xl bg-[#F3EFFC] border border-[#6555B8]/20 text-xs font-semibold text-[#6555B8] cursor-pointer active:scale-95 transition"
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <div
            className="w-full max-w-[430px] max-h-[75dvh] flex flex-col rounded-t-3xl bg-white border border-[#DDD7E5] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#F0EDF5] shrink-0">
              <h3 className="text-sm font-bold text-[#1C1924]">{label}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C849B] hover:bg-[#F3EFFC]"
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
                        selected ? 'bg-[#F3EFFC] font-semibold text-[#6555B8]' : 'text-[#1C1924] hover:bg-[#F9F8FC]'
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
