'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, MapPin, Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { formatClock } from '@/lib/callRules';
import { haptic } from '@/lib/haptics';
import type { CallSnapshot, MicError } from '@/lib/callEngine';

const MIC_KEY: Record<MicError, 'call.micBlocked' | 'call.micMissing' | 'call.micBusy'> = {
  mic_denied: 'call.micBlocked',
  mic_missing: 'call.micMissing',
  mic_busy: 'call.micBusy',
};

interface Actions {
  accept: () => void;
  decline: () => void;
  hangup: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  minimize: () => void;
}

/** Round dock button with its label underneath. */
function DockButton({
  label,
  onClick,
  tone,
  disabled = false,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  tone: 'light' | 'ink' | 'end' | 'accept' | 'decline';
  disabled?: boolean;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    light: 'bg-white text-[#413B5E] border border-[#D0CDE1] hover:bg-[#F6F4FB]',
    ink: 'bg-[#413B5E] text-white border border-[#413B5E]',
    end: 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-600',
    accept: 'bg-[#8574B7] hover:bg-[#534377] text-white border border-[#8574B7]',
    decline: 'bg-white text-[#413B5E] border border-[#D0CDE1] hover:bg-[#F6F4FB]',
  };
  return (
    <div className="flex w-24 flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => {
          haptic.tap(); // synchronous, inside the tap
          onClick();
        }}
        disabled={disabled}
        aria-label={label}
        aria-pressed={pressed}
        className={`flex h-16 w-16 items-center justify-center rounded-full shadow-[0_6px_18px_rgba(65,59,94,0.12)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
      >
        {children}
      </button>
      <span className="text-xs font-medium text-[#413B5E]/80">{label}</span>
    </div>
  );
}

/** The full-screen call view: outgoing, connecting, active and incoming all share it. */
export function CallScreen({ snap, actions }: { snap: CallSnapshot; actions: Actions }) {
  const { t } = useLocale();
  const { peer, phase } = snap;
  if (!peer || phase === 'idle') return null;

  const incoming = phase === 'incoming';
  const active = phase === 'active';
  const ringing = !active;
  const place = [peer.city, peer.country].filter(Boolean).join(', ');

  const status = active
    ? formatClock(snap.elapsedSec)
    : incoming
      ? t('call.incoming')
      : phase === 'connecting'
        ? t('call.connecting')
        : snap.peerRinging
          ? t('call.ringing')
          : t('call.calling');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('call.title')}
      className="ail-call-in absolute inset-0 z-[500] flex flex-col bg-[#F6F4FB] text-[#413B5E] pt-[env(safe-area-inset-top,0px)] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      {/* Top bar: minimize + label (not offered while a call is still incoming) */}
      <div className="flex h-14 shrink-0 items-center gap-1 px-3">
        {!incoming ? (
          <button
            type="button"
            onClick={actions.minimize}
            aria-label={t('call.minimize')}
            title={t('call.minimize')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#413B5E]/75 transition hover:bg-white hover:text-[#413B5E]"
          >
            <ChevronDown className="h-5 w-5" aria-hidden />
          </button>
        ) : (
          <span className="h-9 w-9" aria-hidden />
        )}
        <span className="text-sm font-semibold tracking-tight text-[#413B5E]">{t('call.title')}</span>
      </div>

      {/* Center stage */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="relative h-28 w-28">
          {ringing && (
            <>
              <span aria-hidden className="ail-call-ring absolute inset-0 rounded-full bg-[#8574B7]/40" />
              <span aria-hidden className="ail-call-ring ail-call-ring-late absolute inset-0 rounded-full bg-[#8574B7]/40" />
            </>
          )}
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-white bg-[#E8E6F1] shadow-[0_10px_30px_rgba(133,116,183,0.28)]">
            <Image src={peer.avatar} alt={peer.name} fill sizes="112px" className="object-cover" priority />
          </div>
        </div>

        <h2 className="mt-5 flex max-w-full items-center justify-center gap-1.5 text-xl font-semibold tracking-tight text-[#413B5E]">
          <span className="truncate">{peer.age ? `${peer.name}, ${peer.age}` : peer.name}</span>
          {peer.verified && <VerifiedBadge size="md" />}
        </h2>
        {place && (
          <p className="mt-1 inline-flex max-w-full items-center gap-1 text-sm text-[#413B5E]/70">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{place}</span>
          </p>
        )}

        <p
          aria-live="polite"
          className={`mt-5 ${active ? 'text-3xl font-semibold tabular-nums tracking-tight' : 'text-sm font-medium text-[#413B5E]/75'}`}
        >
          {status}
        </p>

        <div className="mt-3 flex min-h-[2rem] flex-col items-center gap-2">
          {active && snap.nearingCap && (
            <span className="rounded-full border border-[#D0CDE1] bg-white px-3 py-1 text-xs font-medium text-[#413B5E]/85">
              {t('call.fiveMinLeft')}
            </span>
          )}
          {active && (snap.localWeak || snap.remoteWeak) && (
            <span
              role="status"
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900"
            >
              {snap.localWeak ? t('call.weakLocal') : t('call.weakRemote', { name: peer.name })}
            </span>
          )}
          {snap.error && (
            <p role="alert" className="max-w-[300px] rounded-2xl border border-[#D0CDE1] bg-white px-4 py-2.5 text-xs font-medium leading-relaxed text-[#413B5E]">
              {t(MIC_KEY[snap.error])}
            </p>
          )}
        </div>
      </div>

      {/* Control dock */}
      <div className="shrink-0 px-6 pt-4">
        {incoming ? (
          <div className="flex items-start justify-center gap-10">
            <DockButton label={t('call.decline')} onClick={actions.decline} tone="decline">
              <PhoneOff className="h-6 w-6" aria-hidden />
            </DockButton>
            <DockButton label={t('call.accept')} onClick={actions.accept} tone="accept">
              <Phone className="h-6 w-6" aria-hidden />
            </DockButton>
          </div>
        ) : (
          <div className="flex items-start justify-center gap-5">
            <DockButton
              label={snap.muted ? t('call.unmute') : t('call.mute')}
              onClick={actions.toggleMute}
              tone={snap.muted ? 'ink' : 'light'}
              pressed={snap.muted}
            >
              {snap.muted ? <MicOff className="h-6 w-6" aria-hidden /> : <Mic className="h-6 w-6" aria-hidden />}
            </DockButton>
            <DockButton
              label={t('call.speaker')}
              onClick={actions.toggleSpeaker}
              tone={snap.speakerOn ? 'ink' : 'light'}
              pressed={snap.speakerOn}
              disabled={!snap.speakerSupported}
            >
              <Volume2 className="h-6 w-6" aria-hidden />
            </DockButton>
            <DockButton label={t('call.endCall')} onClick={actions.hangup} tone="end">
              <PhoneOff className="h-6 w-6" aria-hidden />
            </DockButton>
          </div>
        )}
      </div>
    </div>
  );
}

/** Slim "Return to call · 04:18" bar shown while the call screen is minimized. */
export function ReturnToCallBar({ snap, onReturn, topClass }: { snap: CallSnapshot; onReturn: () => void; topClass: string }) {
  const { t } = useLocale();
  const time = snap.phase === 'active' ? formatClock(snap.elapsedSec) : t('call.calling');
  return (
    <button
      type="button"
      onClick={onReturn}
      className={`absolute inset-x-0 ${topClass} z-[450] flex h-9 items-center justify-center gap-2 bg-[#8574B7] px-4 text-xs font-semibold text-white transition hover:bg-[#534377]`}
    >
      <Phone className="h-3.5 w-3.5" aria-hidden />
      <span className="tabular-nums">{t('call.returnToCall', { time })}</span>
      <ChevronUp className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}
