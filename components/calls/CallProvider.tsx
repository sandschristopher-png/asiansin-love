'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { callEngine, type CallSnapshot, type StartResult } from '@/lib/callEngine';
import { CallScreen, ReturnToCallBar } from '@/components/calls/CallScreen';

/**
 * What pages see. Deliberately without the per-second fields (timer, quality): only the call screens
 * re-render every second, never the chat page that merely reads "is a call running".
 */
interface CallApi {
  phase: CallSnapshot['phase'];
  /** The member on the other end of the current call or ring. */
  peerId: string | null;
  minimized: boolean;
  /** Bumped when a call ends: the chat timeline reloads its call_logs rows. */
  logVersion: number;
  startCall: (peerId: string) => Promise<StartResult>;
  terminateFor: (peerId: string) => void;
  /** True when a call (or ring) is on screen or minimized, so a second one cannot start. */
  inCall: boolean;
}

const IDLE: CallSnapshot = callEngine.getServerSnapshot();
const FALLBACK: CallApi = {
  phase: IDLE.phase,
  peerId: null,
  minimized: false,
  logVersion: 0,
  startCall: async () => ({ ok: false, reason: 'network' }),
  terminateFor: () => {},
  inCall: false,
};

const CallContext = createContext<CallApi>(FALLBACK);

/** Call state and actions. Outside the provider (landing, auth) it reports "no call" and refuses to start one. */
export function useCall(): CallApi {
  return useContext(CallContext);
}

/**
 * Mounts the call engine for signed-in members and renders the call screens inside the 480px shell:
 * the full-screen call / incoming view, the "Return to call" bar, and the hidden <audio> that plays the
 * other member's voice. Rendered once, in LayoutShell, so an incoming call reaches any in-app page.
 */
export function CallProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const snap = useSyncExternalStore(callEngine.subscribe, callEngine.getSnapshot, callEngine.getServerSnapshot);
  const { phase, minimized, logVersion } = snap;
  const peerId = snap.peer?.id ?? null;
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    callEngine.setAudioElement(audioRef.current);
    return () => callEngine.setAudioElement(null);
  }, []);

  // Listen for incoming calls while a member is signed in.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session?.user) void callEngine.start(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') callEngine.stop();
      else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) void callEngine.start(session.user.id);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
      callEngine.stop(); // leaving the in-app frame (sign-out, marketing routes) ends any call and the inbox
    };
  }, []);

  const api = useMemo<CallApi>(
    () => ({
      phase,
      peerId,
      minimized,
      logVersion,
      startCall: (id) => callEngine.startCall(id),
      terminateFor: (id) => callEngine.terminateFor(id),
      inCall: phase !== 'idle',
    }),
    [phase, peerId, minimized, logVersion]
  );

  const actions = useMemo(
    () => ({
      accept: () => void callEngine.accept(),
      decline: () => callEngine.decline(),
      hangup: () => callEngine.hangup(),
      toggleMute: () => callEngine.toggleMute(),
      toggleSpeaker: () => void callEngine.toggleSpeaker(),
      minimize: () => callEngine.setMinimized(true),
    }),
    []
  );

  const showBar = snap.phase !== 'idle' && snap.phase !== 'incoming' && snap.minimized;
  // Chat has no app header (it has its own), so the bar sits at the very top there; elsewhere below the h-14 header.
  const barTop = pathname?.startsWith('/chat') ? 'top-0' : 'top-14';

  return (
    <CallContext.Provider value={api}>
      {children}
      <audio ref={audioRef} autoPlay playsInline className="hidden" />
      {snap.phase !== 'idle' && !snap.minimized && <CallScreen snap={snap} actions={actions} />}
      {showBar && <ReturnToCallBar snap={snap} onReturn={() => callEngine.setMinimized(false)} topClass={barTop} />}
    </CallContext.Provider>
  );
}

export default CallProvider;
