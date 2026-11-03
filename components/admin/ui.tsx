'use client';

import React from 'react';
import { Loader2, UserRound } from 'lucide-react';

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
    <img src={url} alt={name} width={size} height={size} className="rounded-full object-cover shrink-0 bg-[#ECE8F4]" style={{ width: size, height: size }} />
  ) : (
    <span className="rounded-full shrink-0 bg-[#F3EFFC] flex items-center justify-center text-[#6555B8]" style={{ width: size, height: size }}>
      <UserRound className="w-1/2 h-1/2" aria-hidden />
    </span>
  );
}

export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div>
        <h1 className="text-xl font-bold text-[#2D264B]">{title}</h1>
        {subtitle && <p className="text-sm text-[#6C637B] mt-0.5">{subtitle}</p>}
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
        kind === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#ECE8F4] bg-white py-14 px-6 text-center">
      <Icon className="w-8 h-8 mx-auto text-[#8C71F5]" />
      <p className="mt-3 font-semibold text-[#2D264B]">{title}</p>
      <p className="mt-1 text-sm text-[#6C637B]">{body}</p>
    </div>
  );
}

export function Loading() {
  return (
    <div className="py-16 flex justify-center text-[#8C71F5]">
      <Loader2 className="w-6 h-6 animate-spin" aria-label="Loading" />
    </div>
  );
}

type BtnTone = 'primary' | 'neutral' | 'danger' | 'warn';
const TONES: Record<BtnTone, string> = {
  primary: 'bg-gradient-to-r from-[#8C71F5] to-[#EC4899] text-white border-transparent hover:opacity-95',
  neutral: 'bg-white text-[#2D264B] border-[#ECE8F4] hover:bg-[#F9F8FC]',
  danger: 'bg-rose-600 text-white border-transparent hover:bg-rose-700',
  warn: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
};

export function AdminButton({
  tone = 'neutral',
  busy,
  className = '',
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: BtnTone; busy?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={busy || rest.disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${TONES[tone]} ${className}`}
    >
      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
