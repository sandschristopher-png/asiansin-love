'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Lock, Check, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { isPlusProfile } from '@/lib/plus';

interface Profile {
  username: string | null;
  is_plus?: boolean | null;
  is_premium?: boolean | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
  created_at: string | null;
  username_locked_until: string | null;
  username_free_change_used: boolean | null;
}

const HANDLE_RE = /^[a-zA-Z0-9_]{3,20}$/;
const DAY_MS = 86400000;

export default function HandleChangeCard() {
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [statusText, setStatusText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoaded(true); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (data) {
        setProfile(data as Profile);
        setInput((data.username || '').replace(/^@/, ''));
      }
      setLoaded(true);
    })();
  }, [supabase]);

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const isPlus = isPlusProfile(profile);
  const lockedUntil = profile?.username_locked_until ? new Date(profile.username_locked_until) : null;
  const inCooldown = !!lockedUntil && lockedUntil.getTime() > Date.now();
  const accountAgeMs = profile?.created_at ? Date.now() - new Date(profile.created_at).getTime() : 0;
  const tooNew = accountAgeMs < 14 * DAY_MS;
  const freebieLeft = !!profile && profile.username_free_change_used !== true;

  const mode: 'loading' | 'too_new' | 'cooldown' | 'plus_required' | 'editable' =
    !loaded ? 'loading'
    : tooNew ? 'too_new'
    : inCooldown ? 'cooldown'
    : (!isPlus && !freebieLeft) ? 'plus_required'
    : 'editable';

  const daysLeft = lockedUntil ? Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / DAY_MS)) : 0;
  const daysUntilEligible = Math.max(1, Math.ceil((14 * DAY_MS - accountAgeMs) / DAY_MS));

  useEffect(() => {
    if (mode !== 'editable') return;
    const clean = input.trim();
    if (!HANDLE_RE.test(clean)) {
      setChecking(false); setAvailable(false);
      setStatusText('3–20 chars: letters, numbers, underscores');
      return;
    }
    if (profile && clean === (profile.username || '').replace(/^@/, '')) {
      setChecking(false); setAvailable(null); setStatusText('');
      return;
    }
    setChecking(true);
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc('check_username', { candidate: clean });
      setChecking(false);
      if (error || !data || !data.ok) { setAvailable(false); setStatusText('Could not check availability'); return; }
      if (data.available) { setAvailable(true); setStatusText('Available'); }
      else if (data.reason === 'taken') { setAvailable(false); setStatusText('Taken'); }
      else if (data.reason === 'reserved') { setAvailable(false); setStatusText('Reserved after recent release'); }
      else { setAvailable(false); setStatusText('Invalid handle'); }
    }, 450);
    return () => clearTimeout(t);
  }, [input, mode, profile, supabase]);

  const save = async () => {
    const clean = input.trim();
    if (!HANDLE_RE.test(clean)) return;
    setSaving(true); setMessage('');
    const res = await fetch('/api/users/change-username', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: clean }),
  });
  const data = await res.json();
    setSaving(false);
    if (!data) { setMessage('Something went wrong. Try again.'); return; }
    if (!data.ok && data.detail) console.warn('change_username failed:', data.detail, data.error);
    if (data && data.ok) {
      if (profile) {
        setProfile({ ...profile, username: clean,
          username_locked_until: data.locked_until || profile.username_locked_until,
          username_free_change_used: data.first_claim ? false : true });
      }
      setAvailable(null); setStatusText('');
      setMessage('Handle updated.');
    } else if (data) {
      if (data.error === 'cooldown') {
        if (profile && data.locked_until) setProfile({ ...profile, username_locked_until: data.locked_until });
        setMessage('Next change in ' + Math.max(1, Math.ceil((new Date(data.locked_until).getTime() - Date.now()) / DAY_MS)) + ' days.');
      } else if (data.error === 'plus_required') {
        if (profile) setProfile({ ...profile, username_free_change_used: true });
        setMessage('AIL+ required to change again.');
      } else if (data.error === 'taken') { setMessage('That handle is taken.'); }
      else if (data.error === 'reserved') { setMessage('That handle is reserved.'); }
      else if (data.error === 'account_too_new') { setMessage('Handles unlock 14 days after signup.'); }
      else { setMessage('Could not update handle.'); }
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-[#6555b8] block mb-1" style={{ fontFamily: 'var(--font-brand)' }}>Member Handle</label>
        <p className="text-[11px] text-[#6C637B] mb-2">Your unique identifier across Asians in Love.</p>
      </div>

      {mode === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-[#A8A29E]"><Loader2 className="animate-spin" size={16} /> Loading...</div>
      )}

      {mode === 'too_new' && (
        <div className="p-3.5 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#1C1924]">{(profile?.username || '').replace(/^@/, '')}</span>
            <Lock className="w-3.5 h-3.5 text-[#9A8CC3]" />
          </div>
          <p className="text-xs text-[#6C637B] mt-1.5">Handle changes unlock 14 days after signup — {daysUntilEligible} {daysUntilEligible === 1 ? 'day' : 'days'} to go.</p>
        </div>
      )}

      {mode === 'cooldown' && (
        <div className="p-3.5 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#1C1924]">{(profile?.username || '').replace(/^@/, '')}</span>
            <Lock className="w-3.5 h-3.5 text-[#9A8CC3]" />
          </div>
          <p className="text-xs text-[#6C637B] mt-1.5">Next change available in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}.</p>
        </div>
      )}

      {mode === 'plus_required' && (
        <div className="p-3.5 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#1C1924]">{(profile?.username || '').replace(/^@/, '')}</span>
            <Lock className="w-3.5 h-3.5 text-[#9A8CC3]" />
          </div>
          <p className="text-xs text-[#6C637B]">You have used your free handle change.</p>
          <Link href="/plus" className="block w-full py-2.5 rounded-2xl bg-[#6555b8] hover:bg-[#52449e] text-white text-xs font-semibold text-center transition">Unlock Handle Changes with AIL+</Link>
        </div>
      )}

      {mode === 'editable' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <span className="absolute left-3.5 text-sm font-medium text-[#8C849B]"></span>
              <input
                type="text"
                value={input}
                maxLength={20}
                onChange={(e) => { setInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, '')); setMessage(''); }}
                disabled={saving}
                className="w-full pl-8 pr-4 py-2.5 bg-[#F8F7FA] border border-[#DDD7E5] rounded-2xl text-sm font-semibold text-[#1C1924] focus:outline-none focus:bg-white focus:border-[#6555b8] focus:ring-2 focus:ring-[#6555b8]/15 transition disabled:opacity-60"
                placeholder="username"
              />
              {checking && <Loader2 className="absolute right-3.5 animate-spin text-[#9A8CC3]" size={14} />}
              {!checking && available === true && <Check className="absolute right-3.5 text-emerald-500" size={14} />}
            </div>
            <button
              onClick={save}
              disabled={!available || saving}
              className="px-4 py-2.5 rounded-2xl bg-[#6555b8] hover:bg-[#52449e] disabled:opacity-50 text-white text-xs font-semibold transition active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save</span>
            </button>
          </div>
          {(available !== null || checking) && statusText && (
            <p className={'text-xs font-semibold ' + (available === true ? 'text-emerald-600' : checking ? 'text-[#9A8CC3]' : 'text-rose-600')}>{statusText}</p>
          )}
          {!isPlus && freebieLeft && (
            <p className="text-[11px] text-[#9A8CC3]">One free change remaining — after that, AIL+ required.</p>
          )}
        </div>
      )}

      {message && <p className="text-xs font-semibold text-[#6555b8]">{message}</p>}
    </div>
  );
}