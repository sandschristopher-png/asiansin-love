import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowLeft, ShieldAlert, CheckCircle2, AlertOctagon, Scale, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: "Terms of Service | asiansin.love",
  description: "Terms and conditions of use for asiansin.love.",
}

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 pb-20">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 px-4 sm:px-6 py-3.5 backdrop-blur flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-7 w-7" textSize="text-lg" />
        </Link>
        <Link
          href="/browse"
          className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Browse</span>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-10">
        <div className="mb-8">
          <span className="inline-block rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-400 mb-3">
            Legal Terms & Conditions
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Terms of Service</h1>
          <p className="mt-1 text-xs text-zinc-400">Last Updated: September 2026</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          {/* 1. Age Limit */}
          <section className="space-y-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertOctagon className="h-4 w-4" />
              <h2>1. Strict Minimum Age Mandate (18+ Only)</h2>
            </div>
            <p className="text-zinc-200">
              You must be at least eighteen (18) years of age to register, access, or use asiansin.love. Use of this service is void where prohibited. By using this platform, you warrant that you possess the legal authority and capacity to enter into this Agreement. Providing false age or birthdate information constitutes fraud and results in immediate permanent banning and potential criminal referral.
            </p>
          </section>

          {/* 2. IMBRA Exemption */}
          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Scale className="h-4 w-4" />
              <h2>2. U.S. International Marriage Broker Regulation Act (IMBRA) Exemption</h2>
            </div>
            <p>
              asiansin.love is exempt from the International Marriage Broker Regulation Act of 2005 (8 U.S.C. 1375a) (&quot;IMBRA&quot;):
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>asiansin.love is a self-directed social discovery and dating communication platform, not an international marriage broker.</li>
              <li>The Platform does not charge fees for providing personal contact information, does not broker marriages, and does not provide matrimonial introductions.</li>
              <li>The Platform&apos;s principal business is not providing dating services between United States citizens and foreign nationals; it is an open social directory available globally.</li>
              <li>The Platform does not charge disparate or discriminatory rates based on gender, citizenship, or residence.</li>
            </ul>
          </section>

          {/* 3. Philippine Statutory Compliance */}
          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <ShieldCheck className="h-4 w-4" />
              <h2>3. Philippine Statutory Compliance (R.A. 10906 & R.A. 11930)</h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li><strong>Anti-Mail-Order Bride Act (Republic Act No. 10906):</strong> asiansin.love strictly complies with Philippine law. We do not operate a matrimonial matching agency, mail-order bride service, or commercial catalog. All local members across Southeast Asia participate and communicate 100% free of charge without financial barriers.</li>
              <li><strong>Anti-OSAEC & CSAE Mandate (Republic Act No. 11930):</strong> We enforce absolute zero tolerance for Child Sexual Abuse and Exploitation Materials (CSAEM) and Online Sexual Abuse and Exploitation of Children (OSAEC). Any detected attempt immediately triggers account termination, evidence preservation, and referral to international law enforcement and the Philippine National Police (PNP) / National Bureau of Investigation (NBI).</li>
            </ul>
          </section>

          {/* 4. Prohibited Behavior & Anti-Scam Shield */}
          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <ShieldAlert className="h-4 w-4" />
              <h2>4. Prohibited Conduct & Smart Guardian Enforcement</h2>
            </div>
            <p>You agree not to under any circumstances:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>Solicit, request, or offer money, loans, wire transfers, crypto assets, prepaid gift cards, or financial assistance.</li>
              <li>Solicit sex, commercial escort services, prostitution, or human trafficking.</li>
              <li>Attempt to extract or divert members off-platform (e.g., Telegram, WhatsApp, Line) within the first three messages.</li>
              <li>Upload explicit nudity, sexual fetish content, or photos containing minors or children under any circumstances.</li>
              <li>Create multiple accounts or impersonate any individual or entity.</li>
            </ul>
            <p className="mt-2 text-zinc-400">
              Our automated <strong>Smart Guardian</strong> algorithms actively monitor patterns. Violations result in immediate, non-refundable termination.
            </p>
          </section>

          {/* 5. Section 230 / Disclaimer of Liability */}
          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-sm">
              <CheckCircle2 className="h-4 w-4 text-zinc-400" />
              <h2>5. Communications Decency Act & Limitation of Liability</h2>
            </div>
            <p>
              In accordance with Section 230 of the Communications Decency Act (47 U.S.C. § 230) and international safe harbor provisions:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>asiansin.love is an interactive computer service provider and is not the publisher or speaker of any information provided by members.</li>
              <li>The Platform does not verify criminal backgrounds, employment status, marital status, or passport credentials of its users.</li>
              <li>You assume sole responsibility and risk when communicating with or meeting any individual in person. Always arrange first meetings in public venues and exercise standard travel precautions.</li>
              <li>IN NO EVENT SHALL THE OPERATORS OF ASIANSIN.LOVE BE LIABLE FOR ANY DIRECT, INDIRECT, PUNITIVE, OR CONSEQUENTIAL DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE.</li>
            </ul>
          </section>

          {/* 6. Service Availability & Termination */}
          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h2 className="font-bold text-white text-sm">6. Right to Terminate Service</h2>
            <p className="text-zinc-400">
              Use of asiansin.love is a privilege, not a right. We reserve the right to suspend, terminate, or delete any account or profile at our sole discretion, without liability, notice, or requirement to justify such action.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
