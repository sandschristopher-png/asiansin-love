'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function OnboardingProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean; error?: string } | null>(null);
  const [gender, setGender] = useState('');
  const [interestedIn, setInterestedIn] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // IP-based city/country prefill (best-effort, silent on failure)
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.city === 'string') setCity(d.city);
        if (d && typeof d.country_name === 'string') setCountry(d.country_name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const clean = username.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (clean.length < 3) { setUsernameStatus(null); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/users/check-username?username=' + encodeURIComponent(clean));
        const data = await res.json();
        setUsernameStatus(data.available ? { available: true } : { available: false });
      } catch { setUsernameStatus(null); }
    }, 350);
    return () => clearTimeout(t);
  }, [username]);

  const is18 = (() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) return false;
    const dob = new Date(birthdate);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age >= 18 && age <= 99;
  })();

  const canContinue =
    username.trim().length >= 3 &&
    usernameStatus?.available &&
    gender !== '' &&
    interestedIn !== '' &&
    is18 &&
    city.trim() !== '' &&
    country.trim() !== '';

  const handleContinue = async () => {
    if (!canContinue) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const { error: dbError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: username.trim(),
        gender,
        interested_in: [interestedIn],
        birthdate,
        city: city.trim(),
        country: country.trim(),
        updated_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;
      router.push('/onboarding/photo');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-slate-900';
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Create your profile</h1>
          <p className="text-xs text-slate-500 mt-1">Takes about 45 seconds.</p>
        </div>

        {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">{error}</div>}

        <div>
          <label className={labelCls}>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_handle" className={inputCls} />
          {usernameStatus && (
            <p className={'text-[11px] mt-1.5 ' + (usernameStatus.available ? 'text-emerald-600' : 'text-rose-500')}>
              {usernameStatus.available ? 'Available' : 'Taken or unavailable'}
            </p>
          )}
        </div>

        <div>
          <label className={labelCls}>I am a</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ v: 'male', l: 'Man' }, { v: 'female', l: 'Woman' }].map((o) => (
              <button key={o.v} type="button" onClick={() => setGender(o.v)}
                className={'py-2.5 rounded-xl text-sm font-medium transition ' + (gender === o.v ? 'bg-slate-900 text-white' : 'bg-slate-100 border border-slate-200 text-slate-900')}>
                {o.l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Looking for</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ v: 'female', l: 'Women' }, { v: 'male', l: 'Men' }].map((o) => (
              <button key={o.v} type="button" onClick={() => setInterestedIn(o.v)}
                className={'py-2.5 rounded-xl text-sm font-medium transition ' + (interestedIn === o.v ? 'bg-slate-900 text-white' : 'bg-slate-100 border border-slate-200 text-slate-900')}>
                {o.l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Date of birth</label>
          <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className={inputCls} />
          {birthdate && !is18 && <p className="text-[11px] mt-1.5 text-rose-500">You must be 18 or older.</p>}
        </div>

        <div>
          <label className={labelCls}>Location</label>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={inputCls} />
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className={inputCls} />
          </div>
        </div>

        <button type="button" disabled={!canContinue || loading} onClick={handleContinue}
          className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition active:scale-[0.99] disabled:opacity-40">
          {loading ? 'Saving...' : 'Continue'}
        </button>

        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}