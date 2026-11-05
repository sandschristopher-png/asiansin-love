import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export interface LegalSection {
  title: string;
  body: React.ReactNode;
}

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/safety', label: 'Safety' },
];

/** Static legal / policy page inside the 430px app column (Terms, Privacy, Safety). */
export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: React.ReactNode;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-full bg-white text-[#51376D]">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#51376D]/85 hover:text-[#72519A] hover:bg-[#E8DFF5]/70 transition"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#72519A]">{eyebrow}</p>
          <h1 className="text-sm font-bold text-[#51376D] truncate">{title}</h1>
        </div>
      </header>

      <main className="w-full max-w-[430px] mx-auto px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom,24px))] space-y-3">
        <div className="p-4 rounded-3xl bg-white border border-[#D5C6EC] space-y-2">
          <div className="text-xs text-[#51376D]/85 leading-relaxed space-y-2">{intro}</div>
          <p className="text-[10px] text-[#51376D]/55">Last updated {updated}</p>
        </div>

        {sections.map((s, i) => (
          <section key={s.title} className="p-4 rounded-3xl bg-white border border-[#D5C6EC] space-y-2">
            <h2 className="text-[13px] font-bold text-[#51376D]">
              {i + 1}. {s.title}
            </h2>
            <div className="text-xs text-[#51376D]/85 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_a]:font-semibold [&_a]:text-[#72519A] [&_a]:underline">
              {s.body}
            </div>
          </section>
        ))}

        <nav className="flex items-center justify-center gap-4 pt-2 text-[11px] font-semibold text-[#72519A]">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
