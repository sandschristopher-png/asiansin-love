'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#DDD7E5]/60 bg-[#FAFAFD] py-5 px-4 text-center">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#756D82]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1C1924]">Asians in Love</span>
          <span>•</span>
          <span>Serious Courtship</span>
          <span>•</span>
          <span>© 2026</span>
        </div>

        <nav aria-label="Legal & Safety" className="flex items-center gap-4 text-[#6555b8] font-medium">
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
