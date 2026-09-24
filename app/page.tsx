import Link from 'next/link'
import { Heart, ShieldCheck, MessageCircle, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-sans text-zinc-100">
      {/* Navbar */}
      <header className="flex items-center justify-between border-b border-zinc-900 px-6 py-5">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 fill-rose-600 text-rose-600" />
          <span className="text-xl font-bold tracking-tight text-white">asiansin.love</span>
        </div>
        <Link
          href="/login"
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:border-zinc-700 hover:text-white"
        >
          Log In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3.5 py-1.5 text-xs font-medium text-rose-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Simple, Honest Cross-Border Connections</span>
        </div>

        <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Meet Verified Asian Singles Without the Clutter
        </h1>

        <p className="mt-4 max-w-xl text-base text-zinc-400 sm:text-lg">
          No fake paywalls on basic chats, no inflated matching algorithms. Connect directly with authentic members across Asia with built-in safety protection.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="flex items-center justify-center rounded-xl bg-rose-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/40 transition hover:bg-rose-500"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            Browse Members
          </Link>
        </div>

        {/* Value Props */}
        <div className="mt-16 grid max-w-3xl grid-cols-1 gap-6 border-t border-zinc-900 pt-12 sm:grid-cols-3 text-left">
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-4">
            <ShieldCheck className="h-5 w-5 text-rose-500" />
            <h3 className="mt-2 text-sm font-semibold text-white">Smart Guardian</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Built-in detection flags off-platform solicitations and suspicious finance requests early.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-4">
            <MessageCircle className="h-5 w-5 text-rose-500" />
            <h3 className="mt-2 text-sm font-semibold text-white">Direct Real-Time Chat</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Immediate delivery with no hidden message unblur fees or fake bots.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-4">
            <Heart className="h-5 w-5 text-rose-500" />
            <h3 className="mt-2 text-sm font-semibold text-white">Targeted Matching</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Curated for foreign men seeking women in the Philippines, Thailand, Vietnam, and beyond.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-6 text-center text-xs text-zinc-500">
        © 2026 asiansin.love. All rights reserved.
      </footer>
    </div>
  )
}