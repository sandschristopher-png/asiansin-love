import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ShieldCheck, Sparkles, Compass } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100 overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

      {/* Main Glass Center Card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
        
        {/* Brand Logo */}
        <div className="mb-4">
          <Logo className="h-10 w-10" textSize="text-2xl" />
        </div>

        {/* Brand One-Liner */}
        <p className="text-sm font-medium text-zinc-300">
          Southeast Asian dating, elevated.
        </p>
        <p className="text-xs text-zinc-500 mt-1 mb-6">
          Real singles across the Philippines, Thailand, Vietnam & beyond.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-2xl bg-rose-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition"
          >
            Create Free Account
          </Link>

          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-2xl border border-zinc-750 bg-zinc-800/80 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition"
          >
            Sign In
          </Link>

          <Link
            href="/browse"
            className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Explore member directory</span>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="mt-8 border-t border-zinc-800/80 pt-5 w-full grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Smart Guardian</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            <span>Zero Ad Clutter</span>
          </div>
        </div>

      </div>

      <footer className="mt-8 text-center text-[11px] text-zinc-600">
        &copy; {new Date().getFullYear()} asiansin.love &bull; All rights reserved.
      </footer>
    </div>
  )
}
