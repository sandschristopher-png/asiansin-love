import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Globe2, Home } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export const metadata = {
  title: 'Safety Blueprint — asiansin.love',
  description: 'Practical safety guides for international dating in Southeast Asia: scam prevention, trafficking awareness, legal protection, and meeting protocols for both local and foreign members.',
};

type Topic = { title: string; body: string };
type Group = { icon: React.ComponentType<{ className?: string }>; label: string; blurb: string; topics: Topic[] };

const UNIVERSAL: Group = {
  icon: ShieldCheck,
  label: 'Universal Safety Rules',
  blurb: 'Non-negotiable rules for every member, wherever you live.',
  topics: [
    {
      title: 'The No-Transfer Rule',
      body: 'Never send money, e-wallet transfers, gifts, or financial aid to someone you have not met and spent significant in-person time with. Sending cash shifts a relationship from mutual attraction to financial sponsorship. Refuse all requests via GCash, Maya, PromptPay, TrueMoney, Palawan Express, Western Union, Wise, or Remitly.',
    },
    {
      title: 'Love Bombing & Rushed Commitment',
      body: 'Intense declarations of love within days, talk of forever before a first meeting, and guilt-tripping when you set a pace are scripts, not feelings. Scammers manufacture closeness quickly so a later money request feels like helping a partner. Genuine connections survive a normal timeline.',
    },
    {
      title: 'Manufactured Emergencies',
      body: 'Know the common scripts: sudden clinic bills, sick parents, roof damage after rain, boarding house rent, or passport fees. Requests often start small — around ₱1,000 (฿600) — to test compliance. Genuine partners resolve family matters through local support networks, not an online connection.',
    },
    {
      title: 'Public First Dates & Neutral Transit',
      body: 'Always hold initial meetings in crowded, well-lit commercial public areas like shopping malls or verified restaurants. Arrange your own transit using Grab or local rideshares. Never accept private pick-ups from unverified third parties or agree to meet at isolated private villas on day one.',
    },
    {
      title: 'Protect Your Accounts & Identity',
      body: 'Never share one-time PIN (OTP) codes, banking passwords, or photos of your passport and IDs — no legitimate reason exists for anyone to ask. Romance contacts are a common gateway to account takeover and SIM-swap fraud. Keep all conversation and plans inside asiansin.love until you have met in person.',
    },
    {
      title: 'EXIF Geotag Metadata & Photo Scrubbing',
      body: 'Smartphone cameras automatically embed exact GPS coordinates into photograph metadata. Sharing original, uncompressed camera-roll files via email or direct messaging can expose the precise building and street location of your home or workplace. Use compressed platform uploads that strip metadata.',
    },
    {
      title: 'Identity Verification & Chatters',
      body: 'Require multiple unscripted, well-lit live video calls before making travel plans. Commercial chat operators are sometimes hired to maintain profiles — inconsistent messaging habits and pre-recorded clips are warning signs. Look for our gesture-verified and location-verified badges as a starting signal.',
    },
    {
      title: 'Beware the Off-Platform Rush',
      body: 'Be cautious of accounts that insist on moving to WhatsApp, Telegram, or Viber within the first few exchanges. Scammers move off-platform quickly to evade moderation, automated screening, and account bans before their profile gets flagged.',
    },
    {
      title: 'Zero Explicit Media Policy',
      body: 'Never share nude, semi-nude, or explicit photos or video, no matter how much you trust the person. Screen-recording software captures live video without your knowledge, and recorded images are used for blackmail. Once sent, control is gone forever.',
    },
  ],
};

const LOCAL: Group = {
  icon: Home,
  label: 'For Members in Southeast Asia',
  blurb: 'Protecting yourself against predatory foreign contacts, legal traps, and organized fraud.',
  topics: [
    {
      title: 'The Fake Courier / Customs Package Scam',
      body: 'A "foreign suitor" claims he sent an expensive gift package — jewelry, electronics, or currency for an upcoming wedding. Days later, a fake courier or customs officer demands ₱5,000 to ₱30,000 (฿3,000 to ฿18,000) for clearance fees, import taxes, or anti-money-laundering certification. Real couriers never demand e-wallet payments to clear goods. Never pay fees for a package you did not order.',
    },
    {
      title: 'Fake Wealth & Frozen Account Lies',
      body: 'Scammers pose as high-earning engineers, military officers, or executives on regional projects, then claim their card is blocked or salary frozen while traveling. They ask to borrow ₱10,000 to ₱50,000 for hotel bills or flights, promising to repay tenfold. Someone with genuine wealth abroad never needs your local savings.',
    },
    {
      title: 'Mandatory CFO Certificate & Emigration Laws',
      body: 'In the Philippines, the Commission on Filipinos Overseas (CFO) legally mandates that any Filipino emigrating as a fiancé or spouse of a foreign national must attend guidance counseling and obtain a CFO Certificate. Immigration officers will offload passengers at the airport who lack this document.',
    },
    {
      title: 'Realistic Visa Timelines vs. Expedited Fraud',
      body: 'Legitimate partner visa immigration (such as US K-1/CR-1 or UK/Australian equivalents) takes 12 to 24 months and requires government civil registry checks and medical clearances. Anyone promising an "expedited visa in two weeks" for ₱50,000 to ₱150,000 (฿30,000 to ฿95,000) is running an immigration scam.',
    },
    {
      title: 'Protecting Children & Single Mothers',
      body: 'Single mothers should never introduce an online connection to their children until extensive, verified in-person visits have established character. Be aware that cross-border child support enforcement is practically non-existent if an overseas father departs, and traveling abroad with minors requires formal DSWD travel clearance.',
    },
    {
      title: 'Identity Harvesting & Fake Visa Prep',
      body: 'Be cautious of matches requesting copies of your government ID, passport, birth certificate, or National ID for "pre-filing a visa" or "checking flight tickets." Criminal operations use real documents to open bank accounts, secure digital loans, or create mule identities in your name.',
    },
    {
      title: 'Trafficking & Illegal Matchmaking',
      body: 'Commercial matchmaking for marriage to foreign nationals is illegal in the Philippines under the Anti-Mail-Order Bride Law (Republic Act 10906). Legitimate partners date you directly — never through recruiters, modeling scouts, or marriage brokers demanding agency contracts.',
    },
    {
      title: 'The Overseas Job / Modeling Pivot',
      body: 'If a foreign connection or associate offers high-paying work abroad — customer service, casino hosting, or modeling in Cambodia, Laos, Myanmar, or the Middle East — treat it as an immediate trafficking threat. Victims arrive only to have passports confiscated and be forced into scam compounds or exploitation.',
    },
    {
      title: 'Never Surrender Your Documents',
      body: 'Never give your physical passport, ID cards, or mobile phone to a suitor, travel companion, or visa handler under any circumstance. Legitimate embassies handle visa interviews in person; no private individual should ever hold your legal documents.',
    },
    {
      title: 'The Secret Family / Dual Life',
      body: 'Some foreign men maintain active marriages and families at home while presenting as single abroad. Before becoming emotionally invested, watch: do they only take video calls from cars, hotels, or offices — never their home? Are their social profiles bare or locked down? Do they dodge questions about their living situation or past divorces?',
    },
    {
      title: 'Fetishization & Conquest Culture',
      body: 'Be wary of men who fixate on stereotypes — claiming local women are "submissive," "traditional," or "unspoiled." Someone who views you through an ideological lens sees a disposable travel conquest, not a partner. How a man talks about women in his home country is how he will eventually talk about you.',
    },
    {
      title: 'Coercive Intimacy & Health Protection',
      body: 'Never yield to pressure regarding unprotected intimacy. Insist on barrier contraception and mutual health screenings before any physical relationship. A partner who values your well-being respects boundaries without anger, guilt-trips, or manipulation.',
    },
    {
      title: 'Home Address & Family Boundaries',
      body: 'Keep your exact residential address, barangay gate, workplace, and children\'s school locations private during initial chatting. Share general city-level information only until you have met in person multiple times and verified their background.',
    },
    {
      title: 'Blackmail & Evidence Preservation',
      body: 'If a match threatens you, pressures you for commercial acts, or acts aggressively: do not delete the chat. Take screenshots showing messages, handle, and phone number, block the user, then submit an in-app report to moderation — and file with local cybercrime authorities if threats involve money or images.',
    },
  ],
};

const ABROAD: Group = {
  icon: Globe2,
  label: 'For Members Abroad',
  blurb: 'Legal exposure, street-level security, and schemes targeting foreign visitors.',
  topics: [
    {
      title: 'Marital Status & the Adultery Trap',
      body: 'In jurisdictions where civil divorce does not exist (such as the Philippines), many people are separated for years without legal annulment. Dating a legally married person can expose you to criminal prosecution for adultery or concubinage, with an estranged spouse able to file charges leading to arrest and extortion settlements. Verify legal marital status before committing.',
    },
    {
      title: 'De-escalate Conflicts (RA 9262)',
      body: 'Local laws such as the Philippines\' Republic Act 9262 allow immediate protective orders over alleged emotional, psychological, or economic abuse. An escalating argument can become a police complaint, weekend detention, or a hold-departure order. Stay calm, de-escalate, and never withhold someone\'s passport or property.',
    },
    {
      title: 'Cyber Libel Is Criminal Here',
      body: 'Defamation carries criminal penalties — not just civil — in the Philippines and Thailand. Posting a critical exposé of a local scammer, venue, or individual online can result in cyber libel warrants and airport hold orders. Handle disputes privately through legal representation or your embassy, not on social media.',
    },
    {
      title: 'Hospital Deposits & MedEvac Insurance',
      body: 'Private regional hospitals demand immediate cash or card deposits of ₱100,000 to ₱300,000 (฿60,000 to ฿180,000) before admitting patients to intensive care or surgery. Standard travel policies rarely direct-bill local facilities. Always secure travel insurance with explicit medical evacuation coverage.',
    },
    {
      title: 'Cultural Harmony, "Loss of Face" & Barangay Mediation',
      body: 'In Southeast Asia, shouting, pointing fingers, or public anger causes intense humiliation ("loss of face") and risks physical confrontation or community intervention. Disagreements in residential zones are often brought before the local Barangay Lupon. Maintain composure and navigate emotional withdrawal (such as Filipino tampo) with patience.',
    },
    {
      title: 'The "Tourist Visa Guarantee" Myth',
      body: 'Foreigners cannot "guarantee" a Western tourist visa for an unemployed or low-income partner simply by writing an invitation letter. Western embassies evaluate domestic socioeconomic ties and reject the vast majority of visitor visas, forfeiting non-refundable application fees.',
    },
    {
      title: 'Consular Limits in Emergencies',
      body: 'Foreign embassies cannot post bail, pay hospital invoices, provide legal representation, or override local court processes. Their authority is restricted to issuing emergency passports, providing attorney lists, and monitoring citizen welfare.',
    },
    {
      title: 'Zero-Tolerance Narcotics Laws',
      body: 'Southeast Asian jurisdictions enforce severe penalties for narcotics, up to life imprisonment or worse. Never hold luggage, packages, or envelopes for a partner, their friends, or family, and avoid recreational substances entirely while abroad.',
    },
    {
      title: 'The Crypto / Investment Pivot',
      body: 'If an attractive connection mentions a wealthy relative trading gold, forex, or crypto — or asks you to deposit into an "exclusive trading exchange" — it is an organized pig-butchering operation. Disconnect immediately.',
    },
    {
      title: 'ATM & Cash Hygiene',
      body: 'Avoid standalone outdoor ATMs at night; use machines inside bank branches or secure malls. Never count withdrawn cash openly. Split your funds: daily transit money in one pocket, larger sums in a neck pouch or interior wallet.',
    },
    {
      title: 'Joint Accounts & Banking Access',
      body: 'Never open joint local bank accounts with a romantic interest, and never grant access to your online banking, ATM cards, or PINs. Once funds sit in a local account under their control, legal retrieval is practically impossible.',
    },
    {
      title: 'The Family Feast Expectation',
      body: 'Clarify attendance before inviting a date to dinner. Extended relatives sometimes arrive unannounced expecting an all-inclusive feast billed to you. Establish the meeting is one-on-one upfront, and if relatives do attend, pick a venue with fixed set menus rather than open-ended billing.',
    },
    {
      title: 'Bar-Fine & KTV Bill Padding',
      body: 'Avoid meeting connections in hostess bars, KTVs, or nightlife corridors. A match may direct you to a specific lounge where ladies\' drinks and room charges hit ₱20,000 to ₱50,000 in minutes, with security blocking exits until the bill is settled.',
    },
    {
      title: 'Drink Tampering',
      body: 'Never leave beverages or food unattended, even briefly. Spiking ("Ativan gang" tactics) happens in hotel lobbies and ordinary restaurants, and victims wake up a day later with electronics, cards, cash, and safes cleared out. If your glass moved or was replaced, order fresh.',
    },
    {
      title: 'Vehicle Rentals & Passport Collateral',
      body: 'When renting scooters or cars, never surrender your physical passport as collateral — provide a photocopy only. Operators manufacture damage claims (₱15,000 for pre-existing scratches) and hold passports hostage. Carry a valid International Driving Permit to avoid impoundment and voided insurance.',
    },
  ],
};

const GROUPS: Group[] = [UNIVERSAL, LOCAL, ABROAD];

export default function SafetyBlueprintPage() {
  return (
    <div className="min-h-screen w-full bg-white text-[#413B5E] font-sans antialiased selection:bg-[#8574B7]/15 selection:text-[#413B5E]">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo href="/" size="md" />
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#8574B7]/10 text-xs font-semibold text-[#413B5E] hover:bg-[#8574B7]/15 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Feed
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-14">
        {/* Title Area */}
        <div className="space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8574B7]/10 text-xs font-bold text-[#413B5E]">
            <ShieldCheck className="w-4 h-4 text-[#8574B7]" />
            Safety Blueprint
          </div>
          <h1 className="font-brand text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#413B5E] leading-tight">
            International Dating &amp; Safety Protocol
          </h1>
          <p className="text-base sm:text-lg text-[#655E72] leading-relaxed max-w-2xl">
            Practical guides for building genuine cross-border relationships. Tap any topic to expand it. Every member benefits from gesture verification, GPS location checks, and messaging that stays on-platform.
          </p>
        </div>

        {/* Topic Groups */}
        {GROUPS.map(({ icon: GroupIcon, label, blurb, topics }) => (
          <section key={label} className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#8574B7]/10 text-[#8574B7] flex items-center justify-center shrink-0">
                <GroupIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="font-brand text-xl font-bold text-[#413B5E]">{label}</h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#8574B7]/10 text-[#8574B7]">
                    {topics.length} topics
                  </span>
                </div>
                <p className="text-sm text-[#655E72]/80 mt-0.5">{blurb}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {topics.map((t) => (
                <details
                  key={t.title}
                  className="group rounded-2xl bg-[#8574B7]/[0.04] hover:bg-[#8574B7]/[0.07] transition-colors open:bg-[#8574B7]/[0.08]"
                >
                  <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-5 py-4 [&::-webkit-details-marker]:hidden">
                    <span className="text-sm font-bold text-[#413B5E]">{t.title}</span>
                    <svg
                      className="w-4 h-4 text-[#8574B7] shrink-0 transition-transform duration-200 group-open:rotate-180"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-[#655E72] leading-relaxed">{t.body}</p>
                </details>
              ))}
            </div>
          </section>
        ))}

        {/* Action Card */}
        <div className="rounded-3xl bg-[#8574B7]/[0.06] p-8 text-center space-y-4">
          <h2 className="font-brand text-2xl font-extrabold text-[#413B5E]">
            Spot a suspicious profile or a request for funds?
          </h2>
          <p className="text-sm text-[#655E72] max-w-lg mx-auto">
            asiansin.love prohibits money solicitations, commercial services, and identity misrepresentation. Use the report button on any profile or message and moderation will review it immediately.
          </p>
          <div className="pt-2">
            <Link
              href="/discover"
              className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-sm font-bold tracking-tight transition-all active:scale-95 shadow-sm"
            >
              Return to Community
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-[#655E72]/60">
        asiansin.love &mdash; Community Trust &amp; Safety Guidelines
      </footer>
    </div>
  );
}