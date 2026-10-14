import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { ShieldCheck, ArrowRight, CheckCircle2, Sparkles, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF9FD] text-[#181126] flex flex-col font-sans selection:bg-[#6555b8]/15 selection:text-[#6555b8]">
      
      {/* Mobile-First App Shell */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-5 pb-20 flex flex-col space-y-6 sm:my-6 sm:bg-white sm:rounded-3xl sm:border sm:border-[#EDE8F5] sm:shadow-xl sm:p-6">
        
        {/* ===================== HERO SECTION ===================== */}
        <section className="flex flex-col items-center text-center space-y-3.5 pt-1">
          
          {/* Top Trust Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6555b8]/10 text-[#6555b8] text-[11px] font-bold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>High-Trust Courtship Sanctuary</span>
          </div>

          {/* Headline */}
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-[#181126]">
              Real Devotion. <br />
              <span className="bg-gradient-to-r from-[#5a48ab] via-[#6555b8] to-[#8d75e0] bg-clip-text text-transparent">
                No Hookup Games.
              </span>
            </h1>
            <p className="text-xs text-[#5B5569] leading-relaxed max-w-xs mx-auto">
              Connecting sincere Southeast Asian women with marriage-minded partners for genuine, lifelong commitment.
            </p>
          </div>

          {/* Sleek Floating Social Proof Pill */}
          <div className="w-full bg-white/90 backdrop-blur-xs rounded-2xl border border-[#EDE8F5] p-3 shadow-xs flex items-center justify-between gap-3 text-left">
            <div className="flex -space-x-2 overflow-hidden py-0.5">
              <div className="relative w-9 h-9 rounded-full ring-2 ring-white overflow-hidden bg-gray-100 shrink-0 shadow-xs">
                <Image src="/jennalyn.png" alt="Jennalyn" fill className="object-cover" />
              </div>
              <div className="relative w-9 h-9 rounded-full ring-2 ring-white overflow-hidden bg-gray-100 shrink-0 shadow-xs">
                <Image src="/anong.png" alt="Anong" fill className="object-cover" />
              </div>
              <div className="relative w-9 h-9 rounded-full ring-2 ring-white overflow-hidden bg-gray-100 shrink-0 shadow-xs">
                <Image src="/suwannarat.png" alt="Suwannarat" fill className="object-cover" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-[#181126] truncate">Verified Profiles</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6555b8] shrink-0" />
              </div>
              <p className="text-[10px] text-[#756D82] truncate">Cebu • Chiang Mai • Bangkok</p>
            </div>

            <span className="text-[10px] font-extrabold text-[#6555b8] bg-[#6555b8]/10 px-2 py-0.5 rounded-full shrink-0">
              100% Real
            </span>
          </div>

          {/* Minimalist Trust Metrics Bar */}
          <div className="w-full grid grid-cols-2 gap-2 py-2.5 px-3 bg-[#F8F7FA] rounded-xl border border-[#EDE8F5]/60 text-center">
            <div>
              <div className="text-base font-black text-[#6555b8]">100%</div>
              <div className="text-[9px] font-bold text-[#756D82] uppercase tracking-wider">Edge-Verified</div>
            </div>
            <div className="border-l border-[#EDE8F5]">
              <div className="text-base font-black text-[#6555b8]">Zero Flings</div>
              <div className="text-[9px] font-bold text-[#756D82] uppercase tracking-wider">Committed Courtship</div>
            </div>
          </div>

          {/* Focused Hero CTA */}
          <div className="w-full flex flex-col items-center gap-2 pt-0.5">
            <Link
              href="/signup"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#6555b8] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#6555b8]/20 hover:bg-[#53449e] active:scale-[0.99] transition cursor-pointer"
            >
              Start Sincere Courtship
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <div className="flex items-center justify-center gap-3 text-xs text-[#5B5569] pt-0.5">
              <Link href="/login" className="font-semibold text-[#6555b8] hover:underline">
                Sign In
              </Link>
              <span>•</span>
              <Link href="/discover" className="hover:underline">
                Browse Directory
              </Link>
            </div>
          </div>
        </section>

        {/* ===================== FOUR VALUE PILLARS (TIGHTENED) ===================== */}
        <section className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#756D82]">
              The Sanctuary Standard
            </span>
            <span className="text-[10px] text-[#6555b8] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 4 Principles
            </span>
          </div>

          {/* Pillar 1: Clear Intentions */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-[#EDE8F5] shadow-xs hover:border-[#6555b8]/30 transition">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <Image
                src="/intention.png"
                alt="Clear relationship intentions"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-bold text-[#6555b8] uppercase tracking-wider block">
                01 • Clarity
              </span>
              <h2 className="text-xs font-bold text-[#181126] leading-tight">
                Clear Intentions Upfront
              </h2>
              <p className="text-[11px] text-[#5B5569] leading-relaxed line-clamp-2 mt-0.5">
                Marriage timeline and family goals stated openly. No guessing games or casual ambiguity.
              </p>
            </div>
          </div>

          {/* Pillar 2: Zero Exploitation */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-[#EDE8F5] shadow-xs hover:border-[#6555b8]/30 transition">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <Image
                src="/woman-no.png"
                alt="Community safety and boundaries"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider block">
                02 • Respect
              </span>
              <h2 className="text-xs font-bold text-[#181126] leading-tight">
                Zero Tourism & Exploitation
              </h2>
              <p className="text-[11px] text-[#5B5569] leading-relaxed line-clamp-2 mt-0.5">
                Proactive filters screen out sex tourists and transactional agencies. Women are treated with genuine dignity.
              </p>
            </div>
          </div>

          {/* Pillar 3: Anti-Scam Reputation */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-[#EDE8F5] shadow-xs hover:border-[#6555b8]/30 transition">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <Image
                src="/red-flags.png"
                alt="Anti-scam reputation system"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-bold text-[#6555b8] uppercase tracking-wider block">
                03 • Accountability
              </span>
              <h2 className="text-xs font-bold text-[#181126] leading-tight">
                Zero Financial Traps
              </h2>
              <p className="text-[11px] text-[#5B5569] leading-relaxed line-clamp-2 mt-0.5">
                Automated detection flags crypto schemes, remit requests, and sob stories to protect members.
              </p>
            </div>
          </div>

          {/* Pillar 4: Location Verification */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-[#EDE8F5] shadow-xs hover:border-[#6555b8]/30 transition">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <Image
                src="/status-approved.png"
                alt="Location verified badge"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">
                04 • Authenticity
              </span>
              <h2 className="text-xs font-bold text-[#181126] leading-tight">
                100% Location Verified
              </h2>
              <p className="text-[11px] text-[#5B5569] leading-relaxed line-clamp-2 mt-0.5">
                Zero location spoofing. Edge network headers cross-reference physical location to block VPN deception.
              </p>
            </div>
          </div>
        </section>

        {/* ===================== BOTTOM CONVERSION ===================== */}
        <section className="pt-2 text-center space-y-2.5">
          <div className="space-y-1">
            <h3 className="text-base font-bold tracking-tight text-[#181126]">
              Ready for an intentional connection?
            </h3>
            <p className="text-xs text-[#5B5569]">
              Join founding members committed to genuine courtship.
            </p>
          </div>

          <div className="w-full pt-0.5">
            <Link
              href="/signup"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#6555b8] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#6555b8]/20 hover:bg-[#53449e] active:scale-[0.99] transition cursor-pointer"
            >
              Create Free Profile
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
