'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Zap, 
  Compass, 
  ShieldCheck, 
  Check, 
  MapPin, 
  MessageSquare, 
  CheckCircle2, 
  Loader2, 
  Lock, 
  Settings,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const QUICK_HUBS = [
  { city: 'Cebu City', country: 'Philippines' },
  { city: 'Manila', country: 'Philippines' },
  { city: 'Bangkok', country: 'Thailand' },
  { city: 'Tokyo', country: 'Japan' },
  { city: 'Kuala Lumpur', country: 'Malaysia' },
  { city: 'Bali', country: 'Indonesia' },
];

function PlusHubContent() {
  const searchParams = useSearchParams();
  const isPostCheckoutSuccess = searchParams.get('success') === '1';

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [isPlus, setIsPlus] = useState(false);
  
  // Travel status state
  const [travelIntent, setTravelIntent] = useState<'visiting' | 'current'>('visiting');
  const [travelCity, setTravelCity] = useState('');
  const [travelCountry, setTravelCountry] = useState('');
  const [customCity, setCustomCity] = useState('');

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isVerifyingPlus, setIsVerifyingPlus] = useState(isPostCheckoutSuccess);

  const sb = supabase;

  useEffect(() => {
    let mounted = true;
    let pollCount = 0;
    const maxPolls = 5;

    async function checkProfile() {
      try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) {
          if (mounted) setLoading(false);
          return;
        }

        const { data: prof } = await sb
          .from('profiles')
          .select('is_plus, travel_city, travel_country')
          .eq('id', user.id)
          .maybeSingle();

        if (mounted && prof) {
          const hasPlus = Boolean(prof.is_plus);
          setIsPlus(hasPlus);
          setTravelCity(prof.travel_city || '');
          setTravelCountry(prof.travel_country || '');

          if (isPostCheckoutSuccess && !hasPlus && pollCount < maxPolls) {
            pollCount++;
            setTimeout(checkProfile, 1500);
            return;
          }

          if (hasPlus) {
            setIsVerifyingPlus(false);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) {
          setLoading(false);
          if (pollCount >= maxPolls) setIsVerifyingPlus(false);
        }
      }
    }

    checkProfile();
    return () => {
      mounted = false;
    };
  }, [isPostCheckoutSuccess]);

  async function handleSubscribe() {
    setStarting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/plus/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnPath: '/plus' }),
      });
      const json = await res.json();
      if (res.status === 503) {
        setStatusMsg('Payments are being configured. Please check back shortly.');
        return;
      }
      if (!res.ok || !json.url) {
        setStatusMsg(json.error || 'Could not initiate checkout.');
        return;
      }
      window.location.href = json.url;
    } catch {
      setStatusMsg('Network error. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  async function handlePortal() {
    setOpeningPortal(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/plus/portal', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setStatusMsg(json.error || 'Could not open billing portal.');
        return;
      }
      window.location.href = json.url;
    } catch {
      setStatusMsg('Network error opening billing portal.');
    } finally {
      setOpeningPortal(false);
    }
  }

  async function setDestination(city: string, country: string) {
    if (!isPlus) {
      setStatusMsg('Upgrade to AIL Plus below to activate Travel Status.');
      return;
    }
    setStatusMsg(null);
    try {
      const res = await fetch('/api/plus/passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, country }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to update location.');
      }
      setTravelCity(city);
      setTravelCountry(country);
      setCustomCity('');
      const label = travelIntent === 'visiting' ? 'Visiting Soon' : 'Currently Here';
      setStatusMsg(`Location updated to ${city}, ${country} (${label}).`);
    } catch (err: any) {
      setStatusMsg(err?.message || 'Failed to update location.');
    }
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = customCity.trim();
    if (!trimmed) return;
    const parts = trimmed.split(',').map((p) => p.trim());
    setDestination(parts[0], parts[1] || '');
  }

  return (
    <div className="w-full pb-28 pt-3 px-4">
      {/* Post-Checkout Return Banner */}
      {isPostCheckoutSuccess && (
        <div className="mb-4 p-4 rounded-3xl bg-white border border-emerald-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            {isVerifyingPlus && !isPlus ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-base font-bold text-[#1C1924]">
            {isPlus ? 'Welcome to AIL Plus!' : 'Confirming Membership...'}
          </h2>
          <p className="text-xs text-[#6C637B] mt-0.5 mb-3">
            {isPlus ? 'Your full access is now active.' : 'Finalizing upgrade with Stripe...'}
          </p>
          <div className="flex items-center gap-2 w-full">
            <Link
              href="/chat"
              className="flex-1 py-2 rounded-full bg-[#6555B8] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Messages</span>
            </Link>
            <Link
              href="/discover"
              className="flex-1 py-2 rounded-full bg-white border border-[#DDD7E5] text-[#6555B8] text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Discover</span>
            </Link>
          </div>
        </div>
      )}

      {/* Hero Card */}
      <div className="rounded-3xl bg-white border border-[#ECE8F4] p-5 shadow-sm mb-4 text-center">
        {/* Flush Docked Artwork */}
        <div className="w-full max-w-[280px] mx-auto mb-3 flex items-end justify-center">
            <img
              src="/Meeting.png"
              alt="Two people meeting on AIL Plus"
              className="w-full h-auto max-h-[220px] object-contain select-none"
            />
        </div>

        <h1 className="text-xl font-bold text-[#1C1924] tracking-tight">
          Real connection, without limits.
        </h1>
        <p className="text-xs text-[#6C637B] leading-relaxed mt-1 mb-4 max-w-[310px] mx-auto">
          Southeast Asian women use Asians in Love completely free. AIL Plus unlocks full direct messaging, travel status, and a verified profile badge.
        </p>

        {/* Pricing Row */}
        <div className="rounded-2xl bg-[#FAF9FD] border border-[#ECE6F7] p-3 flex items-center justify-between mb-3 text-left">
          <div>
            <span className="text-xs font-bold text-[#1C1924]">Monthly Access</span>
            <p className="text-[11px] text-[#6C637B]">Cancel anytime in one click</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-[#1C1924]">$14.99</span>
            <span className="text-xs text-[#6C637B] ml-0.5">/mo</span>
          </div>
        </div>

        {/* Single Primary Action */}
        {isPlus ? (
          <button
            type="button"
            disabled={openingPortal}
            onClick={handlePortal}
            className="w-full py-3 rounded-full font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer bg-[#F3EFFC] border border-[#DDD7E5] text-[#6555B8] hover:bg-[#EAE4F7]"
          >
            {openingPortal ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading Stripe Portal...</span>
              </>
            ) : (
              <>
                <Settings className="w-4 h-4" />
                <span>Manage Active Subscription</span>
              </>
            )}
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={starting || loading}
              onClick={handleSubscribe}
              className="w-full py-3 rounded-full font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer bg-[#6555B8] hover:bg-[#5747A9] active:bg-[#4C3D97] text-white disabled:opacity-75"
            >
              {starting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Stripe...</span>
                </>
              ) : (
                <span>Upgrade to AIL Plus • $14.99/mo</span>
              )}
            </button>

            {/* Quiet Link Exclusively For Existing Subscribers Not Detected */}
            <div className="mt-3 flex items-center justify-center">
              <button
                type="button"
                disabled={openingPortal}
                onClick={handlePortal}
                className="text-[11px] font-medium text-[#6555B8] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <span>Already subscribed? Manage billing</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </>
        )}

        <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-400 mt-2.5">
          <Lock className="w-3 h-3 text-neutral-400" />
          <span>Encrypted checkout via Stripe</span>
        </div>
      </div>

      {statusMsg && (
        <div className="mb-4 p-2.5 rounded-2xl bg-[#6555B8]/10 border border-[#6555B8]/20 text-xs font-medium text-[#6555B8] text-center animate-in fade-in">
          {statusMsg}
        </div>
      )}

      {/* 3 Core Privileges */}
      <div className="rounded-3xl bg-white border border-[#ECE8F4] p-4 shadow-sm mb-4 space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">
          Included Privileges
        </div>

        <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#FAF9FD] border border-[#ECE6F7]/70">
          <div className="w-7 h-7 rounded-lg bg-white border border-[#DDD7E5] text-[#6555B8] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-xs font-bold text-[#1C1924]">Unlimited Direct Introductions</div>
            <p className="text-[11px] text-[#6C637B] mt-0.5 leading-snug">
              Send thoughtful first messages without hitting daily limits or waiting through cooldown timers.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#FAF9FD] border border-[#ECE6F7]/70">
          <div className="w-7 h-7 rounded-lg bg-white border border-[#DDD7E5] text-[#6555B8] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-xs font-bold text-[#1C1924]">Travel Status Badge</div>
            <p className="text-[11px] text-[#6C637B] mt-0.5 leading-snug">
              Announce "Visiting Soon" or "Currently Here" to match and plan authentic dates before your flight lands.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#FAF9FD] border border-[#ECE6F7]/70">
          <div className="w-7 h-7 rounded-lg bg-white border border-[#DDD7E5] text-[#6555B8] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-xs font-bold text-[#1C1924]">Verified Member Badge</div>
            <p className="text-[11px] text-[#6C637B] mt-0.5 leading-snug">
              Displays the purple Plus badge on your profile. Signals verified commitment and separates you from casual time-wasters.
            </p>
          </div>
        </div>
      </div>

      {/* Travel Status Hub */}
      <div className="rounded-3xl bg-white border border-[#ECE8F4] p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-xs font-bold text-[#1C1924]">Travel Status</div>
          <span className="text-[10px] font-semibold text-[#6555B8] bg-[#F3EFFC] px-2 py-0.5 rounded-full border border-[#DDD7E5]/60 flex items-center gap-1">
            {travelIntent === 'visiting' ? <Compass className="w-3 h-3 text-[#6555B8]" /> : <MapPin className="w-3 h-3 text-[#6555B8]" />}
            <span>{travelCity ? `${travelCity} • ${travelIntent === 'visiting' ? 'Visiting Soon' : 'In Town'}` : 'GPS Default'}</span>
          </span>
        </div>

        {/* Intent Segmented Control */}
        <div className="flex p-0.5 rounded-full bg-[#FAF9FD] border border-[#ECE6F7] mb-2.5">
          <button
            type="button"
            disabled={!isPlus}
            onClick={() => setTravelIntent('visiting')}
            className={`flex-1 py-1 rounded-full text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
              travelIntent === 'visiting'
                ? 'bg-[#6555B8] text-white shadow-xs'
                : 'text-[#6555B8] hover:bg-[#F3EFFC]'
            } disabled:opacity-50`}
          >
            <Compass className="w-3 h-3" />
            <span>Visiting Soon</span>
          </button>
          <button
            type="button"
            disabled={!isPlus}
            onClick={() => setTravelIntent('current')}
            className={`flex-1 py-1 rounded-full text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
              travelIntent === 'current'
                ? 'bg-[#6555B8] text-white shadow-xs'
                : 'text-[#6555B8] hover:bg-[#F3EFFC]'
            } disabled:opacity-50`}
          >
            <MapPin className="w-3 h-3" />
            <span>Currently Here</span>
          </button>
        </div>

        {/* Custom City Input */}
        <form onSubmit={handleCustomSubmit} className="relative mb-2.5">
          <input
            type="text"
            disabled={!isPlus}
            value={customCity}
            onChange={(e) => setCustomCity(e.target.value)}
            placeholder="Search or enter city (e.g. Cebu City, Manila)..."
            className="w-full h-8 pl-3 pr-8 rounded-xl bg-[#FAF9FD] border border-[#ECE6F7] text-xs text-[#1C1924] placeholder:text-neutral-400 focus:outline-none focus:border-[#6555B8] disabled:opacity-50"
          />
          {customCity.trim() && (
            <button
              type="submit"
              disabled={!isPlus}
              className="absolute right-1 top-1 w-6 h-6 rounded-lg bg-[#6555B8] text-white flex items-center justify-center hover:bg-[#5747A9] transition cursor-pointer"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </form>

        {/* Quick Hub Chips */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_HUBS.map((hub) => {
            const active = travelCity.toLowerCase() === hub.city.toLowerCase();
            return (
              <button
                key={hub.city}
                type="button"
                disabled={!isPlus}
                onClick={() => setDestination(hub.city, hub.country)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition cursor-pointer ${
                  active
                    ? 'bg-[#6555B8] border-[#6555B8] text-white shadow-xs'
                    : 'bg-[#FAF9FD] border-[#ECE6F7] text-[#1C1924] hover:border-[#6555B8]/50 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {hub.city}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AilPlusPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-dvh bg-[#F8F6FC] pb-28" />}>
      <PlusHubContent />
    </Suspense>
  );
}