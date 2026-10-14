import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

const PILLARS = [
  {
    title: "Clear Intentions Upfront",
    description:
      "Whether you envision marriage, raising children, or a loyal life partnership, relationship goals are stated upfront. No guessing games.",
    image: "/intention.png",
    alt: "Clear relationship intentions",
  },
  {
    title: "Serious Members Only",
    description:
      "We proactively filter out casual hookups, commercial agencies, and transactional solicitation. Every member is treated with genuine respect.",
    image: "/woman-no.png",
    alt: "Community safety and boundaries",
  },
  {
    title: "Scam Screening That Works Both Ways",
    description:
      "Accountability goes both ways. We screen out financial sob stories and lock external contact sharing until both of you exchange 3 meaningful replies.",
    image: "/red-flags.png",
    alt: "Anti-scam reputation system",
  },
  {
    title: "Real People, Real Locations",
    description:
      "No location spoofing or VPN tricks. Every verified member confirms their actual location with GPS, and VPN or proxy users can't fake it.",
    image: "/secured.png",
    alt: "Verified badge illustration",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF9FD] text-[#181126] flex flex-col font-sans antialiased selection:bg-[#6555b8]/15 selection:text-[#6555b8]">
      
      {/* Mobile-First App Shell (Identical on Phone & Desktop) */}
      <main className="flex-1 w-full max-w-md mx-auto bg-white min-h-screen px-5 pt-6 pb-12 flex flex-col space-y-10 sm:my-6 sm:rounded-3xl sm:border sm:border-[#EDE8F5] sm:shadow-xl sm:p-6">
        
        {/* ===================== HERO SECTION ===================== */}
        <section className="rounded-[28px] bg-gradient-to-b from-[#E5DDFB] via-[#F2EEFC] to-[#FAF9FD] p-5 pt-6 flex flex-col items-center text-center space-y-4">
          
          {/* Top Trust Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 text-[#6555b8] text-[11px] font-bold tracking-wide shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6555b8]" />
            <span>GPS-Verified, Scam-Free Matching</span>
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
              Meet sincere Southeast Asian women looking for marriage, not money or games.
            </p>
          </div>

          {/* Verified Member Social Proof Pill */}
          <div className="w-full bg-white rounded-2xl p-3.5 shadow-2xs flex items-center justify-between gap-3 text-left">
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
                <span className="text-xs font-bold text-[#181126] truncate">GPS-Verified Members</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6555b8] shrink-0" />
              </div>
              <p className="text-[10.5px] text-[#756D82] truncate">Cebu &bull; Chiang Mai &bull; Bangkok</p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-extrabold text-[#6555b8] bg-[#F3EFFC] px-2.5 py-1 rounded-full">
                Scam-Filtered
              </span>
            </div>
          </div>

          {/* Primary Gradient Pill CTA */}
          <div className="w-full flex flex-col items-center gap-2.5 pt-1">
            <Link
              href="/signup"
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#5a48ab] via-[#6555b8] to-[#8d75e0] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#6555b8]/25 hover:opacity-95 active:scale-[0.99] transition cursor-pointer"
            >
              <span>Create Your Free Profile</span>
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

        {/* ===================== TRUST & SAFETY ===================== */}
        <section className="space-y-7 px-1">
          <div className="space-y-1">
            <span className="text-sm font-extrabold text-[#6555b8] tracking-tight block">
              Platform Standards
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#181126]">
              Built for Serious Courtship
            </h2>
          </div>

          {/* Uniform Stack: Centered Illustrations (like with.is) */}
          <div className="space-y-8">
            {PILLARS.map(({ title, description, image, alt }) => {
              return (
                <div key={title} className="space-y-3.5">
                  
                  {/* Purple Gradient Stage - Centered content like with.is */}
                  <div className="relative w-full h-52 rounded-[28px] bg-gradient-to-b from-[#E3DAFA] via-[#EDE6FC] to-[#F5F2FD] flex items-center justify-center px-4 overflow-hidden shadow-2xs">
                    <div className="relative w-60 h-44">
                      <Image
                        src={image}
                        alt={alt}
                        fill
                        sizes="240px"
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>

                  {/* Left-Aligned Title in Brand Purple + Crisp Body Copy */}
                  <div className="space-y-1.5 px-1">
                    <h3 className="text-xl font-extrabold text-[#6555b8] leading-snug tracking-tight">
                      {title}
                    </h3>
                    <p className="text-[13.5px] text-[#4A4458] leading-relaxed">
                      {description}
                    </p>
                  </div>

                </div>
              );
            })}
          </div>
        </section>

        {/* ===================== BOTTOM CONVERSION ===================== */}
        <section className="rounded-[28px] bg-gradient-to-br from-[#5a48ab] via-[#6555b8] to-[#8d75e0] p-6 text-center text-white space-y-4 shadow-md shadow-[#6555b8]/20">
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold tracking-tight">
              Ready for an intentional connection?
            </h3>
            <p className="text-xs text-white/85 leading-relaxed">
              Join founding members committed to genuine courtship (free while we&apos;re new).
            </p>
          </div>

          <Link
            href="/signup"
            className="w-full py-3.5 px-6 rounded-full bg-white text-[#6555b8] text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm hover:bg-[#FAF9FD] active:scale-[0.99] transition cursor-pointer"
          >
            <span>Create Your Free Profile</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        <Footer />
      </main>
    </div>
  );
}
