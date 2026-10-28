'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Bell } from 'lucide-react';

type Prefs = { visits: boolean; sparks: boolean; matches: boolean; messages: boolean };

const DEFAULT_PREFS: Prefs = { visits: true, sparks: true, matches: true, messages: true };

const LABELS: { key: keyof Prefs; label: string; hint: string }[] = [
  { key: 'visits', label: 'Profile Visits', hint: 'When someone views your profile' },
  { key: 'sparks', label: 'Sparks', hint: 'When someone sparks your profile' },
  { key: 'matches', label: 'Matches', hint: 'When you both spark each other' },
  { key: 'messages', label: 'Messages', hint: 'New messages from your chats' },
];

export function NotificationPrefsCard() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('profiles')
        .select('notification_prefs')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.notification_prefs) setPrefs({ ...DEFAULT_PREFS, ...data.notification_prefs });
      setLoading(false);
    })();
  }, []);

  async function persist(next: Prefs) {
    setPrefs(next);
    setSaving(true);
    try {
      await supabase.rpc('update_notification_prefs', { p_prefs: next });
    } catch (err) {
      console.warn('Failed to save notification prefs', err);
    }
    setSaving(false);
  }

  const allOff = !prefs.visits && !prefs.sparks && !prefs.matches && !prefs.messages;

  return (
    <div className="rounded-3xl bg-white border border-[#DDD7E5] shadow-xs p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#6555B8]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#524B5E]">Notifications</span>
        </div>
        <button
          type="button"
          disabled={saving || loading}
          onClick={() => persist(allOff ? DEFAULT_PREFS : { visits: false, sparks: false, matches: false, messages: false })}
          className="text-xs font-semibold text-[#6555B8] hover:underline disabled:opacity-50"
        >
          {allOff ? 'Turn All On' : 'Turn All Off'}
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-[#6C637B]">Loading...</p>
      ) : (
        <div className="divide-y divide-[#F0EDF4]">
          {LABELS.map(({ key, label, hint }) => (
            <div key={key} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-[#1C1924]">{label}</p>
                <p className="text-xs text-[#6C637B]">{hint}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[key]}
                onClick={() => persist({ ...prefs, [key]: !prefs[key] })}
                className={'relative h-6 w-11 shrink-0 rounded-full transition-colors ' + (prefs[key] ? 'bg-[#6555B8]' : 'bg-[#DDD7E5]')}
              >
                <span className={'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ' + (prefs[key] ? 'translate-x-[22px]' : 'translate-x-0.5')} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}