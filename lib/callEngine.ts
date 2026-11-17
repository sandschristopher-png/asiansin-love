'use client';

/**
 * Native 1-on-1 voice calling: browser RTCPeerConnection for audio (STUN only, no third-party SDK) with
 * Supabase Realtime Broadcast for signalling. Audio is peer to peer and is never recorded or stored.
 *
 *   callbox:<myId>      my inbox. A caller rings it ("ring") and cancels a ring that has not been picked up.
 *   call:<idA>:<idB>    the pair channel (private, RLS in 20261126_voice_calls.sql). Everything else travels
 *                       here as one "signal" event whose payload.type is one of
 *                       ringing | accept | decline | offer | answer | ice-candidate | network-quality | hangup.
 *
 * The engine is a module singleton (like lib/realtimePresence) so a call survives navigating between pages;
 * components/calls/CallProvider mounts it and renders the screens from its snapshot.
 */
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { ageOf } from '@/lib/age';
import { publicName } from '@/lib/publicName';
import {
  QualityTracker,
  RING_TIMEOUT_MS,
  SESSION_CAP_SEC,
  SESSION_WARN_SEC,
  STATS_INTERVAL_MS,
  lossPercent,
  pairKey,
  type CallEligibility,
  type CallEndReason,
} from '@/lib/callRules';
import { playConnectChime, playDisconnectChime, primeCallAudio, startRingback, startRingtone } from '@/lib/callTone';

export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'active';
export type MicError = 'mic_denied' | 'mic_missing' | 'mic_busy';

export interface CallPeer {
  id: string;
  name: string;
  avatar: string;
  age: number | null;
  verified: boolean;
  city: string;
  country: string;
}

export interface CallSnapshot {
  phase: CallPhase;
  role: 'caller' | 'callee' | null;
  peer: CallPeer | null;
  /** Caller side: the callee's phone is ringing (they answered "ringing"), so the status reads "Ringing...". */
  peerRinging: boolean;
  muted: boolean;
  speakerOn: boolean;
  speakerSupported: boolean;
  elapsedSec: number;
  minimized: boolean;
  localWeak: boolean;
  remoteWeak: boolean;
  nearingCap: boolean;
  error: MicError | null;
  /** Bumped when a call ends so the chat timeline reloads its call_logs rows. */
  logVersion: number;
}

export type StartResult =
  | { ok: true }
  | { ok: false; reason: 'busy' | 'network' | MicError | Extract<CallEligibility, { allowed: false }>['reason'] };

const ICE_SERVERS: RTCIceServer[] = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
const CONNECT_TIMEOUT_MS = 20_000;
const DISCONNECT_GRACE_MS = 20_000;
const RECHECK_MS = 60_000;

/** Tiny silent clip: playing it inside the tap unlocks the <audio> element on iOS Safari and Android Chrome. */
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

const uuid = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

function micReason(err: unknown): MicError {
  const name = (err as { name?: string } | null)?.name;
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'mic_missing';
  if (name === 'NotReadableError' || name === 'AbortError') return 'mic_busy';
  return 'mic_denied'; // NotAllowedError, SecurityError and anything unexpected
}

function subscribeChannel(ch: RealtimeChannel, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('subscribe timeout')), timeoutMs);
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timer);
        resolve();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        clearTimeout(timer);
        reject(new Error(String(status)));
      }
    });
  });
}

/** null = the check itself failed (network): callers decide whether that is fatal. */
async function fetchEligibility(peer: string, direction: 'outgoing' | 'incoming'): Promise<CallEligibility | null> {
  try {
    const res = await fetch(`/api/calls/eligibility?peer=${peer}&direction=${direction}`);
    if (res.status === 401 || res.status === 400) return { allowed: false, reason: 'unavailable' };
    if (!res.ok) return null;
    return (await res.json()) as CallEligibility;
  } catch {
    return null;
  }
}

async function loadPeer(id: string): Promise<CallPeer> {
  const full = 'id, username, avatar_url, city, country, age, birthdate, is_verified, verification_status';
  const lean = 'id, username, avatar_url, city, country, is_verified, verification_status';
  const first = await supabase.from('profiles').select(full).eq('id', id).maybeSingle();
  const data = first.error ? (await supabase.from('profiles').select(lean).eq('id', id).maybeSingle()).data : first.data;
  const p = (data ?? null) as Record<string, unknown> | null;
  return {
    id,
    name: publicName(p as { username?: string | null } | null),
    avatar: (typeof p?.avatar_url === 'string' && p.avatar_url) || '/placeholder-avatar.svg',
    age: ageOf(p),
    verified: p?.is_verified === true || p?.verification_status === 'verified',
    city: String(p?.city ?? '').replace(/^@+/, '').split(',')[0].trim(),
    country: String(p?.country ?? ''),
  };
}

interface Live {
  callId: string;
  role: 'caller' | 'callee';
  peerId: string;
  startedAt: number;
  connectedAt: number | null;
  ended: boolean;
  pair: RealtimeChannel | null;
  ringChan: RealtimeChannel | null;
  pc: RTCPeerConnection | null;
  stream: MediaStream | null;
  iceQueue: RTCIceCandidateInit[];
  remoteSet: boolean;
  tracker: QualityTracker;
  prevInbound: { received: number; lost: number } | null;
  stopTone: (() => void) | null;
  timers: { ring?: number; connect?: number; disconnect?: number; tick?: number; stats?: number; recheck?: number };
}

const INITIAL: CallSnapshot = {
  phase: 'idle',
  role: null,
  peer: null,
  peerRinging: false,
  muted: false,
  speakerOn: false,
  speakerSupported: false,
  elapsedSec: 0,
  minimized: false,
  localWeak: false,
  remoteWeak: false,
  nearingCap: false,
  error: null,
  logVersion: 0,
};

class CallEngine {
  private snap: CallSnapshot = INITIAL;
  private listeners = new Set<() => void>();
  private userId: string | null = null;
  private inbox: RealtimeChannel | null = null;
  private live: Live | null = null;
  /** Ring being vetted (eligibility + profile) before the screen shows. */
  private vetting: string | null = null;
  private cancelled = new Set<string>();
  private audioEl: HTMLAudioElement | null = null;
  private wake: WakeLockSentinel | null = null;
  private bound = false;

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
  getSnapshot = () => this.snap;
  getServerSnapshot = () => INITIAL;

  private set(patch: Partial<CallSnapshot>) {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((l) => l());
  }

  setAudioElement(el: HTMLAudioElement | null) {
    this.audioEl = el;
  }

  /**
   * Must run synchronously inside the Call / Accept tap, before any await: starts the remote <audio>
   * element (and the AudioContext) while the browser still counts it as a user gesture, so the other
   * member's voice is never blocked by autoplay rules later when the stream arrives.
   */
  private unlockAudio() {
    primeCallAudio();
    const el = this.audioEl;
    if (!el) return;
    try {
      el.muted = false;
      if (!el.srcObject) {
        el.src = SILENT_WAV;
        void el.play().catch(() => {});
      }
    } catch {
      // the stream's own play() call below is the fallback
    }
  }

  setMinimized(minimized: boolean) {
    if (this.live) this.set({ minimized });
  }

  /** Start listening for incoming calls for this member. Idempotent. */
  async start(userId: string) {
    if (this.userId === userId) return;
    this.stop();
    this.userId = userId;
    this.set({ speakerSupported: typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype });
    this.bindPageEvents();
    try {
      await supabase.realtime.setAuth();
    } catch {
      // the client sets its own token on connect
    }
    if (this.userId !== userId) return;
    const ch = supabase.channel(`callbox:${userId}`, { config: { private: true } });
    ch.on('broadcast', { event: 'ring' }, ({ payload }) => void this.onRing(payload));
    ch.on('broadcast', { event: 'cancel' }, ({ payload }) => this.onCancel(payload));
    this.inbox = ch;
    ch.subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.warn('[calls] inbox unavailable:', status);
    });
  }

  stop() {
    if (this.live) this.finish('missed', { notify: true });
    if (this.inbox) supabase.removeChannel(this.inbox);
    this.inbox = null;
    this.userId = null;
    this.vetting = null;
  }

  // ------------------------------------------------------------------ caller
  async startCall(peerId: string): Promise<StartResult> {
    const me = this.userId;
    if (!me || !uuid(peerId) || peerId === me) return { ok: false, reason: 'network' };
    if (this.live || this.vetting) return { ok: false, reason: 'busy' };
    this.unlockAudio(); // inside the tap, before any await

    const [elig, peer] = await Promise.all([fetchEligibility(peerId, 'outgoing'), loadPeer(peerId)]);
    if (!elig) return { ok: false, reason: 'network' };
    if (!elig.allowed) return { ok: false, reason: elig.reason };

    let stream: MediaStream;
    try {
      // Audio only: video is never requested and no video transceiver is ever added.
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      return { ok: false, reason: micReason(err) };
    }
    if (this.live) {
      stream.getTracks().forEach((t) => t.stop());
      return { ok: false, reason: 'busy' };
    }

    const live = this.newLive(crypto.randomUUID(), 'caller', peerId);
    live.stream = stream;
    this.live = live;
    this.set({ ...this.freshCallState('caller', peer), phase: 'outgoing' });

    try {
      await supabase.realtime.setAuth().catch(() => {});
      const pair = await this.openPair(live);
      if (live.ended) {
        supabase.removeChannel(pair); // the caller hung up while we were connecting
        return { ok: true };
      }
      live.pair = pair;
      const ring = supabase.channel(`callbox:${peerId}`, { config: { private: true } });
      await subscribeChannel(ring);
      if (live.ended) {
        supabase.removeChannel(ring);
        return { ok: true };
      }
      live.ringChan = ring;
      await ring.send({ type: 'broadcast', event: 'ring', payload: { callId: live.callId, from: me } });
    } catch (err) {
      console.warn('[calls] could not reach signalling', err);
      this.finish('failed', { notify: false });
      return { ok: false, reason: 'network' };
    }
    if (live.ended) return { ok: true };
    live.stopTone = startRingback();
    live.timers.ring = window.setTimeout(() => this.finish('missed', { notify: true }), RING_TIMEOUT_MS);
    return { ok: true };
  }

  // ------------------------------------------------------------------ callee
  private onCancel(payload: unknown) {
    const p = payload as { callId?: string; from?: string } | null;
    if (!p || typeof p.callId !== 'string') return;
    if (this.live && this.live.callId === p.callId && this.live.role === 'callee' && !this.live.connectedAt) {
      this.finish('missed', { notify: false });
    } else if (this.vetting === p.callId) {
      this.cancelled.add(p.callId);
    }
  }

  private async onRing(payload: unknown) {
    const me = this.userId;
    const p = payload as { callId?: string; from?: string } | null;
    if (!me || !p || !uuid(p.callId) || !uuid(p.from) || p.from === me) return;
    const { callId, from } = p as { callId: string; from: string };
    if (this.live?.peerId === from || this.vetting === callId) return; // already in a call with them / duplicate ring
    if (this.live || this.vetting) {
      void this.declineTransient(from, callId, 'busy');
      return;
    }
    this.vetting = callId;
    try {
      const [elig, peer] = await Promise.all([fetchEligibility(from, 'incoming'), loadPeer(from)]);
      if (this.vetting !== callId) return;
      if (this.cancelled.delete(callId)) return;
      if (!elig || !elig.allowed) {
        // A failed check never rings: better a missed call than an unchecked one.
        void this.declineTransient(from, callId, 'unavailable');
        return;
      }
      const live = this.newLive(callId, 'callee', from);
      this.live = live;
      this.set({ ...this.freshCallState('callee', peer), phase: 'incoming' });
      const pair = await this.openPair(live);
      if (live.ended) {
        supabase.removeChannel(pair);
        return;
      }
      live.pair = pair;
      if (this.cancelled.delete(callId)) {
        this.finish('missed', { notify: false });
        return;
      }
      live.stopTone = startRingtone();
      live.timers.ring = window.setTimeout(() => this.finish('missed', { notify: false }), RING_TIMEOUT_MS);
      this.signal(live, { type: 'ringing' });
    } catch (err) {
      console.warn('[calls] incoming ring failed', err);
      if (this.live && this.live.callId === callId) this.finish('failed', { notify: false });
    } finally {
      if (this.vetting === callId) this.vetting = null;
    }
  }

  async accept() {
    const live = this.live;
    if (!live || live.role !== 'callee' || this.snap.phase !== 'incoming') return;
    this.unlockAudio(); // inside the tap, before any await
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      this.set({ error: micReason(err) }); // stay on the incoming screen with an actionable message
      return;
    }
    if (live.ended) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    live.stream = stream;
    live.stopTone?.();
    live.stopTone = null;
    window.clearTimeout(live.timers.ring);
    this.makePc(live);
    live.timers.connect = window.setTimeout(() => this.finish('failed', { notify: true }), CONNECT_TIMEOUT_MS);
    this.set({ phase: 'connecting', error: null });
    this.signal(live, { type: 'accept' });
  }

  decline() {
    const live = this.live;
    if (!live || live.role !== 'callee' || this.snap.phase !== 'incoming') return;
    this.signal(live, { type: 'decline', reason: 'declined' });
    this.finish('declined', { notify: false });
  }

  // ------------------------------------------------------------------ either side
  hangup() {
    const live = this.live;
    if (!live) return;
    this.finish(live.connectedAt ? 'completed' : 'missed', { notify: true });
  }

  /** Blocking, muting or quarantine: end the call (or ring) with this member now. */
  terminateFor(peerId: string) {
    if (this.live?.peerId === peerId) this.hangup();
    else if (this.vetting) this.cancelled.add(this.vetting);
  }

  toggleMute() {
    const live = this.live;
    if (!live) return;
    const muted = !this.snap.muted;
    live.stream?.getAudioTracks().forEach((t) => (t.enabled = !muted));
    this.set({ muted });
  }

  async toggleSpeaker() {
    const el = this.audioEl as (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }) | null;
    if (!el?.setSinkId) return;
    const on = !this.snap.speakerOn;
    try {
      const outs = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audiooutput');
      const speaker = outs.find((d) => /speaker/i.test(d.label) && !/ear|receiver|handset/i.test(d.label));
      const ear = outs.find((d) => /ear|receiver|handset/i.test(d.label));
      await el.setSinkId((on ? speaker?.deviceId : ear?.deviceId) ?? 'default');
      this.set({ speakerOn: on });
    } catch (err) {
      console.warn('[calls] could not switch the audio output', err);
    }
  }

  // ------------------------------------------------------------------ plumbing
  private freshCallState(role: 'caller' | 'callee', peer: CallPeer): Partial<CallSnapshot> {
    return {
      role,
      peer,
      peerRinging: false,
      muted: false,
      speakerOn: false,
      elapsedSec: 0,
      minimized: false,
      localWeak: false,
      remoteWeak: false,
      nearingCap: false,
      error: null,
    };
  }

  private newLive(callId: string, role: 'caller' | 'callee', peerId: string): Live {
    return {
      callId,
      role,
      peerId,
      startedAt: Date.now(),
      connectedAt: null,
      ended: false,
      pair: null,
      ringChan: null,
      pc: null,
      stream: null,
      iceQueue: [],
      remoteSet: false,
      tracker: new QualityTracker(),
      prevInbound: null,
      stopTone: null,
      timers: {},
    };
  }

  private async openPair(live: Live): Promise<RealtimeChannel> {
    const ch = supabase.channel(`call:${pairKey(this.userId!, live.peerId)}`, { config: { private: true } });
    ch.on('broadcast', { event: 'signal' }, ({ payload }) => void this.onSignal(live, payload));
    await subscribeChannel(ch);
    return ch;
  }

  private signal(live: Live, msg: Record<string, unknown>) {
    try {
      void live.pair?.send({ type: 'broadcast', event: 'signal', payload: { ...msg, from: this.userId, callId: live.callId } });
    } catch {
      // the channel is closing
    }
  }

  private async declineTransient(from: string, callId: string, reason: string) {
    const me = this.userId;
    if (!me) return;
    const ch = supabase.channel(`call:${pairKey(me, from)}`, { config: { private: true } });
    try {
      await subscribeChannel(ch);
      await ch.send({ type: 'broadcast', event: 'signal', payload: { type: 'decline', reason, from: me, callId } });
    } catch {
      // the caller's own 30 s timeout covers it
    } finally {
      supabase.removeChannel(ch);
    }
  }

  private makePc(live: Live) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    live.pc = pc;
    live.stream?.getAudioTracks().forEach((t) => pc.addTrack(t, live.stream!));
    pc.onicecandidate = (e) => {
      if (e.candidate) this.signal(live, { type: 'ice-candidate', candidate: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => {
      const el = this.audioEl;
      if (!el) return;
      el.removeAttribute('src'); // drop the silent unlock clip
      el.srcObject = e.streams[0] ?? new MediaStream([e.track]);
      void el.play().catch(() => {});
    };
    pc.oniceconnectionstatechange = () => this.onIce(live);
    return pc;
  }

  private async flushIce(live: Live) {
    live.remoteSet = true;
    const queued = live.iceQueue.splice(0);
    for (const c of queued) await live.pc?.addIceCandidate(c).catch(() => {});
  }

  private async onSignal(live: Live, payload: unknown) {
    const m = payload as { type?: string; from?: string; callId?: string; [k: string]: unknown } | null;
    if (!m || live.ended || this.live !== live) return;
    if (m.from !== live.peerId || m.callId !== live.callId) return; // not this call
    try {
      switch (m.type) {
        case 'ringing':
          if (live.role === 'caller') this.set({ peerRinging: true });
          break;
        case 'accept':
          if (live.role !== 'caller' || live.pc) return;
          window.clearTimeout(live.timers.ring);
          live.stopTone?.();
          live.stopTone = null;
          this.set({ phase: 'connecting' });
          live.timers.connect = window.setTimeout(() => this.finish('failed', { notify: true }), CONNECT_TIMEOUT_MS);
          {
            const pc = this.makePc(live);
            await pc.setLocalDescription(await pc.createOffer());
            this.signal(live, { type: 'offer', sdp: pc.localDescription?.toJSON() });
          }
          break;
        case 'offer':
          if (live.role !== 'callee' || !live.pc) return;
          await live.pc.setRemoteDescription(m.sdp as RTCSessionDescriptionInit);
          await this.flushIce(live);
          await live.pc.setLocalDescription(await live.pc.createAnswer());
          this.signal(live, { type: 'answer', sdp: live.pc.localDescription?.toJSON() });
          break;
        case 'answer':
          if (live.role !== 'caller' || !live.pc) return;
          await live.pc.setRemoteDescription(m.sdp as RTCSessionDescriptionInit);
          await this.flushIce(live);
          break;
        case 'ice-candidate': {
          const c = m.candidate as RTCIceCandidateInit | undefined;
          if (!c) return;
          if (live.pc && live.remoteSet) await live.pc.addIceCandidate(c).catch(() => {});
          else live.iceQueue.push(c);
          break;
        }
        case 'network-quality':
          this.set({ remoteWeak: m.status === 'weak' });
          break;
        case 'decline':
          this.finish(live.role === 'caller' ? 'declined' : 'missed', { notify: false });
          break;
        case 'hangup':
          this.finish(live.connectedAt ? 'completed' : live.role === 'caller' ? 'failed' : 'missed', { notify: false });
          break;
      }
    } catch (err) {
      console.warn('[calls] signalling step failed', m.type, err);
      if (m.type === 'offer' || m.type === 'answer' || m.type === 'accept') this.finish('failed', { notify: true });
    }
  }

  private onIce(live: Live) {
    const pc = live.pc;
    if (!pc || live.ended) return;
    const state = pc.iceConnectionState;
    if (state === 'connected' || state === 'completed') {
      window.clearTimeout(live.timers.disconnect);
      if (!live.connectedAt) this.onConnected(live);
      this.pushQuality(live, { rttMs: null, lossPct: null, jitterMs: null, iceState: 'connected' });
    } else if (state === 'disconnected') {
      this.pushQuality(live, { rttMs: null, lossPct: null, jitterMs: null, iceState: 'disconnected' });
      window.clearTimeout(live.timers.disconnect);
      live.timers.disconnect = window.setTimeout(() => this.finish('failed', { notify: true }), DISCONNECT_GRACE_MS);
    } else if (state === 'failed') {
      this.finish('failed', { notify: true });
    }
  }

  private pushQuality(live: Live, sample: Parameters<QualityTracker['push']>[0]) {
    const change = live.tracker.push(sample);
    if (!change) return;
    this.set({ localWeak: change === 'weak' });
    this.signal(live, { type: 'network-quality', status: change });
  }

  private onConnected(live: Live) {
    live.connectedAt = Date.now();
    window.clearTimeout(live.timers.connect);
    window.clearTimeout(live.timers.ring);
    live.stopTone?.();
    live.stopTone = null;
    playConnectChime();
    this.set({ phase: 'active', elapsedSec: 0, minimized: this.snap.minimized });
    live.timers.tick = window.setInterval(() => {
      if (!live.connectedAt) return;
      const elapsed = Math.floor((Date.now() - live.connectedAt) / 1000);
      this.set({ elapsedSec: elapsed, nearingCap: elapsed >= SESSION_WARN_SEC });
      if (elapsed >= SESSION_CAP_SEC) this.finish('completed', { notify: true }); // the 30-minute cap wraps up cleanly
    }, 1000);
    live.timers.stats = window.setInterval(() => void this.pollStats(live), STATS_INTERVAL_MS);
    live.timers.recheck = window.setInterval(() => void this.recheck(live), RECHECK_MS);
    void this.acquireWake();
  }

  private async pollStats(live: Live) {
    const pc = live.pc;
    if (!pc || live.ended) return;
    let rtt: number | null = null;
    let jitter: number | null = null;
    let received = 0;
    let lost = 0;
    let hasInbound = false;
    try {
      const stats = await pc.getStats();
      stats.forEach((r: Record<string, unknown>) => {
        if (r.type === 'inbound-rtp' && (r.kind === 'audio' || r.mediaType === 'audio')) {
          hasInbound = true;
          received = Number(r.packetsReceived ?? 0);
          lost = Number(r.packetsLost ?? 0);
          if (typeof r.jitter === 'number') jitter = r.jitter * 1000;
        }
        if (r.type === 'candidate-pair' && r.state === 'succeeded' && (r.nominated || r.selected) && typeof r.currentRoundTripTime === 'number') {
          rtt = r.currentRoundTripTime * 1000;
        }
      });
    } catch {
      return;
    }
    const loss = hasInbound ? lossPercent(live.prevInbound, { received, lost }) : null;
    if (hasInbound) live.prevInbound = { received, lost };
    if (live.ended) return;
    this.pushQuality(live, { rttMs: rtt, lossPct: loss, jitterMs: jitter, iceState: pc.iceConnectionState });
  }

  /** Every minute: a block or quarantine that began mid-call ends it. */
  private async recheck(live: Live) {
    if (live.ended) return;
    const elig = await fetchEligibility(live.peerId, live.role === 'caller' ? 'outgoing' : 'incoming');
    if (elig && !elig.allowed && elig.reason === 'unavailable' && !live.ended) this.hangup();
  }

  private async acquireWake() {
    try {
      if ('wakeLock' in navigator && !this.wake) {
        this.wake = await navigator.wakeLock.request('screen');
        this.wake.addEventListener('release', () => {
          this.wake = null;
        });
      }
    } catch {
      // not supported or refused: the screen may dim, the call keeps going
    }
  }

  private releaseWake() {
    void this.wake?.release().catch(() => {});
    this.wake = null;
  }

  private bindPageEvents() {
    if (this.bound || typeof window === 'undefined') return;
    this.bound = true;
    // A closed or refreshed tab must not leave the other member on dead air.
    const leave = () => {
      const live = this.live;
      if (!live || live.ended) return;
      // The same wrap-up as a normal hangup (hangup + cancel signals, tracks stopped, peer connection
      // closed), with the call log sent by beacon because an ordinary request dies with the page.
      this.finish(live.connectedAt ? 'completed' : 'missed', { notify: true, unloading: true });
    };
    window.addEventListener('pagehide', leave);
    window.addEventListener('beforeunload', leave);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.live?.connectedAt && !this.live.ended) void this.acquireWake();
    });
  }

  private finish(reason: CallEndReason, opts: { notify: boolean; unloading?: boolean }) {
    const live = this.live;
    if (!live || live.ended) return;
    live.ended = true;
    if (opts.notify) {
      this.signal(live, { type: 'hangup', reason });
      if (live.role === 'caller' && !live.connectedAt && live.ringChan) {
        // The callee may not have joined the pair channel yet: cancel through their inbox as well.
        void live.ringChan.send({ type: 'broadcast', event: 'cancel', payload: { callId: live.callId, from: this.userId } });
      }
    }
    Object.values(live.timers).forEach((t) => {
      window.clearTimeout(t);
      window.clearInterval(t);
    });
    live.stopTone?.();
    live.stream?.getTracks().forEach((t) => t.stop());
    try {
      live.pc?.close();
    } catch {
      // already closed
    }
    if (this.audioEl) this.audioEl.srcObject = null;
    this.releaseWake();
    const duration = live.connectedAt ? Math.round((Date.now() - live.connectedAt) / 1000) : 0;
    const me = this.userId;
    if (live.role === 'caller' && me) this.writeLog(live, reason, duration, Boolean(opts.unloading));
    // Let the hangup frame leave before the channels close.
    const channels = [live.pair, live.ringChan];
    window.setTimeout(() => channels.forEach((c) => c && supabase.removeChannel(c)), 400);
    if (!opts.unloading) playDisconnectChime();
    this.live = null;
    this.vetting = null;
    this.set({ ...INITIAL, speakerSupported: this.snap.speakerSupported, logVersion: this.snap.logVersion + 1 });
    // The caller writes the log a beat after the call ends: reload the timeline again once it is there.
    window.setTimeout(() => this.set({ logVersion: this.snap.logVersion + 1 }), 1800);
  }

  /**
   * Sends how the call ended to POST /api/calls/log (the caller is the single writer). The call id is the
   * row id, so a repeat is a no-op. keepalive lets the request outlive a navigation; a closing tab uses
   * sendBeacon, which the browser guarantees to deliver.
   */
  private writeLog(live: Live, reason: CallEndReason, duration: number, unloading: boolean) {
    const body = JSON.stringify({
      id: live.callId,
      peer: live.peerId,
      startedAt: new Date(live.startedAt).toISOString(),
      endedAt: new Date().toISOString(),
      durationSec: Math.min(duration, SESSION_CAP_SEC),
      reason,
    });
    try {
      if (unloading && typeof navigator.sendBeacon === 'function') {
        if (navigator.sendBeacon('/api/calls/log', new Blob([body], { type: 'application/json' }))) return;
      }
      void fetch('/api/calls/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
        .then((r) => {
          if (!r.ok) console.warn('[calls] could not save the call log', r.status);
        })
        .catch((err) => console.warn('[calls] could not save the call log', err));
    } catch (err) {
      console.warn('[calls] could not save the call log', err);
    }
  }
}

export const callEngine = new CallEngine();
