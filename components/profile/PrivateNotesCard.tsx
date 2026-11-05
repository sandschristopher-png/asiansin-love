'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const MAX_NOTE_CHARS = 2000;

/**
 * Private note about another member (public.user_notes, RLS: owner only). Collapsed by default;
 * the note saves when the textarea loses focus, and clearing it deletes the row.
 */
export function PrivateNotesCard({ targetId }: { targetId: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const savedRef = useRef('');
  const userIdRef = useRef<string | null>(null);
  const savedTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      userIdRef.current = uid;
      if (!uid || uid === targetId) return;
      const { data } = await supabase
        .from('user_notes')
        .select('note')
        .eq('user_id', uid)
        .eq('target_id', targetId)
        .maybeSingle();
      if (cancelled || !data?.note) return;
      savedRef.current = data.note;
      setNote(data.note);
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(savedTimer.current);
    };
  }, [targetId]);

  const save = async () => {
    const uid = userIdRef.current;
    const text = note.trim();
    if (!uid || text === savedRef.current) return;
    setStatus('saving');
    const { error } = text
      ? await supabase
          .from('user_notes')
          .upsert({ user_id: uid, target_id: targetId, note: text, updated_at: new Date().toISOString() }, { onConflict: 'user_id,target_id' })
      : await supabase.from('user_notes').delete().eq('user_id', uid).eq('target_id', targetId);
    if (error) {
      setStatus('error');
      return;
    }
    savedRef.current = text;
    setStatus('saved');
    window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <div className="rounded-2xl border border-[#ECE8F4] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer"
      >
        <span>
          <span className="block text-[13px] font-bold text-[#2D264B]">Private Notes</span>
          <span className="block text-[11px] text-[#2D264B]/50">Only visible to you</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-[#2D264B]/40 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div className="px-4 pb-3">
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value.slice(0, MAX_NOTE_CHARS));
              if (status !== 'idle') setStatus('idle');
            }}
            onBlur={save}
            rows={3}
            placeholder="Things to remember about this member"
            aria-label="Private note"
            className="w-full resize-none rounded-xl border border-[#ECE8F4] bg-white px-3 py-2 text-[13px] leading-relaxed text-[#2D264B] placeholder:text-[#2D264B]/35 focus:outline-none focus:border-[#8C71F5]/50"
          />
          <p className="mt-1 h-4 text-right text-[10.5px] font-medium text-[#2D264B]/45" aria-live="polite">
            {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : status === 'error' ? 'Could not save. Try again.' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

export default PrivateNotesCard;
