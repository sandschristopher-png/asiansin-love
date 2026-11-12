import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';

export const metadata: Metadata = { title: 'Page not found' };

/**
 * Custom 404. Rendered inside the 480px app column (LayoutShell / AppShell); the fixed panel sits
 * over the app's Navbar and BottomNav (z-50) so the page shows one wordmark and one action.
 * The monkey's map reads "404". The image is a 512px WebP (about 42 KB), sharp at 3x for the 176px display.
 */
export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[60] mx-auto flex w-full max-w-[480px] flex-col bg-white md:border-x md:border-slate-200/60">
      <header className="flex h-14 shrink-0 items-center px-4">
        <BrandLogo href="/" size="header" />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <Image
          src="/404-Monkey.webp"
          alt="Page not found"
          width={176}
          height={176}
          priority
          className="mx-auto mb-4 h-44 w-44 object-contain"
        />
        <h1 className="font-brand text-2xl font-semibold tracking-tight text-[#413B5E]">Page not found</h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
          This route is off the map. Head back to Discover to keep exploring.
        </p>
        <Link
          href="/discover"
          className="mt-8 inline-flex w-full max-w-sm items-center justify-center rounded-full bg-[#8574B7] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#534377] active:scale-95"
        >
          Back to Discover
        </Link>
      </main>
    </div>
  );
}
