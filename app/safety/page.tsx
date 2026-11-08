import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Globe2, Home, MapPin } from 'lucide-react';
import SafetyAccordion from '@/components/SafetyAccordion';

export const metadata = {
  title: 'Safety Blueprint — asiansin.love',
  description: 'Practical, comprehensive safety guide for cross-border dating in Southeast Asia: scam prevention, legal protections, meeting protocols, and cultural realities for both local and foreign members.',
};

type Topic = { title: string; body: string };
type Group = { icon: React.ComponentType<{ className?: string }>; label: string; blurb: string; topics: Topic[] };

const UNIVERSAL: Group = {
  icon: ShieldCheck,
  label: 'Universal Safety Rules',
  blurb: 'Non-negotiable foundational boundaries for every member, regardless of location.',
  topics: [
    {
      title: 'The Zero-Transfer Mandate',
      body: 'Never send money, e-wallet top-ups, bank wires, or financial aid to someone you have not met and spent significant in-person time with. Sending cash immediately transforms a romantic connection into a financial dependency. Refuse all requests via GCash, Maya, PromptPay, TrueMoney, Palawan Express, Western Union, Wise, or Remitly.',
    },
    {
      title: 'The Micro-Transfer Compliance Test',
      body: 'Scams rarely start with large requests. They begin with ₱1,000 (฿600) for prepaid mobile load, ₱2,000 (฿1,200) for groceries, or ₱3,500 (฿2,200) for an urgent utility bill. These small sums test your willingness to pay and establish a habit of compliance. Say no to the first request.',
    },
    {
      title: 'Love Bombing & Manufactured Chemistry',
      body: 'Intense declarations of love within days, pet names like "my future husband/wife" before meeting, and claims of spiritual destiny are manipulative scripts designed to lower your critical thinking. Real attraction develops through mutual consistency over time, not frantic digital flattery.',
    },
    {
      title: 'Manufactured Crisis Scripts',
      body: 'Familiarize yourself with the common emergency scripts: a sick parent admitted to a clinic, a storm-damaged roof, impounded work motorbikes, or overdue boarding house rent. Genuine partners handle family hardships through their local community, extended family, or employment — not by asking an online contact.',
    },
    {
      title: 'Public First Meetings & Independent Transit',
      body: 'Always hold your first several dates in crowded, well-lit commercial public areas such as major shopping malls or reputable restaurants. Arrange your own transit using Grab or verified taxis. Never agree to meet at isolated private villas, secluded beaches, or private residences on day one.',
    },
    {
      title: 'Mandatory Live Video Verification',
      body: 'Require multiple unscripted, well-lit live video calls before making travel plans or emotional commitments. If a match claims their camera is permanently broken, says their mobile data is too slow for video (while active on streaming apps), or only sends short pre-recorded video clips, disconnect immediately.',
    },
    {
      title: 'Beware the Off-Platform Rush',
      body: 'Be cautious of matches who immediately push to move conversations to WhatsApp, Telegram, or Viber within the first two or three messages. Fraud syndicates move off-platform quickly to bypass automated platform security screening and account bans before their profile gets flagged.',
    },
    {
      title: 'Account Takeover & OTP Protection',
      body: 'Never share one-time PIN (OTP) verification codes, banking credentials, or full identification card numbers. Fraud rings frequently use dating rapport to initiate SIM-swap fraud or unauthorized password resets on third-party financial accounts.',
    },
    {
      title: 'EXIF Geotag Metadata & Photo Scrubbing',
      body: 'Smartphone cameras automatically embed exact GPS latitude and longitude coordinates into original photo metadata. Sending uncompressed camera-roll files via email or messaging apps can reveal your exact residential apartment building or workplace to strangers. Use platform uploads that automatically scrub location headers.',
    },
    {
      title: 'Zero Explicit Media Policy',
      body: 'Never share nude, semi-nude, or sexually compromising photos or video streams. Screen-recording software captures live video without your knowledge, and recorded footage is used for aggressive financial blackmail. Once media is sent over the internet, control over its distribution is gone forever.',
    },
  ],
};

const LOCAL: Group = {
  icon: Home,
  label: 'For Members in Southeast Asia',
  blurb: 'Protections for local members against predatory foreign contacts, trafficking, and cross-border fraud.',
  topics: [
    {
      title: 'The Fake Courier & Customs Fee Scam',
      body: 'A foreign match claims he mailed you an expensive gift box containing jewelry, luxury bags, or cash for an upcoming wedding. Days later, a fake courier or "customs officer" calls demanding ₱5,000 to ₱30,000 (฿3,000 to ฿18,000) via GCash or PromptPay for import clearance or tax certification. Real international couriers never ask for e-wallet payments. Never pay fees for unsolicited packages.',
    },
    {
      title: 'Fake Wealth & Frozen Account Excuses',
      body: 'Scammers pose as high-earning foreign engineers, military officers, or executives, then claim their overseas bank card was blocked at an airport or their salary is temporarily frozen. They ask to borrow ₱10,000 to ₱50,000 for hotel rooms or domestic flights, promising to repay tenfold. Someone with genuine overseas wealth never needs your local savings.',
    },
    {
      title: 'Mandatory CFO Guidance & Emigration Law',
      body: 'In the Philippines, the Commission on Filipinos Overseas (CFO) legally mandates that any Filipino citizen emigrating as the fiancé(e), spouse, or family member of a foreign national must complete the Guidance and Counseling Program (GCP) and obtain an official CFO Certificate. Airport immigration officers will offload travelers who do not present this document.',
    },
    {
      title: 'Realistic Visa Timelines vs. Expedited Fraud',
      body: 'Legitimate partner visa immigration (such as US K-1/CR-1 or European/Australian equivalents) requires 12 to 24 months, comprehensive civil background vetting, PSA civil registry checks, and approved medical screenings. Anyone claiming they can purchase an "expedited partner visa in two weeks" for ₱50,000 to ₱150,000 (฿30,000 to ฿95,000) is running an immigration scam.',
    },
    {
      title: 'Single Mothers & Child Protection',
      body: 'Never introduce an online suitor to your children, either in person or over private video calls, until multiple in-person trips have thoroughly established his character. Foreign legal systems rarely enforce international child support if an unmarried foreign father departs, and traveling abroad with minors requires formal DSWD travel clearance.',
    },
    {
      title: 'Identity Harvesting & Loan Fraud',
      body: 'Be vigilant if a match asks for clear photos of your Philippine National ID, passport, UMID, or birth certificate under the pretext of "pre-filing visa forms" or "booking flights." Fraud rings use real identity documents to register fraudulent digital bank accounts and micro-loan apps in your name.',
    },
    {
      title: 'Illegal Matchmaking & Anti-Mail-Order Bride Laws',
      body: 'Commercial matchmaking for marriage to foreign nationals is strictly illegal in the Philippines under Republic Act 10906. Legitimate foreign partners date you directly as an individual — never through third-party recruiters, talent agencies, or commercial matchmaking coordinators demanding membership fees.',
    },
    {
      title: 'The Overseas Job / Modeling Compound Trap',
      body: 'If an online foreign connection or his associates offer you high-paying customer support, casino hosting, or modeling jobs in Cambodia, Laos, Myanmar, or the Middle East, treat it as an active human trafficking threat. Victims are routinely transported to enclosed cyber-scam compounds where passports are confiscated upon arrival.',
    },
    {
      title: 'Never Surrender Your Physical Documents',
      body: 'Never surrender your physical passport, identification cards, or phone to a suitor, travel companion, or unofficial visa fixer. Legitimate embassies handle official visa interviews in person; no private third party has a legal right to hold your travel documents.',
    },
    {
      title: 'Vetting Marital Status & Secret Families',
      body: 'Some foreign visitors maintain active marriages and households in their home countries while presenting themselves as single abroad. Before becoming emotionally attached, check: does he freely video call you from inside his home, or only from cars, hotels, and offices? Are his personal social profiles completely blank or locked down? Does he avoid questions about past divorces?',
    },
    {
      title: 'Fetishization & Conquest Culture',
      body: 'Be cautious of men who fixate on cultural stereotypes — claiming local women are uniquely "submissive," "traditional," or "unspoiled compared to Western women." Men viewing partners through an ideological lens often see local women as disposable conquests. How a man speaks about women in his home country is how he will treat you.',
    },
    {
      title: 'Coercive Intimacy & Sexual Health',
      body: 'Never yield to pressure regarding unprotected intimacy. Insist on consistent barrier contraception and request mutual, verified health clinic screenings before physical intimacy. A partner who genuinely values your future will respect your boundaries without anger, guilt-trips, or manipulation.',
    },
    {
      title: 'Home Address & Privacy Boundaries',
      body: 'Keep your exact residential subdivision, barangay gate, and children\'s school locations private during the initial chatting phase. Provide general city-level information until you have met in person multiple times in public and confirmed his true background.',
    },
    {
      title: 'Evidence Preservation & Cybercrime Reporting',
      body: 'If a match threatens you, demands money under duress, or attempts blackmail, do not immediately delete the conversation history. Take comprehensive screenshots showing the messages, handle, and contact number, block the user across all platforms, submit an in-app report, and file a formal report with local cybercrime authorities.',
    },
  ],
};

const ABROAD: Group = {
  icon: Globe2,
  label: 'For Members Abroad',
  blurb: 'Legal exposure, personal security, and common schemes targeting foreign visitors in Southeast Asia.',
  topics: [
    {
      title: 'The Legal Adultery Trap in the Philippines',
      body: 'In the Philippines, where civil divorce does not exist under standard law, many individuals have been separated for years without obtaining a legal court annulment. Dating a legally married person can expose you to criminal prosecution for adultery or concubinage under the Revised Penal Code, where an estranged spouse can file charges resulting in arrest warrants and costly extortion settlements. Always verify legal marital status before committing.',
    },
    {
      title: 'De-escalate Conflicts (RA 9262 Exposure)',
      body: 'Local statutes such as Republic Act 9262 in the Philippines provide for immediate, ex-parte protection orders over allegations of physical, psychological, or economic abuse. An escalating argument can rapidly become a formal police complaint, weekend detention, and an immigration Hold Departure Order preventing you from boarding your flight home. Stay calm, de-escalate disagreements, and never withhold anyone\'s passport or property.',
    },
    {
      title: 'Criminal Cyber Libel Laws',
      body: 'Defamation and libel carry criminal penalties — not just civil damages — in countries like the Philippines and Thailand. Posting a public exposé, naming a local scammer, or writing an angry social media review can result in criminal cyber libel arrest warrants and airport border holds. Settle disputes privately through verified legal counsel or consular channels, never on social media.',
    },
    {
      title: 'Hospital Cash Deposits & MedEvac Coverage',
      body: 'Top private regional hospitals (such as St. Luke\'s or Medical City in the Philippines, and Bumrungrad or Bangkok Hospital in Thailand) require immediate cash or credit card deposits of ₱100,000 to ₱300,000 (฿60,000 to ฿180,000) prior to admitting international patients for surgery or ICU care. Standard domestic travel insurance rarely direct-bills local hospitals. Always carry international medical insurance with explicit medical evacuation (MedEvac) coverage.',
    },
    {
      title: 'Cultural Harmony, "Loss of Face" & Barangay Councils',
      body: 'In Southeast Asian cultures, shouting, pointing fingers, or showing public anger causes intense humiliation ("loss of face") and can provoke immediate intervention from venue staff or bystanders. Domestic and neighborly disputes in residential areas are typically referred first to the local Barangay Lupon for mediation. Maintain composure and learn to navigate quiet emotional withdrawal (such as Filipino tampo) with calm patience.',
    },
    {
      title: 'The "Tourist Visa Guarantee" Myth',
      body: 'Foreign nationals cannot "guarantee" a Western tourist visa for an unemployed or low-income Southeast Asian partner simply by writing a formal invitation letter or signing an affidavit of support. Consulates evaluate applicants strictly on their own domestic economic ties (career, property, enrolled children) and reject the vast majority of first-time visitor visas, forfeiting non-refundable visa application fees.',
    },
    {
      title: 'Consular Limits in True Emergencies',
      body: 'Foreign embassies cannot post bail, pay private hospital invoices, provide legal representation in court, or intervene in sovereign local police proceedings. Embassy assistance is limited to providing rosters of English-speaking attorneys, visiting detained citizens in jail, and issuing emergency replacement passports.',
    },
    {
      title: 'Zero-Tolerance Narcotics Laws',
      body: 'Southeast Asian jurisdictions enforce severe legal penalties for recreational narcotics, ranging from extended prison terms in regional facilities to life imprisonment or capital punishment. Never agree to transport luggage, sealed parcels, or envelopes for a partner, their friends, or acquaintances, and avoid nightlife narcotics completely.',
    },
    {
      title: 'The Crypto / Investment Pivot (Pig Butchering)',
      body: 'If an attractive connection mentions an uncle in Hong Kong, Singapore, or Bangkok who trades gold, foreign exchange, or cryptocurrency — or encourages you to deposit ₱15,000 to ₱100,000 (฿10,000 to ฿60,000) into an "exclusive trading platform" — it is an organized syndicate operation. Disconnect immediately.',
    },
    {
      title: 'ATM Hygiene & Cash Handling',
      body: 'Avoid freestanding, unmonitored street ATMs at night; withdraw funds exclusively from machines located inside operating bank branches or high-security shopping malls. Never count large stacks of cash openly in public. Divide your currency: keep transit cash in a front pocket and larger sums in an interior hidden wallet.',
    },
    {
      title: 'Joint Bank Accounts & Asset Control',
      body: 'Never open joint local bank accounts with a romantic interest, and never allow anyone access to your primary banking applications, ATM cards, or PINs. Once funds enter a local Southeast Asian account under a partner\'s legal name, recovering those funds through the judicial system is practically impossible.',
    },
    {
      title: 'The "Family Feast" Expectation',
      body: 'Clarify attendance before inviting a date to dinner. In collectivist cultures, extended relatives (siblings, cousins, neighbors) may arrive unannounced expecting an all-inclusive meal billed entirely to the foreign visitor. Establish expectations politely in advance. If family members attend, select a restaurant with fixed set menus rather than open-ended ordering.',
    },
    {
      title: 'Nightlife Bill Padding & Hostess Traps',
      body: 'Avoid meeting initial dating connections in nightlife entertainment corridors or hostess lounges. A match may guide you into a specific venue where staff quietly run up bills of ₱20,000 to ₱50,000 (฿12,000 to ฿30,000) in minutes for "ladies\' drinks" and VIP rooms, with venue security blocking exits until the invoice is settled.',
    },
    {
      title: 'Drink Tampering & Spiking Defense',
      body: 'Never leave drinks or food unattended, even for a brief trip to the restroom. Drink spiking with sedatives (often referred to locally as "Ativan gangs") occurs in hotel bars and casual dining spots. Victims wake up 24 hours later in their hotel room with credit cards, mobile phones, and room safes completely emptied. If a glass has moved, order a fresh beverage.',
    },
    {
      title: 'Vehicle Rentals & Passport Hostage Tactics',
      body: 'When renting scooters or cars to visit provincial areas, never surrender your physical passport as rental collateral — provide a printed photocopy only. Unscrupulous operators frequently manufacture pre-existing damage claims (demanding ₱15,000 / ฿10,000) and hold passports hostage until paid. Always hold a valid International Driving Permit (IDP) to prevent impoundment and voided insurance.',
    },
  ],
};

const REGIONAL: Group = {
  icon: MapPin,
  label: 'Country-Specific Realities',
  blurb: 'Essential legal, administrative, and cultural nuances across key Southeast Asian destinations.',
  topics: [
    {
      title: 'Cambodia: Foreign Marriage Restrictions & Border Compounds',
      body: 'Under Cambodian Ministry of Foreign Affairs sub-decrees designed to prevent human trafficking, foreign men wishing to marry Cambodian women in-country must legally be under 50 years of age and present certified proof of a monthly income of at least US$2,500 (about ៛10 million riel). Furthermore, never agree to travel to border casino enclaves or Special Economic Zones (such as Poipet, Bavet, or certain commercial zones in Sihanoukville) for a date, as cyber-scam syndicates operate heavily in those zones.',
    },
    {
      title: 'Vietnam: Hotel Room Marriage Rules & Ward Police Registration',
      body: 'Under Vietnamese public security regulations, budget hotels, boutique guesthouses, and homestays are legally required to verify an official marriage certificate before allowing an unmarried foreign male and Vietnamese female to share a single room (though luxury international hotels rarely enforce this). Additionally, any foreigner staying overnight outside an accredited hotel — such as an apartment or family residence — must be declared to the local ward police (Công an phường) within 24 hours.',
    },
    {
      title: 'Thailand: Vaping Penalties, Royal Speech Laws & Sin Sod',
      body: 'Vaping devices and e-liquids are strictly prohibited under Thai law; carrying a vape on the street routinely results in immediate police stops, confiscation, and on-the-spot fines of ฿20,000 to ฿50,000 (₱33,000 to ₱82,000). Section 112 of the Thai Penal Code (Lèse-Majesté) strictly punishes any criticism, joke, or meme regarding the royal family, even in private chat messages, with 3 to 15 years in prison. In rural areas, clarify early whether family Sin Sod (dowry) expectations are purely symbolic or involve non-refundable cash transfers.',
    },
    {
      title: 'Indonesia: Interfaith Marriage Bans & Community Oversight',
      body: 'Indonesian civil law (Law No. 1/1974 and Supreme Court Circular SEMA No. 2/2023) does not recognize interfaith marriages; both partners must legally profess the same recognized religion before a civil marriage can be registered. Outside major international resorts in Bali, local neighborhood councils (RT/RW in Java and Pecalang in Bali) maintain active community oversight over local boarding houses (kost) and residential compounds, where unmarried couples can face neighborhood mediation if complaints are raised.',
    },
  ],
};

const GROUPS: Group[] = [UNIVERSAL, LOCAL, ABROAD, REGIONAL];

export default function SafetyBlueprintPage() {
  return (
    <div className="min-h-screen w-full bg-white text-[#413B5E] font-sans antialiased selection:bg-[#8574B7]/15 selection:text-[#413B5E]">

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-14">
        {/* Title Area */}
        <div className="space-y-4 text-center md:text-left">
          <h1 className="font-brand text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#413B5E] leading-tight">
            International Dating &amp; Safety Protocol
          </h1>
          <p className="text-base sm:text-lg text-[#655E72] leading-relaxed max-w-2xl">
            A comprehensive, practical guide to building genuine cross-border relationships while safeguarding your personal safety, legal standing, and finances. Every member benefits from gesture verification, GPS location checks, and messaging that stays on-platform until you meet in person. Tap any topic to read the full breakdown.
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
                <SafetyAccordion key={t.title} title={t.title} body={t.body} />
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
            asiansin.love strictly prohibits solicitations for cash, commercial matchmaking, and identity misrepresentation. Tap the report button on any profile or direct message to notify moderation immediately.
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
