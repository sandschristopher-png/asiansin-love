import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { ShieldCheck, ArrowRight, CheckCircle2, Heart } from "lucide-react";

/**
 * Custom "With"-Style Japanese Monoline Vector Illustrations
 * Uniform rounded berry/plum strokes (#7A2048 / #4E3580), warm cream skin (#FFF1E6),
 * butter-yellow accents (#FFF0AD), and signature 4-point sparkles.
 */

function IllustrationIntentions() {
  return (
    <svg viewBox="0 0 320 170" fill="none" className="w-full h-full">
      {/* 4-Point Sparkles */}
      <g stroke="#8E244D" strokeWidth="2.5" strokeLinecap="round">
        <line x1="68" y1="38" x2="68" y2="44" />
        <line x1="68" y1="52" x2="68" y2="58" />
        <line x1="58" y1="48" x2="64" y2="48" />
        <line x1="72" y1="48" x2="78" y2="48" />

        <line x1="252" y1="32" x2="252" y2="38" />
        <line x1="252" y1="46" x2="252" y2="52" />
        <line x1="242" y1="42" x2="248" y2="42" />
        <line x1="256" y1="42" x2="262" y2="42" />
      </g>

      {/* Center Floating Heart Badge */}
      <circle cx="160" cy="44" r="18" fill="#FFFFFF" stroke="#8E244D" strokeWidth="2.5" />
      <path
        d="M160 52C160 52 150 45.5 150 39.5C150 36.5 152.4 34.5 155 34.5C157 34.5 158.8 35.6 160 37.2C161.2 35.6 163 34.5 165 34.5C167.6 34.5 170 36.5 170 39.5C170 45.5 160 52 160 52Z"
        fill="#F8839B"
        stroke="#8E244D"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Left Character (Woman) */}
      <g>
        {/* Hair Back */}
        <path d="M92 84C92 68 104 58 118 58C132 58 144 68 144 84V115H92V84Z" fill="#B84A58" stroke="#8E244D" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Shoulders / Top */}
        <path d="M84 162L90 124C92 116 99 112 108 112H128C137 112 144 116 146 124L152 162" fill="#FFF0AD" stroke="#8E244D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* White Collar / Inner Shirt */}
        <path d="M108 112L118 130L128 112" fill="#FFFFFF" stroke="#8E244D" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Neck */}
        <rect x="112" y="100" width="12" height="14" fill="#FFF1E6" stroke="#8E244D" strokeWidth="2.5" />
        {/* Face */}
        <path d="M98 82C98 70 106 62 118 62C130 62 138 70 138 82C138 95 129 103 118 103C107 103 98 95 98 82Z" fill="#FFF1E6" stroke="#8E244D" strokeWidth="2.5" />
        {/* Hair Bangs */}
        <path d="M98 80C102 70 112 65 124 65C131 65 136 70 138 77" stroke="#8E244D" strokeWidth="2.5" strokeLinecap="round" />
        {/* Eyes & Smile */}
        <circle cx="111" cy="83" r="2" fill="#8E244D" />
        <circle cx="125" cy="83" r="2" fill="#8E244D" />
        <path d="M114 91C116 93 120 93 122 91" stroke="#8E244D" strokeWidth="2.2" strokeLinecap="round" />
      </g>

      {/* Right Character (Man) */}
      <g>
        {/* Shoulders / Sweater */}
        <path d="M168 162L174 122C176 114 183 110 192 110H214C223 110 230 114 232 122L238 162" fill="#FFFFFF" stroke="#8E244D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Yellow Collar */}
        <path d="M192 110L203 124L214 110" fill="#FFF0AD" stroke="#8E244D" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Neck */}
        <rect x="197" y="98" width="12" height="14" fill="#FFF1E6" stroke="#8E244D" strokeWidth="2.5" />
        {/* Hair Back */}
        <path d="M180 74C180 60 190 52 203 52C216 52 226 60 226 74C226 80 223 85 220 88H186C183 85 180 80 180 74Z" fill="#C4535A" stroke="#8E244D" strokeWidth="2.5" />
        {/* Face */}
        <path d="M183 80C183 68 191 60 203 60C215 60 223 68 223 80C223 93 214 101 203 101C192 101 183 93 183 80Z" fill="#FFF1E6" stroke="#8E244D" strokeWidth="2.5" />
        {/* Eyes & Smile */}
        <circle cx="196" cy="81" r="2" fill="#8E244D" />
        <circle cx="210" cy="81" r="2" fill="#8E244D" />
        <path d="M199 89C201 91 205 91 207 89" stroke="#8E244D" strokeWidth="2.2" strokeLinecap="round" />
      </g>

      {/* Bottom Desk / Horizon Line */}
      <line x1="56" y1="162" x2="264" y2="162" stroke="#8E244D" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function IllustrationModeration() {
  return (
    <svg viewBox="0 0 320 170" fill="none" className="w-full h-full">
      {/* Chair Back */}
      <path d="M118 68C118 59 125 52 134 52H186C195 52 202 59 202 68V138H118V68Z" fill="#F9B4C0" stroke="#8E244D" strokeWidth="2.5" />
      {/* Hair & Ponytail */}
      <path d="M136 62C136 46 146 36 160 36C174 36 184 46 184 62V86H136V62Z" fill="#B84A58" stroke="#8E244D" strokeWidth="2.5" />
      {/* Headset Band */}
      <path d="M132 64C132 45 144 32 160 32C176 32 188 45 188 64" stroke="#8E244D" strokeWidth="3" strokeLinecap="round" />
      <rect x="128" y="58" width="8" height="14" rx="4" fill="#F9B4C0" stroke="#8E244D" strokeWidth="2.5" />
      <rect x="184" y="58" width="8" height="14" rx="4" fill="#F9B4C0" stroke="#8E244D" strokeWidth="2.5" />

      {/* Yellow Blazer & White Top */}
      <path d="M116 138L124 98C126 91 133 86 141 86H179C187 86 194 91 196 98L204 138H116Z" fill="#FFF0AD" stroke="#8E244D" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M148 86L160 116L172 86H148Z" fill="#FFFFFF" stroke="#8E244D" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Neck & Head */}
      <rect x="154" y="76" width="12" height="12" fill="#FFF1E6" stroke="#8E244D" strokeWidth="2.5" />
      <path d="M139 60C139 47 148 39 160 39C172 39 181 47 181 60C181 73 172 82 160 82C148 82 139 73 139 60Z" fill="#FFF1E6" stroke="#8E244D" strokeWidth="2.5" />
      {/* Bangs */}
      <path d="M140 56C146 47 158 43 172 45C177 46 180 50 181 55" stroke="#8E244D" strokeWidth="2.5" strokeLinecap="round" />
      {/* Eyes, Smile & Headset Mic */}
      <circle cx="152" cy="61" r="2" fill="#8E244D" />
      <circle cx="168" cy="61" r="2" fill="#8E244D" />
      <path d="M156 69C158 71 162 71 164 69" stroke="#8E244D" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M184 68L169 71" stroke="#8E244D" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="167" cy="71" r="2.5" fill="#F8839B" stroke="#8E244D" strokeWidth="2" />

      {/* Desk Line & Laptop */}
      <line x1="68" y1="138" x2="252" y2="138" stroke="#8E244D" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M126 146L132 134H188L194 146C195 148 193 151 190 151H130C127 151 125 148 126 146Z" fill="#FFFFFF" stroke="#8E244D" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="104" cy="145" rx="8" ry="6" fill="#FFFFFF" stroke="#8E244D" strokeWidth="2.5" />
    </svg>
  );
}

function IllustrationVerifiedPhone() {
  return (
    <svg viewBox="0 0 320 170" fill="none" className="w-full h-full">
      {/* 4-Point Sparkles (Exact With Style) */}
      <g stroke="#8E244D" strokeWidth="2.5" strokeLinecap="round">
        <line x1="88" y1="54" x2="88" y2="60" />
        <line x1="88" y1="68" x2="88" y2="74" />
        <line x1="78" y1="64" x2="84" y2="64" />
        <line x1="92" y1="64" x2="98" y2="64" />

        <line x1="232" y1="38" x2="232" y2="44" />
        <line x1="232" y1="52" x2="232" y2="58" />
        <line x1="222" y1="48" x2="228" y2="48" />
        <line x1="236" y1="48" x2="242" y2="48" />
      </g>

      {/* Torso / White Sweater */}
      <path d="M106 162L114 102C116 92 125 85 136 85H184C195 85 204 92 206 102L214 162H106Z" fill="#FFFFFF" stroke="#8E244D" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Yellow Collar */}
      <path d="M144 85L160 99L176 85H144Z" fill="#FFF0AD" stroke="#8E244D" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Neck & Head */}
      <rect x="153" y="72" width="14" height="15" fill="#FFF1E6" stroke="#8E244D" strokeWidth="2.5" />
      <path d="M135 50C135 35 146 25 160 25C174 25 185 35 185 50C185 56 182 61 178 65H142C138 61 135 56 135 50Z" fill="#C4535A" stroke="#8E244D" strokeWidth="2.5" />
      <path d="M139 56C139 43 148 34 160 34C172 34 181 43 181 56C181 69 172 78 160 78C148 78 139 69 139 56Z" fill="#FFF1E6" stroke="#8E244D" strokeWidth="2.5" />

      {/* Eyes & Smile */}
      <circle cx="152" cy="57" r="2.2" fill="#8E244D" />
      <circle cx="168" cy="57" r="2.2" fill="#8E244D" />
      <path d="M155 65C157.5 67.5 162.5 67.5 165 65" stroke="#8E244D" strokeWidth="2.2" strokeLinecap="round" />

      {/* Smartphone in Center */}
      <rect x="148" y="96" width="24" height="38" rx="4" fill="#DCECCB" stroke="#8E244D" strokeWidth="2.5" />
      {/* Hands Holding Phone */}
      <path d="M138 118C138 112 143 108 148 108V128C143 128 138 124 138 118Z" fill="#FFF1E6" stroke="#8E244D" strokeWidth="2.5" />
      <path d="M182 118C182 112 177 108 172 108V128C177 128 182 124 182 118Z" fill="#FFF1E6" stroke="#8E244D" strokeWidth="2.5" />
    </svg>
  );
}

function IllustrationRespectShield() {
  return (
    <svg viewBox="0 0 320 170" fill="none" className="w-full h-full">
      {/* Sparkles */}
      <g stroke="#8E244D" strokeWidth="2.5" strokeLinecap="round">
        <line x1="82" y1="44" x2="82" y2="50" />
        <line x1="82" y1="58" x2="82" y2="64" />
        <line x1="72" y1="54" x2="78" y2="54" />
        <line x1="86" y1="54" x2="92" y2="54" />

        <line x1="238" y1="44" x2="238" y2="50" />
        <line x1="238" y1="58" x2="238" y2="64" />
        <line x1="228" y1="54" x2="234" y2="54" />
        <line x1="242" y1="54" x2="248" y2="54" />
      </g>

      {/* Center Sanctuary Shield */}
      <path
        d="M160 30L202 46V84C202 114 184 136 160 146C136 136 118 114 118 84V46L160 30Z"
        fill="#FFFFFF"
        stroke="#8E244D"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path
        d="M160 42L190 54V82C190 105 177 122 160 131C143 122 130 105 130 82V54L160 42Z"
        fill="#FFF0AD"
        stroke="#8E244D"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Checkmark Inside Shield */}
      <path
        d="M148 86L156 94L174 76"
        stroke="#8E244D"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PILLARS = [
  {
    point: "POINT 01",
    title: "Clear Intentions Upfront",
    description:
      "Marriage timeline, family desires, and relocation flexibility are shared clearly on every profile so you never waste time guessing.",
    stageBg: "bg-[#FDD8DD]",
    badgeText: "text-[#9E1B40]",
    badgeBg: "bg-[#FDD8DD]/70",
    Illustration: IllustrationIntentions,
  },
  {
    point: "POINT 02",
    title: "Zero Tourism & Exploitation",
    description:
      "We proactively filter out casual sex tourists, commercial agencies, and transactional solicitation. Every member is treated with genuine dignity.",
    stageBg: "bg-[#EDE7FA]",
    badgeText: "text-[#5842A6]",
    badgeBg: "bg-[#EDE7FA]",
    Illustration: IllustrationRespectShield,
  },
  {
    point: "POINT 03",
    title: "24/7 Anti-Scam & Chat Gate",
    description:
      "External contact sharing stays locked until both partners exchange 3 substantive messages—stopping off-platform scammers and money requests cold.",
    stageBg: "bg-[#FDD8DD]",
    badgeText: "text-[#9E1B40]",
    badgeBg: "bg-[#FDD8DD]/70",
    Illustration: IllustrationModeration,
  },
  {
    point: "POINT 04",
    title: "Edge-Verified Real Members",
    description:
      "Zero location spoofing or VPN syndicates. Our network edge confirms real physical country connections before awarding the Verified badge.",
    stageBg: "bg-[#EDE7FA]",
    badgeText: "text-[#5842A6]",
    badgeBg: "bg-[#EDE7FA]",
    Illustration: IllustrationVerifiedPhone,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F7F3F8] text-[#1E162B] flex flex-col font-sans antialiased selection:bg-[#6555b8]/15 selection:text-[#6555b8]">
      
      {/* Strictly Unified Mobile-First App Column (Identical on Mobile & Desktop) */}
      <main className="flex-1 w-full max-w-[430px] mx-auto bg-[#FFFDFE] min-h-screen px-4 pt-5 pb-24 flex flex-col space-y-8 shadow-[0_0_50px_rgba(30,22,43,0.06)] border-x border-[#1E162B]/[0.05]">
        
        {/* ===================== WITH / PAIRS STYLE HERO ===================== */}
        <section className="rounded-[28px] bg-gradient-to-b from-[#FDE2E6] via-[#F7ECF8] to-[#F2ECFD] p-5 pt-6 text-center space-y-5 shadow-[0_8px_28px_-8px_rgba(142,36,77,0.1)]">
          
          {/* Top Capsule Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 text-[#8E244D] text-[11px] font-extrabold tracking-wide shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8E244D]" />
            <span>Serious Marriage &amp; Courtship App</span>
          </div>

          {/* Warm Editorial Headline */}
          <div className="space-y-2 px-1">
            <h1 className="text-[31px] font-extrabold tracking-tight leading-[1.14] text-[#1E162B]">
              Meet by Values. <br />
              <span className="text-[#6555b8]">Real Devotion,</span>{" "}
              <span className="underline decoration-[#F598AC] decoration-4 underline-offset-4">
                Zero Games.
              </span>
            </h1>
            <p className="text-[13px] text-[#564B68] leading-relaxed">
              Connecting sincere Southeast Asian women and marriage-minded global partners in a verified, high-trust sanctuary.
            </p>
          </div>

          {/* Pairs-Style Verified Member Strip (Soft Floating Capsule) */}
          <div className="w-full rounded-2xl bg-white/95 p-3 shadow-[0_6px_20px_-4px_rgba(30,22,43,0.06)] flex items-center justify-between gap-2.5 text-left">
            <div className="flex -space-x-2 overflow-hidden pl-0.5">
              <div className="relative w-10 h-10 rounded-full ring-2 ring-[#FDD8DD] overflow-hidden bg-rose-50 shrink-0">
                <Image src="/jennalyn.png" alt="Jennalyn" fill sizes="40px" className="object-cover" />
              </div>
              <div className="relative w-10 h-10 rounded-full ring-2 ring-[#FDD8DD] overflow-hidden bg-rose-50 shrink-0">
                <Image src="/anong.png" alt="Anong" fill sizes="40px" className="object-cover" />
              </div>
              <div className="relative w-10 h-10 rounded-full ring-2 ring-[#FDD8DD] overflow-hidden bg-rose-50 shrink-0">
                <Image src="/suwannarat.png" alt="Suwannarat" fill sizes="40px" className="object-cover" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-extrabold text-[#1E162B] truncate">
                  Verified Members
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6555b8] shrink-0" />
              </div>
              <p className="text-[10.5px] text-[#6E6482] truncate">
                Cebu &bull; Chiang Mai &bull; Bangkok
              </p>
            </div>

            <span className="text-[10px] font-extrabold text-[#8E244D] bg-[#FDD8DD]/70 px-2.5 py-1 rounded-full shrink-0">
              100% Real
            </span>
          </div>

          {/* Pairs-Style Value Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="px-3 py-1 rounded-full bg-white/85 text-[11px] font-bold text-[#4A3E5E] shadow-2xs">
              💍 Marriage-Minded
            </span>
            <span className="px-3 py-1 rounded-full bg-white/85 text-[11px] font-bold text-[#4A3E5E] shadow-2xs">
              🛡️ Edge GPS Verified
            </span>
            <span className="px-3 py-1 rounded-full bg-white/85 text-[11px] font-bold text-[#4A3E5E] shadow-2xs">
              💬 3-Turn Chat Gate
            </span>
          </div>

          {/* Full-Pill Tactile CTA (Signature With / Pairs Button) */}
          <div className="space-y-2.5 pt-1">
            <Link
              href="/signup"
              className="w-full py-4 px-6 rounded-full bg-[#6555b8] hover:bg-[#5646a8] text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_24px_-4px_rgba(101,85,184,0.45)] active:scale-[0.985] transition cursor-pointer"
            >
              <span>Start Sincere Courtship</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center justify-center gap-3 text-xs text-[#564B68] pt-0.5">
              <Link href="/login" className="font-extrabold text-[#6555b8] hover:underline">
                Member Sign In
              </Link>
              <span className="text-[#C8BFD8]">&bull;</span>
              <Link href="/discover" className="font-semibold hover:text-[#1E162B] transition">
                Browse Directory
              </Link>
            </div>
          </div>
        </section>

        {/* ===================== WITH-STYLE FULL-BLEED ILLUSTRATION CARDS ===================== */}
        <section className="space-y-5">
          <div className="text-center space-y-1 px-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8E244D]">
              Why AsiansIn.Love
            </span>
            <h2 className="text-xl font-extrabold text-[#1E162B]">
              Designed for Safe, Sincere Courtship
            </h2>
          </div>

          <div className="space-y-4">
            {PILLARS.map(({ point, title, description, stageBg, badgeText, badgeBg, Illustration }) => (
              <div
                key={point}
                className="w-full rounded-[26px] bg-white border border-[#1E162B]/[0.06] shadow-[0_8px_26px_-6px_rgba(30,22,43,0.05)] overflow-hidden"
              >
                {/* Edge-to-Edge Pastel Illustration Stage (Zero Inner Box Clutter) */}
                <div className={`w-full h-40 ${stageBg} flex items-end justify-center px-6 pt-3 overflow-hidden`}>
                  <div className="w-full max-w-[280px] h-full">
                    <Illustration />
                  </div>
                </div>

                {/* Clean Editorial Copy */}
                <div className="p-5 text-center space-y-2">
                  <span
                    className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${badgeBg} ${badgeText}`}
                  >
                    {point}
                  </span>
                  <h3 className="text-[17px] font-extrabold text-[#1E162B] leading-snug">
                    {title}
                  </h3>
                  <p className="text-[13px] text-[#564B68] leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== BOTTOM CONVERSION CARD ===================== */}
        <section className="rounded-[28px] bg-[#FDD8DD]/65 border border-[#F5B8C2]/50 p-6 text-center space-y-4">
          <div className="w-11 h-11 rounded-full bg-white text-[#8E244D] flex items-center justify-center mx-auto shadow-2xs">
            <Heart className="w-5 h-5 fill-[#F8839B] text-[#8E244D]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold tracking-tight text-[#1E162B]">
              Ready for an intentional connection?
            </h3>
            <p className="text-xs text-[#564B68] leading-relaxed">
              Create your courtship profile in 2 minutes and claim your verified badge for free.
            </p>
          </div>

          <Link
            href="/signup"
            className="w-full py-4 px-6 rounded-full bg-[#6555b8] hover:bg-[#5646a8] text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_24px_-4px_rgba(101,85,184,0.4)] active:scale-[0.985] transition cursor-pointer"
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
