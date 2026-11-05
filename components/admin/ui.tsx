'use client';

import React from 'react';
import { Loader2, UserRound, X } from 'lucide-react';

/** JSON fetch for /api/admin/*: resolves the body or throws the route's error message. */
export async function adminFetch<T = any>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json as T;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function AdminAvatar({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} width={size} height={size} className="rounded-full object-cover shrink-0 bg-[#E8DFF5]/60" style={{ width: size, height: size }} />
  ) : (
    <span className="rounded-full shrink-0 bg-[#E8DFF5]/60 flex items-center justify-center text-[#72519A]" style={{ width: size, height: size }}>
      <UserRound className="w-1/2 h-1/2" aria-hidden />
    </span>
  );
}

export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div>
        <h1 className="text-lg font-bold text-[#51376D]">{title}</h1>
        {subtitle && <p className="text-xs text-[#51376D]/75 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Notice({ kind, children }: { kind: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
        kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D5C6EC] bg-white py-14 px-6 text-center">
      <Icon className="w-8 h-8 mx-auto text-[#72519A]" />
      <p className="mt-3 font-semibold text-[#51376D]">{title}</p>
      <p className="mt-1 text-sm text-[#51376D]/75">{body}</p>
    </div>
  );
}

export function Loading() {
  return (
    <div className="py-16 flex justify-center text-[#72519A]">
      <Loader2 className="w-6 h-6 animate-spin" aria-label="Loading" />
    </div>
  );
}

/** Mobile bottom sheet pinned to the app's 430px frame; closes on backdrop tap or Escape. */
export function BottomSheet({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-[#51376D]/35" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-[430px] mx-auto max-h-[85dvh] rounded-t-3xl bg-white shadow-xl flex flex-col">
        <div className="pt-2.5 pb-1 flex justify-center" aria-hidden>
          <span className="w-10 h-1 rounded-full bg-[#E8DFF5]/60" />
        </div>
        <header className="flex items-start justify-between gap-3 px-4 pb-3 border-b border-[#D5C6EC]">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#51376D]">{title}</p>
            {subtitle && <p className="text-[11px] text-[#51376D]/75 truncate">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 -mr-1.5 rounded-lg hover:bg-[#E8DFF5]/40" aria-label="Close">
            <X className="w-4 h-4 text-[#51376D]/75" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}

type BtnTone = 'primary' | 'neutral' | 'danger' | 'warn';
const TONES: Record<BtnTone, string> = {
  primary: 'bg-gradient-to-r from-[#72519A] to-[#9474C3] text-white border-transparent hover:opacity-95',
  neutral: 'bg-white text-[#51376D] border-[#D5C6EC] hover:bg-[#E8DFF5]/40',
  danger: 'bg-red-600 text-white border-transparent hover:bg-red-700',
  warn: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
};

export function AdminButton({
  tone = 'neutral',
  size = 'sm',
  busy,
  className = '',
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: BtnTone; size?: 'sm' | 'lg'; busy?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={busy || rest.disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border font-semibold transition ${size === 'lg' ? 'h-10 px-4 text-sm' : 'px-3 py-1.5 text-xs'} disabled:opacity-50 disabled:cursor-not-allowed ${TONES[tone]} ${className}`}
    >
      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
