'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, Globe, Eye, Zap, Check, Share2, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const PASSPORT_DESTINATIONS = [
  { city: 'Manila', country: 'Philippines', tag: 'Top Hub' },
  { city: 'Cebu City', country: 'Philippines', tag: 'Popular' },
  { city: 'Angeles City', country: 'Philippines', tag: 'Active' },
  { city: 'Davao City', country: 'Philippines', tag: 'Mindanao' },
  { city: 'Bislig', country: 'Philippines', tag: 'Surigao' },
  { city: 'Bangkok', country: 'Thailand', tag: 'Top Hub' },
  { city: 'Chiang Mai', country: 'Thailand', tag: 'Popular' },
  { city: 'Jakarta', country: 'Indonesia', tag: 'Capital' },
  { city: 'Bali', country: 'Indonesia', tag: 'Island' },
  { city: 'Yangon', country: 'Myanmar', tag: 'Rising' },
  { city: 'Phnom Penh', country: 'Cambodia', tag: 'Riverside' },
  { city: 'Ho Chi Minh City', country: 'Vietnam', tag: 'Saigon' },
  { city: 'Vientiane', country: 'Laos', tag: 'Mekong' }
];

export default function AilPlusHubPage() {
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [username, setUsername] = useState('Member');
  const [isPlus, setIsPlus] = useState(false);
  const [travelCity, setTravelCity] = useState('');
  const [travelCountry, setTravelCountry] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const sb = supabase;

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { if (mounted) setLoading(false); return; }
        const { data: prof } = await sb
          .from('profiles')
          .select('username, is_plus, travel_city, travel_country')
          .eq('id', user.id)
          .maybeSingle();
        if (mounted && prof) {
          setUsername(prof.username || 'Member');
          setIsPlus(Boolean(prof.is_plus));
          setTravelCity(prof.travel_city || '');
          setTravelCountry(prof.travel_country || '');
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function handleSubscribe() {
    setStarting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/plus/checkout', { method: 'POST' });
      const json = await res.json();
      if (res.status === 503) {
        setStatusMsg('Payments are being set up. Check back shortly!');
        return;
      }
      if (!res.ok || !json.url) {
        setStatusMsg(json.error || 'Could not start checkout.');
        return;
      }
      window.location.href = json.url;
    } catch {
      setStatusMsg('Network error. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  async function handlePassport(city: string, country: string) {
    if (!isPlus) {
      setStatusMsg('Upgrade to AIL+ below to unlock Southeast Asia Travel Passport Mode.');
      return;
    }
    setStatusMsg(null);
    try {
      const res = await fetch('/api/plus/passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, country })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to update passport.');
      }
      setTravelCity(city);
      setTravelCountry(country);
      setStatusMsg(`Now browsing ${city}, ${country}!`);
    } catch (err: any) {
      setStatusMsg(err?.message || 'Failed to update passport.');
    }
  }

  async function handleShare() {
    const shareUrl = `https://asiansin.love/?ref=${encodeURIComponent(username)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Asians in Love',
          text: 'Verified Southeast Asian dating with real reputation scores.',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setStatusMsg('Referral link copied to clipboard!');
      }
    } catch {}
  }

  return (
    <main className="min-h-dvh bg-[#F8F6FC] pb-28">
      <div className="max-w-md mx-auto px-4 pt-3 animate-fade-in-up">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2A1F4A] via-[#43337A] to-[#6555B8] text-white p-6 shadow-md mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-300 text-xs font-bold mb-3">
            <img src="/ail-plus.png" alt="AIL+" className="w-4 h-4 rounded-sm" />
            <span>AIL+ MEMBERSHIP</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight mb-1.5">
            Meet Verified Singles Across Southeast Asia Faster
          </h1>
          <p className="text-xs text-white/85 leading-relaxed mb-5">
            Unblur everyone who Sparked you, unlock your full visitor history, and browse members in any city across the region.
          </p>

          <div className="flex items-baseline justify-between bg-black/25 rounded-2xl p-3.5 mb-4 border border-white/10">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">Monthly Access</div>
              <div className="text-2xl font-extrabold text-white">
                $14.99<span className="text-xs font-normal text-white/75"> / month</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-[11px] font-bold">
              Cancel Anytime
            </span>
          </div>

          <button
            type="button"
            disabled={starting || loading}
            onClick={handleSubscribe}
            className="w-full h-11 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer bg-white text-[#2A1F4A] hover:bg-amber-50"
          >
            <Crown className="w-4 h-4 text-amber-500" />
            <span>{starting ? 'Starting checkout...' : isPlus ? 'AIL+ Active · Manage in Settings' : 'Activate AIL+ Privileges · $14.99/mo'}</span>
          </button>
        </div>

        {statusMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-[#6555B8]/10 border border-[#6555B8]/25 text-xs font-medium text-[#2A1F4A] text-center animate-scale-in">
            {statusMsg}
          </div>
        )}

        <div className="rounded-2xl bg-white border border-[#ECE8F4] p-4 shadow-sm mb-4 space-y-3.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#6C637B]">Included Privileges</div>
          {[
            { icon: Zap, title: 'Unblur All Incoming Sparks', desc: 'See everyone who sparked you and connect instantly.' },
            { icon: Eye, title: 'Full Visitor History', desc: 'See every member who viewed your profile.' },
            { icon: Globe, title: 'Southeast Asia Travel Passport Mode', desc: 'Browse members in Manila, Cebu, Bangkok, Jakarta, or Bali.' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#F3F0FA] text-[#6555B8] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#1C1924] flex items-center gap-1.5">
                    <span>{item.title}</span>
                    {isPlus && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-[#6C637B] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-white border border-[#ECE8F4] p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1924]">
              <MapPin className="w-4 h-4 text-[#6555B8]" />
              <span>Travel Passport Mode</span>
            </div>
            <span className="text-[11px] font-semibold text-[#6555B8]">
              {travelCity ? `${travelCity}, ${travelCountry}` : 'GPS Default'}
            </span>
          </div>
          <p className="text-[11px] text-[#6C637B] mb-3">Select any Southeast Asian destination below:</p>
          <div className="grid grid-cols-2 gap-2">
            {PASSPORT_DESTINATIONS.map((dest) => {
              const active = travelCity.toLowerCase() === dest.city.toLowerCase();
              return (
                <button
                  key={dest.city}
                  type="button"
                  disabled={!isPlus}
                  onClick={() => handlePassport(dest.city, dest.country)}
                  className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 cursor-pointer ${
                    active ? 'bg-[#6555B8] border-[#6555B8] text-white shadow-sm' : 'bg-[#FAF9FD] border-[#E6E1F0] text-[#1C1924] hover:border-[#6555B8]/50'
                  }`}>
                  <div className="text-xs font-bold truncate">{dest.city}</div>
                  <div className={`text-[10px] truncate ${active ? 'text-white/80' : 'text-[#6C637B]'}`}>
                    {dest.country} · {dest.tag}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-[#F3F0FA] to-[#FDFBFF] border border-[#DDD7E5] p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#1C1924] mb-0.5">Give 7 Days, Get 7 Days Free</div>
            <p className="text-[11px] text-[#6C637B]">Invite a friend and unlock a free week of AIL+.</p>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="shrink-0 h-9 px-4 rounded-full bg-[#6555B8] text-white text-xs font-semibold inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </main>
  );
}
