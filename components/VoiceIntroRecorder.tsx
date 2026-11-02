'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Mic, Square, RotateCcw, Trash2, Check, Loader2 } from 'lucide-react';
import { AudioPill } from '@/components/AudioPill';
import { useVoiceRecorder } from '@/lib/useVoiceRecorder';
import { VOICE_INTRO_MAX_MS, VOICE_INTRO_MIN_MS, formatSeconds, isTrustedVoiceIntroUrl } from '@/lib/audio';

/**
 * Record a 5-10 second voice greeting, preview it, then save it to the profile.
 * Shows the current intro (with re-record / remove) when one exists.
 */
export function VoiceIntroRecorder({
  initialUrl,
  onChange,
}: {
  initialUrl?: string | null;
  onChange?: (url: string | null) => void;
}) {
  const rec = useVoiceRecorder(VOICE_INTRO_MAX_MS);
  const [savedUrl, setSavedUrl] = useState<string | null>(isTrustedVoiceIntroUrl(initialUrl) ? initialUrl : null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setSavedUrl(isTrustedVoiceIntroUrl(initialUrl) ? initialUrl : null);
  }, [initialUrl]);

  const previewUrl = useMemo(() => (rec.blob ? URL.createObjectURL(rec.blob) : null), [rec.blob]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const tooShort = rec.state === 'recorded' && rec.durationMs < VOICE_INTRO_MIN_MS;

  const save = async () => {
    if (!rec.blob || tooShort) return;
    setSaving(true);
    setNotice(null);
    try {
      const form = new FormData();
      form.set('audio', rec.blob, rec.blob.type === 'audio/mp4' ? 'intro.m4a' : 'intro.webm');
      form.set('durationMs', String(Math.round(rec.durationMs)));
      const res = await fetch('/api/profile/voice-intro', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save your voice intro.');
      setSavedUrl(data.url);
      onChange?.(data.url);
      rec.reset();
      setNotice('Voice intro saved.');
    } catch (err) {
      rec.setError(err instanceof Error ? err.message : 'Could not save your voice intro.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch('/api/profile/voice-intro', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setSavedUrl(null);
      onChange?.(null);
    } catch {
      rec.setError('Could not remove your voice intro.');
    } finally {
      setSaving(false);
    }
  };

  const progress = Math.min(100, (rec.elapsedMs / VOICE_INTRO_MAX_MS) * 100);

  return (
    <section className="p-4 rounded-3xl bg-white border border-[#ECE8F4] shadow-[0_2px_10px_rgba(101,85,184,0.05)] space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1C1924]">Voice intro</h3>
          <p className="text-[11px] text-[#6C637B]">A 5-10 second hello. Members hear it on your profile.</p>
        </div>
        {savedUrl && rec.state === 'idle' && <AudioPill src={savedUrl} label="Your intro" size="sm" />}
      </div>

      {rec.state === 'recording' && (
        <div className="space-y-2">
          <div className="flex items-center gap-[3px] h-10 px-1" aria-hidden>
            {rec.levels.map((l, i) => (
              <span key={i} className="flex-1 rounded-full bg-[#6555B8] transition-[height] duration-75" style={{ height: `${Math.round(l * 100)}%` }} />
            ))}
          </div>
          <div className="h-1.5 rounded-full bg-[#F3EFFC] overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-100 ${rec.elapsedMs < VOICE_INTRO_MIN_MS ? 'bg-[#B6AEC7]' : 'bg-[#6555B8]'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#6C637B]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-rose-500">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Recording {formatSeconds(rec.elapsedMs)}
            </span>
            <span>{rec.elapsedMs < VOICE_INTRO_MIN_MS ? 'Keep going - at least 5s' : 'Stops at 10s'}</span>
          </div>
          <button
            type="button"
            onClick={rec.stop}
            className="w-full h-10 rounded-full bg-[#1C1924] text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
          >
            <Square className="w-3.5 h-3.5 fill-current" /> Stop
          </button>
        </div>
      )}

      {rec.state === 'recorded' && previewUrl && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <AudioPill key={previewUrl} src={previewUrl} label="Preview" durationMs={rec.durationMs} />
            {tooShort && <span className="text-[11px] text-rose-600">Too short - record at least 5 seconds.</span>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                rec.reset();
                rec.start();
              }}
              disabled={saving}
              className="h-10 rounded-full border border-[#E2DBF0] text-[#6555B8] text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-record
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || tooShort}
              className="h-10 rounded-full bg-[#6555B8] hover:bg-[#5646A6] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save intro
            </button>
          </div>
        </div>
      )}

      {rec.state === 'idle' && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              rec.start();
            }}
            disabled={saving}
            className="flex-1 h-10 rounded-full bg-[#6555B8] hover:bg-[#5646A6] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Mic className="w-3.5 h-3.5" /> {savedUrl ? 'Record a new intro' : 'Record voice intro'}
          </button>
          {savedUrl && (
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              aria-label="Remove voice intro"
              className="w-10 h-10 rounded-full border border-[#ECE8F4] text-[#8C849B] hover:text-rose-600 inline-flex items-center justify-center disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}

      {rec.error && <p className="text-[11px] text-rose-600">{rec.error}</p>}
      {notice && !rec.error && <p className="text-[11px] text-emerald-600">{notice}</p>}
    </section>
  );
}

export default VoiceIntroRecorder;
