import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Heart, AlertTriangle, Lock } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8F7FA] text-[#1C1924] flex flex-col">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#DDD7E5]/60 px-4 py-3 flex items-center gap-3">
        <Link
          href="/discover"
          className="p-1.5 rounded-full hover:bg-[#FAF8FD] text-[#524B5E] hover:text-[#1C1924] transition active:scale-95"
          aria-label="Back to Discover"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-sm font-semibold text-[#1C1924]">Community Guidelines</h1>
          <p className="text-[11px] text-[#756D82]">Standards of Courtship & Trust</p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto p-4 space-y-4 pb-20">
        <div className="bg-white rounded-3xl p-5 border border-[#DDD7E5]/70 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F3EFFC] flex items-center justify-center text-[#6555b8]">
            <Heart className="w-5 h-5 fill-[#6555b8]" />
          </div>
          <h2 className="text-base font-bold text-[#1C1924]">1. Authentic Intentions Only</h2>
          <p className="text-xs text-[#524B5E] leading-relaxed">
            Asians in Love is built exclusively for individuals seeking genuine courtship, dating, and marriage. We actively remove accounts created for casual commercial encounters, content promotion, or deceptive representation.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#DDD7E5]/70 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#1C1924]">2. Zero Financial Solicitation</h2>
          <p className="text-xs text-[#524B5E] leading-relaxed">
            Never send, request, or offer money, emergency relief, allowance, airfare, or digital payments (GCash, Maya, Wise, Crypto). Any account soliciting or offering funds triggers automated quarantine and permanent trust penalties.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#DDD7E5]/70 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#1C1924]">3. Respectful Communication</h2>
          <p className="text-xs text-[#524B5E] leading-relaxed">
            Consent and mutual dignity are mandatory. Harassment, sexually explicit demands, and aggressive pressure to move conversations off-platform result in immediate review and profile pausing.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#DDD7E5]/70 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-[#6555b8]">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#1C1924]">4. Identity Verification</h2>
          <p className="text-xs text-[#524B5E] leading-relaxed">
            To protect our community, all members must complete gesture-based photo verification. Accounts with unverified photos or suspected stolen identities are permanently banned without warning.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#DDD7E5]/70 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#1C1924]">5. Reporting & Enforcement</h2>
          <p className="text-xs text-[#524B5E] leading-relaxed">
            We encourage reporting violations immediately. Our moderation team reviews flagged content within 24 hours. Repeat offenders face permanent suspension and IP-level bans to prevent re-entry.
          </p>
        </div>
      </main>

      <footer className="bg-white border-t border-[#DDD7E5]/60 px-4 py-6 text-center">
        <p className="text-[10px] text-[#756D82]">
          Last updated: October 9, 2026
        </p>
        <Link href="/" className="mt-2 inline-block text-xs font-semibold text-[#6555b8] hover:underline">
          Back to Home
        </Link>
      </footer>
    </div>
  );
}