import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { ShieldCheck, ArrowRight, CheckCircle2, Heart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF9FD] text-[#181126] flex flex-col font-sans selection:bg-[#6555b8]/15 selection:text-[#6555b8]">
      
      {/* Mobile-First App Shell */}
      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-6 pb-24 flex flex-col space-y-7 sm:my-6 sm:bg-white sm:rounded-3xl sm:border sm:border-[#EDE8F5] sm:shadow-xl sm:p-6">
        
        {/* ===================== HERO SECTION ===================== */}
        <section className="flex flex-col items-center text-center space-y-4 pt-1">
          
          {/* Top Trust Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6555b8]/10 text-[#6555b8] text-[11px] font-bold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>High-Trust Courtship Sanctuary</span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-[#181126]">
              Real Devotion. <br />
              <span className="bg-gradient-to-r from-[#5a48ab] via-[#6555b8] to-[#8d75e0] bg-clip-text text-transparent">
                No Hookup Games.
              </span>
            </h1>
            <p className="text-xs text-[#5B5569] leading-relaxed max-w-xs mx-auto">
              Connecting sincere Southeast Asian women with marriage-minded partners for genuine, lifelong commitment.
            </p>
          </div>

          {/* Real Verified Member Social Proof Card (Replaces Cartoon) */}
          <div className="w-full bg-white rounded-2xl border border-[#EDE8F5] p-4 shadow-xs flex items-center justify-between gap-3 text-left">
            <div className="flex -space-x-2.5 overflow-hidden py-1">
              <div className="relative w-10 h-10 rounded-full ring-2 ring-white overflow-hidden bg-gray-100 shrink-0">
                <Image src="/jennalyn.png" alt="Jennalyn" fill className="object-cover" />
              </div>
              <div className="relative w-10 h-10 rounded-full ring-2 ring-white overflow-hidden bg-gray-100 shrink-0">
                <Image src="/anong.png" alt="Anong" fill className="object-cover" />
              </div>
              <div className="relative w-10 h-10 rounded-full ring-2 ring-white overflow-hidden bg-gray-100 shrink-0">
                <Image src="/suwannarat.png" alt="Suwannarat" fill className="object-cover" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-[#181126] truncate">Verified Members</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6555b8] shrink-0" />
              </div>
              <p className="text-[10px] text-[#756D82] truncate">Cebu &bull; Chiang Mai &bull; Khon Kaen</p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-extrabold text-[#6555b8] bg-[#6555b8]/10 px-2 py-0.5 rounded-full">
                100% Real
              </span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="w-full grid grid-cols-2 gap-2 py-3 px-4 bg-white rounded-2xl border border-[#EDE8F5] shadow-xs">
            <div className="text-center">
              <div className="text-lg font-black text-[#6555b8]">100%</div>
              <div className="text-[10px] font-semibold text-[#5B5569] uppercase tracking-wider">Camera-Verified</div>
            </div>
            <div className="text-center border-l border-[#EDE8F5]">
              <div className="text-lg font-black text-[#6555b8]">Zero Flings</div>
              <div className="text-[10px] font-semibold text-[#5B5569] uppercase tracking-wider">Committed Courtship</div>
            </div>
          </div>

          {/* Single Focused Hero CTA */}
          <div className="w-full flex flex-col items-center gap-2 pt-1">
            <Link
              href="/signup"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#6555b8] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#6555b8]/20 hover:bg-[#53449e] active:scale-[0.99] transition"
            >
              Start Sincere Courtship
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <div className="flex items-center justify-center gap-3 text-xs text-[#5B5569] pt-1">
              <Link href="/login" className="font-semibold text-[#6555b8] hover:underline">
                Already a member? Sign In
              </Link>
              <span>&bull;</span>
              <Link href="/discover" className="hover:underline">
                Browse Directory
              </Link>
            </div>
          </div>
        </section>

        {/* ===================== FOUR VALUE PILLARS ===================== */}
        <section className="space-y-4 pt-2">
          
          {/* Pillar 1: Clear Intentions */}
          <div className="w-full bg-white rounded-3xl border border-[#EDE8F5] p-5 shadow-xs flex flex-col items-center text-center space-y-3">
            <div className="relative w-40 h-32 flex items-end justify-center">
              <Image
                src="/intention.png"
                alt="Clear relationship intentions"
                fill
                className="object-contain object-bottom"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#6555b8] block">
                Principle 01
              </span>
              <h2 className="text-base font-bold text-[#181126]">
                Clear Intentions Upfront
              </h2>
              <p className="text-xs text-[#5B5569] leading-relaxed">
                Whether you envision marriage, raising children, or a loyal life partnership, relationship goals are stated upfront. No guessing games.
              </p>
            </div>
          </div>

          {/* Pillar 2: Community Boundaries */}
          <div className="w-full bg-white rounded-3xl border border-[#EDE8F5] p-5 shadow-xs flex flex-col items-center text-center space-y-3">
            <div className="relative w-40 h-32 flex items-end justify-center">
              <Image
                src="/woman-no.png"
                alt="Community safety and boundaries"
                fill
                className="object-contain object-bottom"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-rose-600 block">
                Principle 02
              </span>
              <h2 className="text-base font-bold text-[#181126]">
                Zero Tourism & Exploitation
              </h2>
              <p className="text-xs text-[#5B5569] leading-relaxed">
                We proactively filter out casual sex tourists, commercial agencies, and transactional solicitation. Women are treated with dignity and care.
              </p>
            </div>
          </div>

          {/* Pillar 3: Mutual Reputation */}
          <div className="w-full bg-white rounded-3xl border border-[#EDE8F5] p-5 shadow-xs flex flex-col items-center text-center space-y-3">
            <div className="relative w-40 h-32 flex items-end justify-center">
              <Image
                src="/red-flags.png"
                alt="Anti-scam reputation system"
                fill
                className="object-contain object-bottom"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#6555b8] block">
                Principle 03
              </span>
              <h2 className="text-base font-bold text-[#181126]">
                Zero Sob Stories & Scams
              </h2>
              <p className="text-xs text-[#5B5569] leading-relaxed">
                Accountability goes both ways. We screen out money requests, financial sob stories, and fake profiles to protect sincere members.
              </p>
            </div>
          </div>

          {/* Pillar 4: Safety & Verification */}
          <div className="w-full bg-white rounded-3xl border border-[#EDE8F5] p-5 shadow-xs flex flex-col items-center text-center space-y-3">
            <div className="relative w-36 h-28 flex items-end justify-center">
              <Image
                src="/verified-nobg.png"
                alt="Hand verified badge"
                fill
                className="object-contain object-bottom"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 block">
                Principle 04
              </span>
              <h2 className="text-base font-bold text-[#181126]">
                Real People. Hand-Verified.
              </h2>
              <p className="text-xs text-[#5B5569] leading-relaxed">
                No stolen photo sets or bots. Every member completes real-time camera pose verification before entering conversations.
              </p>
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Pose-Verified Standard</span>
              </div>
            </div>
          </div>

        </section>

        {/* ===================== BOTTOM CONVERSION ===================== */}
        <section className="pt-2 text-center space-y-3">
          <div className="space-y-1">
            <h3 className="text-lg font-bold tracking-tight text-[#181126]">
              Ready for an intentional connection?
            </h3>
            <p className="text-xs text-[#5B5569]">
              Join founding members committed to genuine courtship.
            </p>
          </div>

          <div className="w-full pt-1">
            <Link
              href="/signup"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#6555b8] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#6555b8]/20 hover:bg-[#53449e] active:scale-[0.99] transition"
            >
              Create Free Profile
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
