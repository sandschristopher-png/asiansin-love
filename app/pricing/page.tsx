"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Check, Sparkles, Loader2, ArrowLeft, HeartHandshake, Plane } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_anon_key"
);

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  const priceId = process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID || "price_1UOGyhCooGaC2EFo5uTx5Ry0";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser({ id: data.user.id, email: data.user.email });
      }
    });
  }, []);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          userId: user?.id || null,
          userEmail: user?.email || null,
        }),
      });

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert(data?.error || "Failed to initiate checkout session.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const perks = [
    {
      title: "Travel Passport Mode",
      desc: "Connect with locals in Manila, Cebu, Bangkok, etc. before you land.",
      highlight: true,
    },
    {
      title: "Unlimited Sincere Messaging",
      desc: "Message directly with zero daily caps or waiting timers.",
    },
    {
      title: "Official AIL+ Trust Badge",
      desc: "Verified member status and prioritized profile discovery.",
    },
    {
      title: "Serious Courtship Filters",
      desc: "Filter by marriage timeline, values, and lifestyle.",
    },
    {
      title: "Custom Profile Handle",
      desc: "Personalize and update your public handle anytime.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9FD] text-[#181126] flex flex-col justify-between">
      <main className="flex-1 w-full max-w-sm mx-auto px-4 pt-1 pb-6 flex flex-col items-center">
        {/* Compact Sub-bar */}
        <div className="w-full flex items-center justify-between mb-1">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-[#8B7E9F] hover:text-[#4C3B75] transition py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back
          </Link>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3EFFC] text-[#6555B8] text-[10px] font-bold tracking-wider uppercase">
            <Sparkles className="w-3 h-3 fill-current" />
            <span>Membership</span>
          </div>
        </div>

        {/* Character Illustration cleanly anchored into the card */}
        <div className="relative w-40 h-36 flex items-end justify-center -mb-3 z-10 pointer-events-none">
          <Image
            src="/ail-plus.png"
            alt="AIL+"
            fill
            priority
            className="object-contain drop-shadow-xs"
          />
        </div>

        {/* Elevated Matchmaking Card */}
        <div className="w-full bg-white rounded-3xl border border-[#ECE6F7] shadow-xl shadow-purple-900/5 p-4 sm:p-5 relative z-20">
          {/* Plan Header */}
          <div className="bg-[#FAF8FE] border border-[#ECE6F7] rounded-2xl p-3 mb-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-[#181126] tracking-tight">AIL+</span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#6555B8] text-white px-2 py-0.5 rounded-full">
                  All-Inclusive
                </span>
              </div>
              <p className="text-[10px] text-[#8B7E9F]">
                Cancel anytime &bull; No surprise charges
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-[#181126] tracking-tight leading-none">
                $19.99
              </div>
              <div className="text-[10px] text-[#8B7E9F] mt-0.5">/ month</div>
            </div>
          </div>

          {/* Perks */}
          <div className="space-y-2.5 mb-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#8B7E9F] px-0.5">
              Member Privileges
            </p>
            {perks.map((p, idx) => (
              <div key={idx} className="flex items-start gap-2.5 px-0.5">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    p.highlight ? "bg-[#6555B8] text-white" : "bg-[#F3EFFC] text-[#6555B8]"
                  }`}
                >
                  {p.highlight ? <Plane className="w-2.5 h-2.5" /> : <Check className="w-3 h-3 stroke-[2.5]" />}
                </div>
                <div className="leading-tight">
                  <h4 className="text-xs font-bold text-[#181126] flex items-center gap-1.5">
                    {p.title}
                    {p.highlight && (
                      <span className="text-[9px] font-semibold text-[#6555B8] bg-[#F3EFFC] px-1.5 py-0.2 rounded">
                        Popular
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-[#6B5E87] mt-0.5 leading-snug">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#6555B8] hover:bg-[#5747A9] active:scale-[0.99] text-white font-bold text-xs tracking-wider uppercase shadow-md shadow-[#6555B8]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting to Checkout...
              </>
            ) : (
              <>
                <HeartHandshake className="w-4 h-4" />
                Upgrade to AIL+ &bull; $19.99/mo
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-3 flex flex-col items-center gap-0.5 text-center text-xs text-[#8B7E9F]">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted 256-bit checkout powered by Stripe</span>
          </div>
          <p className="text-[10px] text-[#A69BB9]">
            Real people &bull; Honest courtship &bull; No coin schemes or hidden fees
          </p>
        </div>
      </main>
    </div>
  );
}
