import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Globe, Heart } from 'lucide-react';
import type { Metadata } from 'next';

const TITLES: Record<string, string> = {
  "filipina-dating": "filipina dating",
  "filipino-dating": "filipino dating",
  "manila-dating": "manila dating",
  "cebu-dating": "cebu dating",
  "thai-dating": "thai dating",
  "bangkok-dating": "bangkok dating",
  "indonesia-dating": "indonesia dating",
  "jakarta-dating": "jakarta dating",
  "myanmar-dating": "myanmar dating",
  "burmese-dating": "burmese dating",
  "cambodia-dating": "cambodia dating",
  "khmer-dating": "khmer dating",
  "vietnam-dating": "vietnam dating",
  "saigon-dating": "saigon dating",
  "verified-asian-dating": "verified asian dating"
};

export function generateStaticParams() {
  return Object.keys(TITLES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = TITLES[slug] || 'Asian Dating';
  return {
    title: t + ' · Asians in Love',
    description: 'Meet verified singles across Southeast Asia. Real reputation scores, free messaging, and genuine profiles on Asians in Love.'
  };
}

export default async function SeoLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const titleFormatted = TITLES[slug] || 'Asian Dating';

  return (
    <main className="min-h-dvh bg-white text-[#1C1924] pb-28">
      <div className="max-w-xl mx-auto px-5 pt-8 pb-12 space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFC] text-[#6555B8] text-xs font-bold">
          <Globe className="w-3.5 h-3.5" />
          <span>Southeast Asia Verified Community</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-logo)' }}>
          {titleFormatted}
        </h1>

        <p className="text-sm text-[#6C637B] leading-relaxed">
          Welcome to a better way to meet people across the Philippines, Thailand, Indonesia, Myanmar, Cambodia, and Vietnam. Real reputation scores, pose-verified profiles, and free messaging to help you build genuine connections.
        </p>

        <div className="p-5 rounded-3xl bg-[#FAF9FD] border border-[#DDD7E5] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#6555B8]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Reputation &amp; Pose Verification</span>
          </div>
          <p className="text-xs text-[#6C637B] leading-relaxed">
            Unlike legacy dating sites plagued by bots and hidden paywalls, Asians in Love features verified community reputation scores so you can chat with confidence.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link href="/login" className="flex-1 py-3.5 px-6 rounded-full bg-[#6555B8] text-white text-center text-xs font-bold shadow-md hover:bg-[#52449e] transition">
            Join Free &amp; Browse Profiles
          </Link>
          <Link href="/discover" className="py-3.5 px-6 rounded-full bg-white border border-[#DDD7E5] text-[#1C1924] text-center text-xs font-semibold hover:border-[#6555B8] transition">
            Explore Discover Feed
          </Link>
        </div>
      </div>
    </main>
  );
}
