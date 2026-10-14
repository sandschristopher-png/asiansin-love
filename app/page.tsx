import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { ShieldCheck, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

const PILLARS = [
  {
    principle: "Principle 01",
    title: "Clear Intentions Upfront",
    description:
      "Whether you envision marriage, raising children, or a loyal life partnership, relationship goals are stated upfront. No guessing games.",
    image: "/intention.png",
    alt: "Clear relationship intentions",
  },
  {
    principle: "Principle 02",
    title: "Zero Tourism & Exploitation",
    description:
      "We proactively filter out casual sex tourists, commercial agencies, and transactional solicitation. Women are treated with dignity and care.",
    image: "/woman-no.png",
    alt: "Community safety and boundaries",
  },
  {
    principle: "Principle 03",
    title: "Zero Sob Stories & Scams",
    description:
      "Accountability goes both ways. We screen out money requests, financial sob stories, and lock external contact sharing until 3 substantive turns.",
    image: "/red-flags.png",
    alt: "Anti-scam reputation system",
  },
  {
    principle: "Principle 04",
    title: "Real People. Edge-Verified.",
    description:
      "No location spoofing or VPN syndicates. Every verified member confirms their real physical network edge to earn their Verified shield.",
    image: "/status-approved.png",
    alt: "Verified badge illustration",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF9FD] text-[#181126] flex flex-col font-sans antialiased selection:bg-[#6555b8]/15 selection:text-[#6555b8]">
      
      {/* Mobile-First App Shell (Identical Layout on Mobile & Desktop) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-5 pb-24 flex flex-col space-y-7 sm:my-6 sm:bg-white sm:rounded-3xl sm:border sm:border-[#EDE8F5] sm:shadow-xl sm:p-6">
        
        {/* ===================== HERO SECTION ===================== */}
        <section className="rounded-3xl bg-gradient-to-b from-[#EDE6FA] via-[#F5F2FC] to-white border border-[#EDE8F5] p-5 pt-6 flex flex-col items-center text-center space-y-4 shadow-xs">
          
          {/* Top Trust Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 border border-[#6555b8]/15 text-[#6555b8] text-[11px] font-bold tracking-wide shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6555b8]" />
            <span>High-Trust Courtship Sanctuary</span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-[32px] font-extrabold tracking-tight leading-[1.12] text-[#181126]">
              Real Devotion. <br />
              <span className="bg-gradient-to-r from-[#5a48ab] via-[#6555b8] to-[#8d75e0] bg-clip-text text-transparent">
                No Hookup Games.
              </span>
            </h1>
            <p className="text-xs sm:text-[13px] text-[#5B5569] leading-relaxed max-w-xs mx-auto">
              Connecting sincere Southeast Asian women with marriage-minded partners for genuine, lifelong commitment.
            </p>
          </div>

          {/* Verified Member Social Proof Pill */}
          <div className="w-full bg-white/95 rounded-2xl border border-[#EDE8F5] p-3.5 shadow-2xs flex items-center justify-between gap-3 text-left">
            <div className="flex -space-x-2.5 overflow-hidden py-0.5">
              <div className="relative w-10 h-10 rounded-full ring-2 ring-[#F3EFFC] overflow-hidden bg-gray-100 shrink-0">
                <Image src="/jennalyn.png" alt="Jennalyn" fill sizes="40px" className="object-cover" />
              </div>
              <div className="relative w-10 h-10 rounded-full ring-2 ring-[#F3EFFC] overflow-hidden bg-gray-100 shrink-0">
                <Image src="/anong.png" alt="Anong" fill sizes="40px" className="object-cover" />
              </div>
              <div className="relative w-10 h-10 rounded-full ring-2 ring-[#F3EFFC] overflow-hidden bg-gray-100 shrink-0">
                <Image src="/suwannarat.png" alt="Suwannarat" fill sizes="40px" className="object-cover" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-[#181126] truncate">Verified Members</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6555b8] shrink-0" />
              </div>
              <p className="text-[10.5px] text-[#756D82] truncate">Cebu &bull; Chiang Mai &bull; Khon Kaen</p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-extrabold text-[#6555b8] bg-[#F3EFFC] border border-[#6555b8]/15 px-2.5 py-1 rounded-full">
                100% Real
              </span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="w-full grid grid-cols-2 gap-2 py-3 px-4 bg-[#FAF9FD] rounded-2xl border border-[#EDE8F5]">
            <div className="text-center">
              <div className="text-base font-black bg-gradient-to-r from-[#5a48ab] to-[#8d75e0] bg-clip-text text-transparent">
                100%
              </div>
              <div className="text-[10px] font-bold text-[#5B5569] uppercase tracking-wider">
                Edge-Verified
              </div>
            </div>
            <div className="text-center border-l border-[#EDE8F5]">
              <div className="text-base font-black bg-gradient-to-r from-[#5a48ab] to-[#8d75e0] bg-clip-text text-transparent">
                Zero Flings
              </div>
              <div className="text-[10px] font-bold text-[#5B5569] uppercase tracking-wider">
                Committed Courtship
              </div>
            </div>
          </div>

          {/* Primary Gradient Pill CTA */}
          <div className="w-full flex flex-col items-center gap-2.5 pt-1">
            <Link
              href="/signup"
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#5a48ab] via-[#6555b8] to-[#7c68d4] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#6555b8]/25 hover:opacity-95 active:scale-[0.99] transition cursor-pointer"
            >
              <span>Start Sincere Courtship</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <div className="flex items-center justify-center gap-3 text-xs text-[#5B5569] pt-0.5">
              <Link href="/login" className="font-bold text-[#6555b8] hover:underline">
                Already a member? Sign In
              </Link>
              <span className="text-[#CBC4DA]">&bull;</span>
              <Link href="/discover" className="font-medium hover:text-[#181126] hover:underline">
                Browse Directory
              </Link>
            </div>
          </div>
        </section>

        {/* ===================== FOUR VALUE PILLARS ===================== */}
        {/* With/Pairs Full-Bleed Stage Structure + Your Brand Purple Gradients & Manga Art */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#756D82]">
              The Sanctuary Standard
            </span>
            <span className="text-xs text-[#6555b8] font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 4 Principles
            </span>
          </div>

          <div className="space-y-4">
            {PILLARS.map(({ principle, title, description, image, alt }) => (
              <div
                key={principle}
                className="w-full bg-white rounded-3xl border border-[#EDE8F5] shadow-xs overflow-hidden"
              >
                {/* Edge-to-Edge Soft Lavender Gradient Stage (No Box-in-Box Clutter) */}
                <div className="relative w-full h-44 bg-gradient-to-b from-[#E9E2FA] via-[#F3EFFC] to-[#FAF9FD] flex items-end justify-center pt-4 border-b border-[#EDE8F5]/60">
                  <div className="relative w-52 h-40">
                    <Image
                      src={image}
                      alt={alt}
                      fill
                      sizes="208px"
                      className="object-contain object-bottom"
                    />
                  </div>
                </div>

                {/* Clean Centered Copy */}
                <div className="p-5 text-center space-y-2">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-gradient-to-r from-[#5a48ab]/10 to-[#8d75e0]/15 text-[#6555b8] text-[10px] font-extrabold tracking-wider uppercase">
                    {principle}
                  </span>
                  <h2 className="text-[17px] font-bold text-[#181126] leading-snug">
                    {title}
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#5B5569] leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== BOTTOM CONVERSION ===================== */}
        <section className="rounded-3xl bg-gradient-to-br from-[#4E3BA6] via-[#6555b8] to-[#8d75e0] p-6 text-center text-white space-y-4 shadow-md shadow-[#6555b8]/20">
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold tracking-tight">
              Ready for an intentional connection?
            </h3>
            <p className="text-xs text-white/85 leading-relaxed">
              Join founding members committed to genuine courtship.
            </p>
          </div>

          <Link
            href="/signup"
            className="w-full py-3.5 px-6 rounded-full bg-white text-[#6555b8] text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm hover:bg-[#FAF9FD] active:scale-[0.99] transition cursor-pointer"
          >
            <span>Create Free Profile</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        <Footer />
      </main>
    </div>
  );
}
