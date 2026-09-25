// Synthesizes a warm, organic 2-note ascending wooden kalimba chime
export function playChime() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Note 1: E5 (659.25 Hz) -> Note 2: B5 (987.77 Hz)
    const notes = [
      { freq: 659.25, time: 0, duration: 0.28 },
      { freq: 987.77, time: 0.11, duration: 0.38 },
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Sine wave creates a pure, rounded acoustic chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      // Attack: instant soft strike
      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + time + 0.015);

      // Decay: exponential acoustic fade
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + duration);
    });
  } catch {
    // AudioContext silenced if browser blocks autoplay before user gesture
  }
}