/** Shared limits and helpers for voice intros and in-chat voice notes. */

export const VOICE_INTRO_MIN_MS = 3000;
/** 20 s at 32 kbps mono Opus is ~80 KB: light enough for provincial 3G. */
export const VOICE_INTRO_MAX_MS = 20000;
export const VOICE_NOTE_MAX_MS = 60000;

/** Upload caps (opus at ~32 kbps is ~80 KB for 20 s; AAC on iOS is larger). */
export const VOICE_INTRO_MAX_BYTES = 1024 * 1024;
export const VOICE_NOTE_MAX_BYTES = 2 * 1024 * 1024;

export const AUDIO_MIME_EXT: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
};

/** Best recording container the browser supports: WebM/Opus, else MP4/AAC (Safari / iOS). */
export function pickRecorderMime(): string | null {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return null;
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4'];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

/** "audio/webm;codecs=opus" -> "audio/webm" */
export const baseMime = (mime: string) => mime.split(';')[0].trim().toLowerCase();

/** Server-side sniff: the declared type must match the file's real container. */
export function sniffAudioMime(buf: Buffer): 'audio/webm' | 'audio/mp4' | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'audio/webm';
  if (buf.toString('ascii', 4, 8) === 'ftyp') return 'audio/mp4';
  return null;
}

/**
 * Only play voice intros stored in our own public bucket. profiles.voice_intro_url is written
 * by the API, but this also refuses any other URL a member might put there.
 */
export function isTrustedVoiceIntroUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  return url.startsWith(`${base.replace(/\/$/, '')}/storage/v1/object/public/voice-intros/`);
}

export function formatSeconds(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
