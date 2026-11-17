/**
 * Call sounds, synthesised with the Web Audio API: no audio files, 0 KB over the wire.
 *
 *   ringtone   incoming: warm marimba arpeggio F4 A4 C5 E5 G5, repeating every 3 s, plus a short vibration
 *   ringback   outgoing: soft open fifth A4 E5, repeating every 3 s
 *   connect    rising fifth C5 G5 (180 ms)
 *   disconnect falling minor third G4 E4 (220 ms)
 *
 * Browsers keep an AudioContext suspended until a tap. Calls start from a tap (the caller) or arrive when the
 * member has already used the app, so we resume it on the first gesture and, if it is still blocked, the call
 * screen is simply silent: the visual ring never depends on sound.
 */
import { hapticsEnabled } from '@/lib/utils/haptics';

const NOTE = { F4: 349.23, A4: 440, C5: 523.25, E5: 659.25, G5: 783.99, G4: 392, E4: 329.63 } as const;
const LOOP_MS = 3000;
const SOUND_PREF_KEY = 'ail_call_sound';

let ctx: AudioContext | null = null;

function soundOn(): boolean {
  try {
    return window.localStorage.getItem(SOUND_PREF_KEY) !== 'off';
  } catch {
    return true;
  }
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/** Call from a tap (or any gesture) so later tones are allowed to play. */
export function primeCallAudio(): void {
  audio();
}

/** One marimba-like note: sine body + triangle partial an octave up, fast attack, exponential decay. */
function note(c: AudioContext, freq: number, at: number, dur: number, gain: number, out: AudioNode): void {
  const layers: Array<[OscillatorType, number, number]> = [
    ['sine', freq, 1],
    ['triangle', freq * 2, 0.22],
  ];
  for (const [type, f, weight] of layers) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain * weight, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(out);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }
}

function sequence(notes: Array<{ f: number; offset: number; dur: number; gain: number }>): void {
  const c = audio();
  if (!c || !soundOn()) return;
  const master = c.createGain();
  master.gain.value = 1;
  master.connect(c.destination);
  const t0 = c.currentTime + 0.02;
  for (const n of notes) note(c, n.f, t0 + n.offset, n.dur, n.gain, master);
  window.setTimeout(() => master.disconnect(), 4500);
}

function loop(play: () => void): () => void {
  play();
  const timer = window.setInterval(play, LOOP_MS);
  return () => window.clearInterval(timer);
}

/** Incoming ring (receiver). Returns a stop function. */
export function startRingtone(): () => void {
  const stop = loop(() => {
    sequence(
      [NOTE.F4, NOTE.A4, NOTE.C5, NOTE.E5, NOTE.G5].map((f, i) => ({ f, offset: i * 0.16, dur: i === 4 ? 1.1 : 0.7, gain: 0.2 }))
    );
    if (hapticsEnabled() && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // Vibration is optional.
      }
    }
  });
  return () => {
    stop();
    try {
      navigator.vibrate?.(0);
    } catch {
      // ignore
    }
  };
}

/** Outgoing ringback (caller): quiet open fifth. Returns a stop function. */
export function startRingback(): () => void {
  return loop(() =>
    sequence([
      { f: NOTE.A4, offset: 0, dur: 0.9, gain: 0.09 },
      { f: NOTE.E5, offset: 0.28, dur: 1.0, gain: 0.08 },
    ])
  );
}

export function playConnectChime(): void {
  sequence([
    { f: NOTE.C5, offset: 0, dur: 0.18, gain: 0.16 },
    { f: NOTE.G5, offset: 0.09, dur: 0.18, gain: 0.16 },
  ]);
}

export function playDisconnectChime(): void {
  sequence([
    { f: NOTE.G4, offset: 0, dur: 0.22, gain: 0.14 },
    { f: NOTE.E4, offset: 0.11, dur: 0.22, gain: 0.14 },
  ]);
}
