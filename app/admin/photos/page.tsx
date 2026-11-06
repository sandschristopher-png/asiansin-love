'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, CheckCircle2, ImageOff, MapPin, RefreshCw, X, XCircle } from 'lucide-react';
import { ReputationBadge } from '@/components/ReputationBadge';
import { AdminAvatar, AdminButton, EmptyState, Loading, Notice, PageTitle, adminFetch, timeAgo } from '@/components/admin/ui';

type PendingMember = {
  id: string;
  name: string;
  age: number | null;
  location: string | null;
  avatarUrl: string | null;
  photos: string[];
  uploadedAt: string | null;
  reputation: number;
  isVerified: boolean;
};

function PhotoCard({ member, onDone }: { member: PendingMember; onDone: (id: string, msg: string) => void }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(member.avatarUrl ? [member.avatarUrl] : []));
  const [verified, setVerified] = useState(member.isVerified);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [points, setPoints] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const run = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action);
    setError('');
    try {
      const r = await adminFetch('/api/admin/photos', { userId: member.id, action, ...extra });
      if (action === 'verify' || action === 'unverify') {
        setVerified(r.isVerified);
        setBusy(null);
        return;
      }
      onDone(member.id, action === 'approve' ? `Approved ${member.name}'s photos.` : `Removed ${r.removed} photo(s) from ${member.name}.`);
    } catch (e: any) {
      setError(e.message);
      setBusy(null);
    }
  };

  const toggle = (url: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });

  return (
    <article className="p-4 rounded-2xl border border-[#D0CDE1] bg-white mb-3 shadow-2xs">
      <div className="flex items-center gap-3">
        <AdminAvatar url={member.avatarUrl} name={member.name} size={44} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#413B5E] flex items-center gap-1 min-w-0">
            <span className="truncate">
              {member.name}
              {member.age !== null && <span className="font-normal text-[#413B5E]/75">, {member.age}</span>}
            </span>
            {verified && <BadgeCheck className="w-4 h-4 shrink-0 text-[#665D96]" aria-label="Verified" />}
          </p>
          <p className="text-xs text-[#413B5E]/75 flex items-center gap-1 min-w-0">
            {member.location && <MapPin className="w-3 h-3 shrink-0" aria-hidden />}
            <span className="truncate">
              {[member.location, `Uploaded ${timeAgo(member.uploadedAt)}`].filter(Boolean).join(' · ')}
            </span>
          </p>
        </div>
        <ReputationBadge score={member.reputation} size="xs" />
      </div>

      {member.photos.length === 0 ? (
        <p className="mt-3 text-sm text-[#413B5E]/75">No photos on file.</p>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {member.photos.map((url) => {
            const isMain = url === member.avatarUrl;
            const flagged = rejecting && selected.has(url);
            return (
              <button
                type="button"
                key={url}
                onClick={() => (rejecting ? toggle(url) : setExpanded(url))}
                aria-label={rejecting ? `Flag photo` : `Expand photo`}
                aria-pressed={rejecting ? flagged : undefined}
                className={`relative aspect-[3/4] overflow-hidden rounded-xl border ${
                  flagged ? 'border-red-500 ring-2 ring-red-300' : 'border-[#D0CDE1]'
                } cursor-pointer`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`${member.name} photo`} className={`w-full h-full object-cover ${flagged ? 'opacity-50' : ''}`} />
                {isMain && (
                  <span className="absolute top-1 left-1 rounded-full bg-[#413B5E]/80 px-1.5 py-0.5 text-[9px] font-semibold text-white">Main</span>
                )}
                {flagged && <XCircle className="absolute inset-0 m-auto w-7 h-7 text-red-600" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mt-3">
          <Notice kind="error">{error}</Notice>
        </div>
      )}

      {rejecting ? (
        <div className="mt-3 space-y-2 rounded-xl border border-red-100 bg-red-50/50 p-3">
          <p className="text-xs text-red-800">Tap the photos to remove ({selected.size} selected). The member is notified.</p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            placeholder="Reason shown to the member (optional)"
            className="w-full h-10 rounded-xl border border-[#D0CDE1] bg-white px-3 text-sm outline-none focus:border-[#665D96]"
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-[#413B5E]/75" htmlFor={`pen-${member.id}`}>
              Penalty
            </label>
            <select
              id={`pen-${member.id}`}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="h-9 rounded-lg border border-[#D0CDE1] bg-white px-2 text-sm"
            >
              <option value={0}>None</option>
              <option value={5}>-5%</option>
              <option value={10}>-10%</option>
              <option value={20}>-20%</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <AdminButton size="lg" onClick={() => setRejecting(false)} disabled={!!busy}>
              Cancel
            </AdminButton>
            <AdminButton
              size="lg"
              tone="danger"
              busy={busy === 'reject'}
              disabled={selected.size === 0 || !!busy}
              onClick={() => run('reject', { removePhotos: [...selected], reason: reason || undefined, points })}
            >
              Remove photos
            </AdminButton>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <AdminButton size="lg" tone="primary" busy={busy === 'approve'} disabled={!!busy} onClick={() => run('approve')}>
            <CheckCircle2 className="w-4 h-4" aria-hidden />
            Approve
          </AdminButton>
          <AdminButton size="lg" tone="danger" disabled={!!busy || member.photos.length === 0} onClick={() => setRejecting(true)}>
            <ImageOff className="w-4 h-4" aria-hidden />
            Reject
          </AdminButton>
          <AdminButton
            size="lg"
            className="col-span-2"
            busy={busy === 'verify' || busy === 'unverify'}
            disabled={!!busy}
            onClick={() => run(verified ? 'unverify' : 'verify')}
          >
            <BadgeCheck className="w-3.5 h-3.5" aria-hidden />
            {verified ? 'Remove Verified Badge' : 'Verify Badge'}
          </AdminButton>
        </div>
      )}

      {expanded && (
        <div className="fixed inset-0 z-50 bg-[#413B5E]/90 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Photo" onClick={() => setExpanded(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={expanded} alt={`${member.name} photo`} className="w-full max-w-[398px] max-h-full rounded-2xl object-contain" />
          <button type="button" className="absolute top-4 right-4 p-2 rounded-full bg-white/15 text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </article>
  );
}

export default function AdminPhotosPage() {
  const [members, setMembers] = useState<PendingMember[] | null>(null);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const r = await adminFetch<{ members: PendingMember[] }>('/api/admin/photos');
      setMembers(r.members);
    } catch (e: any) {
      setError(e.message);
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageTitle
        title="Photo Review"
        subtitle={members ? `${members.length} member${members.length === 1 ? '' : 's'} waiting` : 'New uploads awaiting approval'}
        right={
          <AdminButton onClick={() => { setMembers(null); load(); }}>
            <RefreshCw className="w-3.5 h-3.5" aria-hidden />
            Refresh
          </AdminButton>
        }
      />
      {flash && <Notice kind="success">{flash}</Notice>}
      {error && <Notice kind="error">{error}</Notice>}
      {!members ? (
        <Loading />
      ) : members.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="All caught up" body="No photos are waiting for review." />
      ) : (
        <div>
          {members.map((m) => (
            <PhotoCard
              key={m.id}
              member={m}
              onDone={(id, msg) => {
                setMembers((list) => (list || []).filter((x) => x.id !== id));
                setFlash(msg);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
