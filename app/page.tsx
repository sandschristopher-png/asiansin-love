import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { ShieldCheck, ArrowRight, CheckCircle2, Lock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8F7FB] text-[#181126] flex flex-col font-sans selection:bg-[#6555b8]/15 selection:text-[#6555b8]">
      
      {/* Mobile-First App Shell Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-6 pb-28 flex flex-col space-y-8 sm:my-6 sm:bg-white sm:rounded-3xl sm:border sm:border-[#EDE8F5] sm:shadow-xl sm:p-6">
        
        {/* ===================== HERO SECTION ===================== */}
        <section className="flex flex-col items-center text-center space-y-4 pt-2">
          
          {/* Top Trust Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6555b8]/10 text-[#6555b8] text-[11px] font-bold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified International Courtship</span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-[#181126]">
              Real Partnership, <br />
              <span className="bg-gradient-to-r from-[#5a48ab] via-[#6555b8] to-[#8d75e0] bg-clip-text text-transparent">
                No Hookup Culture
              </span>
            </h1>
            <p className="text-xs text-[#5B5569] leading-relaxed max-w-xs mx-auto">
              A dignified sanctuary connecting sincere women across Southeast Asia with marriage-minded partners for genuine, lifelong commitment.
            </p>
          </div>

          {/* Hero Illustration */}
          <div className="relative w-full max-w-[310px] aspect-4/3 mx-auto flex items-end justify-center">
            <Image
              src="/hero-couple.png"
              alt="Authentic courtship couple"
              fill
              priority
              className="object-contain object-bottom"
            />
          </div>

          {/* Stats Bar */}
          <div className="w-full grid grid-cols-2 gap-2 py-3 px-4 bg-[#FAF9FD] rounded-2xl border border-[#EDE8F5]">
            <div className="text-center">
              <div className="text-lg font-black text-[#6555b8]">100%</div>
              <div className="text-[10px] font-semibold text-[#5B5569] uppercase tracking-wider">Camera-Verified</div>
            </div>
            <div className="text-center border-l border-[#EDE8F5]">
              <div className="text-lg font-black text-[#6555b8]">Zero Flings</div>
              <div className="text-[10px] font-semibold text-[#5B5569] uppercase tracking-wider">Committed Courtship</div>
            </div>
          </div>

          {/* Immediate Above-the-Fold CTAs */}
          <div className="w-full flex flex-col gap-2.5 pt-1">
            <Link
              href="/signup"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#6555b8] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#6555b8]/20 hover:bg-[#53449e] active:scale-[0.99] transition"
            >
              Start Sincere Courtship
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/discover"
              className="w-full py-3 px-6 rounded-2xl bg-white text-[#6555b8] border border-[#EDE8F5] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#FAF9FD] transition shadow-xs"
            >
              Browse Verified Directory
            </Link>
          </div>
        </section>

        {/* ===================== PILLAR CARDS ===================== */}
        <section className="space-y-4">
          
          {/* Pillar 1: Clear Intentions */}
          <div className="w-full bg-white rounded-3xl border border-[#EDE8F5] p-5 shadow-xs flex flex-col items-center text-center space-y-3">
            <div className="relative w-44 h-36 flex items-end justify-center">
              <Image
                src="/intention.png"
                alt="Hand over heart intention"
                fill
                className="object-contain object-bottom"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#6555b8] block">
                Clear Intentions
              </span>
              <h2 className="text-base font-bold text-[#181126]">
                Connect on What Truly Matters
              </h2>
              <p className="text-xs text-[#5B5569] leading-relaxed">
                Whether you envision marriage, raising children, or finding a loyal partner for life, every profile states relationship goals upfront so nobody wastes time guessing.
              </p>
            </div>
          </div>

          {/* Pillar 2: Community Boundaries */}
          <div className="w-full bg-white rounded-3xl border border-[#EDE8F5] p-5 shadow-xs flex flex-col items-center text-center space-y-3">
            <div className="relative w-44 h-36 flex items-end justify-center">
              <Image
                src="/woman-no.png"
                alt="Community safety and boundaries"
                fill
                className="object-contain object-bottom"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-rose-600 block">
                Community Boundaries
              </span>
              <h2 className="text-base font-bold text-[#181126]">
                Not Another Hookup Portal
              </h2>
              <p className="text-xs text-[#5B5569] leading-relaxed">
                We proactively filter out casual sex tourists, commercial agencies, and bad actors looking for vacation entertainment. This is a sanctuary where women are treated with dignity.
              </p>
            </div>
          </div>

          {/* Pillar 3: Mutual Reputation */}
          <div className="w-full bg-white rounded-3xl border border-[#EDE8F5] p-5 shadow-xs flex flex-col items-center text-center space-y-3">
            <div className="relative w-44 h-36 flex items-end justify-center">
              <Image
                src="/red-flags.png"
                alt="Community reputation and red flag protection"
                fill
                className="object-contain object-bottom"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#6555b8] block">
                Mutual Reputation
              </span>
              <h2 className="text-base font-bold text-[#181126]">
                Zero Sob Stories & Scams
              </h2>
              <p className="text-xs text-[#5B5569] leading-relaxed">
                Accountability goes both ways. We actively screen and remove financial sob stories, money requests, allowance scams, and fake profiles � protecting sincere members from transactional games.
              </p>
            </div>
          </div>

          {/* Pillar 4: Safety & Verification */}
          <div className="w-full bg-white rounded-3xl border border-[#EDE8F5] p-5 shadow-xs flex flex-col items-center text-center space-y-3">
            <div className="relative w-40 h-32 flex items-end justify-center">
              <Image
                src="/verified-nobg.png"
                alt="Verified badge"
                fill
                className="object-contain object-bottom"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 block">
                Safety First
              </span>
              <h2 className="text-base font-bold text-[#181126]">
                Real People. Hand-Verified.
              </h2>
              <p className="text-xs text-[#5B5569] leading-relaxed">
                No catfishes, bots, or stolen photo sets. Every member completes dynamic camera pose verification before entering conversations, ensuring mutual trust from the first message.
              </p>
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>100% Pose-Verified Standard</span>
              </div>
            </div>
          </div>

        </section>

        {/* ===================== BOTTOM CONVERSION BLOCK ===================== */}
        <section className="pt-2 text-center space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight text-[#181126]">
              Ready for a genuine connection?
            </h3>
            <p className="text-xs text-[#5B5569]">
              Join a community built for lasting respect and real partnership.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 w-full pt-1">
            <Link
              href="/signup"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#6555b8] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#6555b8]/20 hover:bg-[#53449e] active:scale-[0.99] transition"
            >
              Start Free Courtship
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full py-3 px-6 rounded-2xl bg-white text-[#5B5569] border border-[#DDD7E5] text-xs font-semibold flex items-center justify-center hover:bg-[#FAF8FD] transition"
            >
              Sign In to Existing Account
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
