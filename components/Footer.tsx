'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full mt-auto pt-8 pb-24 px-4 text-center border-t border-[#DDD7E5]/50 bg-[#FAF8FD]/90">
      <div className="flex flex-col items-center justify-center gap-2 text-xs text-[#756D82]">
        <div className="flex items-center gap-2 text-[11px] font-medium text-[#524B5E]">
          <span>Asians in Love</span>
          <span className="text-[#DDD7E5]">•</span>
          <span>Serious Courtship</span>
          <span className="text-[#DDD7E5]">•</span>
          <span>© 2026</span>
        </div>

        <nav aria-label="Legal & Safety" className="flex items-center gap-3.5 text-xs text-[#6555B8] font-medium">
          <Link href="/privacy" className="hover:underline underline-offset-2">
            Privacy Policy
          </Link>
          <span className="text-[#DDD7E5]">•</span>
          <Link href="/terms" className="hover:underline underline-offset-2">
            Terms of Use
          </Link>
          <span className="text-[#DDD7E5]">•</span>
          <Link href="/terms#safety" className="hover:underline underline-offset-2">
            Safety
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
