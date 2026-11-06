'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const MAX_NOTE_CHARS = 2000;
const SAVE_DEBOUNCE_MS = 900;
const CACHE_PREFIX = 'ail_note:';

type Cached = { note: string; synced: boolean };

const cacheKey = (uid: string, targetId: string) => `${CACHE_PREFIX}${uid}:${targetId}`;
function readCache(key: string): Cached | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}
function writeCache(key: string, value: Cached) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / private mode: the server copy still saves
  }
}

/**
 * Private scratchpad about another member (public.user_notes, RLS: owner only), e.g. travel plans
 * or shared interests. Typing is cached locally at once (shown instantly next visit, and kept if
 * the network drops) and saved to Supabase 900 ms after the last keystroke and on blur. Clearing
 * the note deletes the row.
 */
export function PrivateNotesCard({ targetId }: { targetId: string }) {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [ready, setReady] = useState(false);
  const savedRef = useRef('');
  const keyRef = useRef<string | null>(null);
  const uidRef = useRef<string | null>(null);
  const debounceRef = useRef<number | undefined>(undefined);
  const savedTimer = useRef<number | undefined>(undefined);

  async function persist(value: string) {
    const uid = uidRef.current;
    const key = keyRef.current;
    const text = value.trim();
    if (!uid || !key || text === savedRef.current) return;
    setStatus('saving');
    const { error } = text
      ? await supabase
          .from('user_notes')
          .upsert(
            { user_id: uid, target_id: targetId, note: text, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,target_id' }
          )
      : await supabase.from('user_notes').delete().eq('user_id', uid).eq('target_id', targetId);
    if (error) {
      setStatus('error');
      return;
    }
    savedRef.current = text;
    writeCache(key, { note: value, synced: true });
    setStatus('saved');
    window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setStatus('idle'), 2000);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      if (cancelled || !uid || uid === targetId) return;
      uidRef.current = uid;
      const key = cacheKey(uid, targetId);
      keyRef.current = key;

      // 1. Instant: the local copy.
      const cached = readCache(key);
      if (cached) setNote(cached.note);
      setReady(true);

      // 2. The server copy wins unless the local one has edits that never reached it.
      const { data, error } = await supabase
        .from('user_notes')
        .select('note')
        .eq('user_id', uid)
        .eq('target_id', targetId)
        .maybeSingle();
      if (cancelled || error) return;
      const server = data?.note ?? '';
      savedRef.current = server;
      if (cached && !cached.synced && cached.note.trim() !== server) {
        void persist(cached.note); // push the offline edit
      } else {
        setNote(server);
        writeCache(key, { note: server, synced: true });
      }
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(debounceRef.current);
      window.clearTimeout(savedTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- persist only reads refs and targetId
  }, [targetId]);

  if (!ready) return null; // signed out, or your own profile

  return (
    <section className="rounded-2xl border border-[#D0CDE1]/60 bg-white p-4 shadow-brand-sm" aria-labelledby="private-notes-title">
      <div className="flex items-center justify-between gap-3">
        <h3 id="private-notes-title" className="text-sm font-bold text-[#413B5E]">
          Private Notes
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#D0CDE1] bg-[#E8E6F1]/50 px-2 py-0.5 text-[10.5px] font-medium text-[#665D96]">
          <Lock className="w-3 h-3" aria-hidden />
          Only you can see this
        </span>
      </div>
      <textarea
        value={note}
        onChange={(e) => {
          const value = e.target.value.slice(0, MAX_NOTE_CHARS);
          setNote(value);
          setStatus('idle');
          if (keyRef.current) writeCache(keyRef.current, { note: value, synced: false });
          window.clearTimeout(debounceRef.current);
          debounceRef.current = window.setTimeout(() => void persist(value), SAVE_DEBOUNCE_MS);
        }}
        onBlur={() => {
          window.clearTimeout(debounceRef.current);
          void persist(note);
        }}
        rows={3}
        placeholder="Travel plans, shared interests, things to ask next time"
        aria-label="Private note about this member"
        className="mt-3 w-full min-h-[84px] resize-y rounded-xl border border-[#D0CDE1] bg-[#E8E6F1]/20 px-3 py-2 text-base sm:text-[13px] leading-relaxed text-[#413B5E] placeholder:text-[#413B5E]/40 focus:outline-none focus:border-[#665D96] focus:ring-2 focus:ring-[#665D96]/30"
      />
      <p className="mt-1 h-4 text-right text-[10.5px] font-medium text-[#413B5E]/50" aria-live="polite">
        {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : status === 'error' ? 'Kept on this device. Will retry.' : ''}
      </p>
    </section>
  );
}

export default PrivateNotesCard;
