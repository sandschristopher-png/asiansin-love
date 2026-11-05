'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader2, Mic, RotateCcw, Square, X } from 'lucide-react';
import { VoicePlayer } from '@/components/VoicePlayer';
import { useVoiceRecorder } from '@/lib/useVoiceRecorder';
import { VOICE_INTRO_MAX_MS, VOICE_INTRO_MIN_MS, formatSeconds } from '@/lib/audio';

const PROMPTS = [
  'Say hello and what made you smile today',
  'Pronounce your name and where you grew up',
  'Your ideal Sunday afternoon',
];

/**
 * Bottom sheet that records a voice intro (MediaRecorder, ~32 kbps mono WebM/Opus or AAC on
 * iOS, up to 20 s / ~80 KB), previews it, and saves it to voice-intros/{user_id}.webm through
 * POST /api/profile/voice-intro. Silent UI: no start/stop beeps; a light haptic instead.
 */
export function VoiceRecordModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (url: string) => void;
}) {
  const rec = useVoiceRecorder(VOICE_INTRO_MAX_MS);
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [saving, setSaving] = useState(false);

  const previewUrl = useMemo(() => (rec.blob ? URL.createObjectURL(rec.blob) : null), [rec.blob]);
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  const { cancel, reset } = rec;
  useEffect(() => {
    if (!open) {
      cancel();
      reset();
    }
  }, [open, cancel, reset]);

  if (!open || typeof document === 'undefined') return null;

  const tooShort = rec.state === 'recorded' && rec.durationMs < VOICE_INTRO_MIN_MS;
  const progress = Math.min(100, (rec.elapsedMs / VOICE_INTRO_MAX_MS) * 100);
  const buzz = () => {
    try {
      navigator.vibrate?.([15]);
    } catch {}
  };

  const save = async () => {
    if (!rec.blob || tooShort) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.set('audio', rec.blob, rec.blob.type === 'audio/mp4' ? 'intro.m4a' : 'intro.webm');
      form.set('durationMs', String(Math.round(rec.durationMs)));
      const res = await fetch('/api/profile/voice-intro', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save your voice intro.');
      onSaved(data.url);
      rec.reset();
      onClose();
    } catch (err) {
      rec.setError(err instanceof Error ? err.message : 'Could not save your voice intro.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Record voice intro">
      <div className="fixed inset-0 bg-black/50" onClick={saving ? undefined : onClose} />
      <div className="relative w-full max-w-[430px] bg-white rounded-t-[28px] px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 animate-[ailSheetUp_260ms_cubic-bezier(0.16,1,0.3,1)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#51376D]">Record your voice intro</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="p-1.5 rounded-full text-[#51376D]/75 hover:bg-[#E8DFF5]/70 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#51376D]/75">Need an idea?</p>
          <div className="flex flex-col gap-1.5">
            {PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrompt(p)}
                className={`text-left px-3.5 py-2 rounded-xl border text-xs font-medium transition ${
                  prompt === p ? 'border-[#72519A] bg-[#E8DFF5]/60 text-[#51376D]' : 'border-[#D5C6EC] text-[#51376D]/85'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {rec.state === 'recording' && (
          <div className="space-y-2">
            <div className="flex items-center gap-[3px] h-10 px-1" aria-hidden>
              {rec.levels.map((l, i) => (
                <span key={i} className="flex-1 rounded-full bg-[#72519A] transition-[height] duration-75" style={{ height: `${Math.round(l * 100)}%` }} />
              ))}
            </div>
            <div className="h-1.5 rounded-full bg-[#E8DFF5]/60 overflow-hidden">
              <div className="h-full rounded-full bg-[#72519A] transition-[width] duration-100" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#51376D]/75">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#9474C3]">
                <span className="w-2 h-2 rounded-full bg-[#9474C3] animate-pulse" /> {formatSeconds(rec.elapsedMs)}
              </span>
              <span>Stops at {VOICE_INTRO_MAX_MS / 1000}s</span>
            </div>
            <button
              type="button"
              onClick={() => {
                buzz();
                rec.stop();
              }}
              className="w-full h-11 rounded-full bg-[#51376D] text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Stop
            </button>
          </div>
        )}

        {rec.state === 'recorded' && previewUrl && (
          <div className="space-y-2.5">
            <VoicePlayer key={previewUrl} src={previewUrl} title="Preview" durationMs={rec.durationMs} />
            {tooShort && <p className="text-[11px] text-[#72519A]">Too short - record at least {VOICE_INTRO_MIN_MS / 1000} seconds.</p>}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  rec.reset();
                  buzz();
                  rec.start();
                }}
                disabled={saving}
                className="h-11 rounded-full border border-[#D5C6EC] text-[#72519A] text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-record
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || tooShort}
                className="h-11 rounded-full bg-[#72519A] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save intro
              </button>
            </div>
          </div>
        )}

        {rec.state === 'idle' && (
          <button
            type="button"
            onClick={() => {
              buzz();
              rec.start();
            }}
            className="w-full h-11 rounded-full bg-[#72519A] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5" /> Start recording
          </button>
        )}

        {rec.error && <p className="text-[11px] text-[#72519A]">{rec.error}</p>}
        <p className="text-[10px] text-[#51376D]/55 text-center">
          Up to {VOICE_INTRO_MAX_MS / 1000} seconds. Members only hear it when they tap play.
        </p>
      </div>
    </div>,
    document.body
  );
}

export default VoiceRecordModal;
