'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function SafetyAccordion({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl transition-colors ${open ? 'bg-[#8574B7]/[0.08]' : 'bg-[#8574B7]/[0.04] hover:bg-[#8574B7]/[0.07]'}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-start justify-between gap-3 w-full text-left cursor-pointer px-4 py-3.5"
      >
        <span className="text-[12.5px] font-bold text-[#413B5E] leading-snug flex-1">{title}</span>
        <ChevronDown className={`w-4 h-4 text-[#8574B7] shrink-0 mt-0.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="px-4 pb-4 pt-1 text-[12px] text-[#655E72] leading-relaxed border-t border-[#8574B7]/10 mt-1">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}