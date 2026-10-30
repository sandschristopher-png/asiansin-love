'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Infinity, 
  Compass, 
  ShieldCheck, 
  Check, 
  MapPin, 
  MessageSquare, 
  CheckCircle2, 
  Loader2, 
  Lock, 
  Settings,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const TOP_DESTINATIONS = [
  { city: 'Cebu City', country: 'Philippines' },
  { city: 'Manila', country: 'Philippines' },
  { city: 'Bangkok', country: 'Thailand' },
  { city: 'Tokyo', country: 'Japan' },
  { city: 'Kuala Lumpur', country: 'Malaysia' },
  { city: 'Bali', country: 'Indonesia' },
];

function AilPlusHubContent() {
  const searchParams = useSearchParams();
  const isPostCheckoutSuccess = searchParams.get('success') === '1';

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [isPlus, setIsPlus] = useState(false);
  
  // Travel status
  const [travelIntent, setTravelIntent] = useState<'visiting' | 'current'>('visiting');
  const [travelCity, setTravelCity] = useState('');
  const [travelCountry, setTravelCountry] = useState('');

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

  async function handleManageSubscription() {
    setOpeningPortal(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/plus/portal', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setStatusMsg(json.error || 'Could not open subscription portal.');
        return;
      }
      window.location.href = json.url;
    } catch {
      setStatusMsg('Network error connecting to billing portal.');
    } finally {
      setOpeningPortal(false);
    }
  }

  async function handleSelectDestination(city: string, country: string) {
    if (!isPlus) {
      setStatusMsg('Upgrade to AIL+ below to activate Travel Status.');
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
      const label = travelIntent === 'visiting' ? 'Visiting Soon' : 'Currently Here';
      setStatusMsg(`Travel status set to ${city}, ${country} (${label}).`);
    } catch (err: any) {
      setStatusMsg(err?.message || 'Failed to update location.');
    }
  }

  return (
    <main className="min-h-dvh bg-[#F8F6FC] pb-36">
      <div className="max-w-[430px] mx-auto px-4 pt-3 animate-in fade-in duration-200">
        
        {/* Post-Checkout Confirmation Banner */}
        {isPostCheckoutSuccess && (
          <div className="mb-4 p-4 rounded-3xl bg-white border border-emerald-100 shadow-sm flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              {isVerifyingPlus && !isPlus ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <h2 className="text-base font-bold text-[#1C1924] tracking-tight">
              {isPlus ? 'Welcome to AIL Plus!' : 'Confirming Your Membership...'}
            </h2>
            <p className="text-xs text-[#6C637B] mt-0.5 mb-3.5 max-w-xs">
              {isPlus
                ? 'Your account is active. Enjoy unlimited introductions, travel status, and priority discovery.'
                : 'Finalizing your upgrade via Stripe. This takes just a moment...'}
            </p>
            <div className="flex items-center gap-2 w-full">
              <Link
                href="/chat"
                className="flex-1 py-2.5 rounded-full bg-[#6555B8] hover:bg-[#5747A9] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Go to Messages</span>
              </Link>
              <Link
                href="/discover"
                className="flex-1 py-2.5 rounded-full bg-white hover:bg-[#F3EFFC] border border-[#DDD7E5] text-[#6555B8] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Discover</span>
              </Link>
            </div>
          </div>
        )}

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-[#ECE8F4] p-5 shadow-sm mb-4 text-center">
          
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#F3EFFC] text-[#6555B8] border border-[#DDD7E5]/70 text-[10px] font-bold tracking-widest uppercase">
            AIL PLUS
          </div>

          {/* Clean Artwork Stage */}
          <div className="relative w-full max-w-[190px] mx-auto my-3 flex items-center justify-center">
            <img
              src="/ail-plus.png"
              alt="AIL Plus"
              className="w-full h-auto max-h-[175px] object-contain select-none"
            />
          </div>

          <h1 className="text-xl font-bold text-[#1C1924] tracking-tight">
            Real connection, without limits.
          </h1>
          <p className="text-xs text-[#6C637B] leading-relaxed mt-1.5 mb-4 max-w-[310px] mx-auto">
            Connect directly with verified singles across Southeast Asia. Signal authentic intent and plan genuine dates before your travels.
          </p>

          {/* Plan Summary Card */}
          <div className="rounded-2xl bg-[#FAF9FD] border border-[#ECE6F7] p-3.5 flex items-center justify-between mb-3 text-left">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#1C1924]">Monthly Access</span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#6555B8] text-white px-2 py-0.5 rounded-full">
                  Full Access
                </span>
              </div>
              <p className="text-[11px] text-[#6C637B] mt-0.5">Cancel anytime with one click • No hidden fees</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-[#1C1924]">$14.99</span>
              <span className="text-xs text-[#6C637B] ml-0.5">/mo</span>
            </div>
          </div>

          {/* Primary Action Button */}
          {isPlus ? (
            <button
              type="button"
              disabled={openingPortal}
              onClick={handleManageSubscription}
              className="w-full py-3.5 rounded-full font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer bg-white border border-[#6555B8] text-[#6555B8] hover:bg-[#F3EFFC]"
            >
              {openingPortal ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading Portal...</span>
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  <span>Manage Active Subscription</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={starting || loading}
              onClick={handleSubscribe}
              className="w-full py-3.5 rounded-full font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer bg-[#6555B8] hover:bg-[#5747A9] active:bg-[#4C3D97] text-white disabled:opacity-75"
            >
              {starting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Starting checkout...</span>
                </>
              ) : (
                <span>Upgrade to AIL Plus • $14.99/mo</span>
              )}
            </button>
          )}

          {/* Persistent In-Card Link to Manage Subscription */}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <button
              type="button"
              disabled={openingPortal}
              onClick={handleManageSubscription}
              className="text-[11px] font-medium text-[#6555B8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Subscription & Invoices</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-400 mt-2">
            <Lock className="w-3 h-3 text-neutral-400" />
            <span>Encrypted checkout via Stripe</span>
          </div>
        </div>

        {statusMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-[#6555B8]/10 border border-[#6555B8]/25 text-xs font-medium text-[#6555B8] text-center animate-in fade-in">
            {statusMsg}
          </div>
        )}

        {/* 3 Core Privileges (Uncluttered) */}
        <div className="rounded-3xl bg-white border border-[#ECE8F4] p-4 shadow-sm mb-4 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
            Included Privileges
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#FAF9FD] border border-[#ECE6F7]/80">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#DDD7E5] text-[#6555B8] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Infinity className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-bold text-[#1C1924] flex items-center gap-1.5">
                <span>Unlimited Direct Introductions</span>
                {isPlus && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              </div>
              <p className="text-[11px] text-[#6C637B] leading-relaxed mt-0.5">
                Send thoughtful first messages without hitting the free daily intro caps or waiting through cooldown timers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#FAF9FD] border border-[#ECE6F7]/80">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#DDD7E5] text-[#6555B8] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Compass className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-bold text-[#1C1924] flex items-center gap-1.5">
                <span>Travel Status: Visiting Soon & In Town</span>
                {isPlus && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              </div>
              <p className="text-[11px] text-[#6C637B] leading-relaxed mt-0.5">
                Set your active destination to let members know when you are visiting so you can plan real meetups before you land.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#FAF9FD] border border-[#ECE6F7]/80">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#DDD7E5] text-[#6555B8] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-bold text-[#1C1924] flex items-center gap-1.5">
                <span>Verified Sincerity Plus Badge</span>
                {isPlus && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              </div>
              <p className="text-[11px] text-[#6C637B] leading-relaxed mt-0.5">
                Southeast Asian women use Asians in Love completely free. Your Plus badge signals genuine commitment and filters out casual time-wasters.
              </p>
            </div>
          </div>
        </div>

        {/* Travel Status Hub */}
        <div className="rounded-3xl bg-white border border-[#ECE8F4] p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1924]">
              <Compass className="w-4 h-4 text-[#6555B8]" />
              <span>Travel Status</span>
            </div>
            <span className="text-[11px] font-semibold text-[#6555B8] bg-[#F3EFFC] px-2.5 py-0.5 rounded-full border border-[#DDD7E5]/60 flex items-center gap-1">
              {travelIntent === 'visiting' ? <Compass className="w-3 h-3 text-[#6555B8]" /> : <MapPin className="w-3 h-3 text-[#6555B8]" />}
              <span>{travelCity ? `${travelCity} • ${travelIntent === 'visiting' ? 'Visiting Soon' : 'In Town'}` : 'GPS Default'}</span>
            </span>
          </div>

          {/* Segmented Control */}
          <div className="flex p-1 rounded-full bg-[#FAF9FD] border border-[#ECE6F7] mb-3">
            <button
              type="button"
              disabled={!isPlus}
              onClick={() => setTravelIntent('visiting')}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                travelIntent === 'visiting'
                  ? 'bg-[#6555B8] text-white shadow-xs'
                  : 'text-[#6555B8] hover:bg-[#F3EFFC]'
              } disabled:opacity-50`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Visiting Soon</span>
            </button>
            <button
              type="button"
              disabled={!isPlus}
              onClick={() => setTravelIntent('current')}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                travelIntent === 'current'
                  ? 'bg-[#6555B8] text-white shadow-xs'
                  : 'text-[#6555B8] hover:bg-[#F3EFFC]'
              } disabled:opacity-50`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Currently Here</span>
            </button>
          </div>

          {/* Quick Hubs Grid */}
          <div className="grid grid-cols-2 gap-2">
            {TOP_DESTINATIONS.map((hub) => {
              const active = travelCity.toLowerCase() === hub.city.toLowerCase();
              return (
                <button
                  key={hub.city}
                  type="button"
                  disabled={!isPlus}
                  onClick={() => handleSelectDestination(hub.city, hub.country)}
                  className={`p-2.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer ${
                    active
                      ? 'bg-[#6555B8] border-[#6555B8] text-white shadow-xs'
                      : 'bg-[#FAF9FD] border-[#ECE6F7] text-[#1C1924] hover:border-[#6555B8]/50 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{hub.city}</div>
                  <div className={`text-[10px] truncate ${active ? 'text-white/80' : 'text-[#6C637B]'}`}>
                    {hub.country}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Persistent Bottom Billing Management Card */}
        <div className="rounded-3xl bg-white border border-[#ECE8F4] p-4 shadow-sm mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#1C1924] mb-0.5">Subscription & Billing</div>
            <p className="text-[11px] text-[#6C637B]">Update card, view receipts, or cancel anytime.</p>
          </div>
          <button
            type="button"
            disabled={openingPortal}
            onClick={handleManageSubscription}
            className="shrink-0 h-9 px-3.5 rounded-full bg-[#FAF9FD] hover:bg-[#F3EFFC] border border-[#DDD7E5] text-[#6555B8] text-xs font-semibold inline-flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
          >
            {openingPortal ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Settings className="w-3.5 h-3.5" />
            )}
            <span>Manage</span>
          </button>
        </div>

      </div>
    </main>
  );
}

export default function AilPlusHubPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-[#F8F6FC] pb-36" />}>
      <AilPlusHubPageInner />
    </Suspense>
  );
}

function AilPlusHubPageInner() {
  return <AilPlusHubContent />;
}