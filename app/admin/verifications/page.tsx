'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ImageIcon,
  Flag,
  Sparkles,
} from 'lucide-react';
import { AdminTabs } from '@/components/admin/AdminTabs';

interface AiVerdict {
  isSafe: boolean;
  poseMatchesPrompt: boolean;
  reason: string;
}

interface IdentityItem {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  country?: string | null;
  submission: {
    submittedAt: string | null;
    photos: string[];
    poses: string | null;
    ai: AiVerdict | null;
  };
}

interface AvatarItem {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  gender?: string | null;
}

interface ReportItem {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details?: string | null;
  created_at?: string;
}

type Kind = 'identity' | 'avatar';

const nameOf = (p: { username?: string | null; full_name?: string | null; id: string }) =>
  p.username ? `@${p.username}` : p.full_name || `User ${p.id.slice(0, 8)}`;

export default function AdminVerificationsPage() {
  const [identity, setIdentity] = useState<IdentityItem[]>([]);
  const [avatars, setAvatars] = useState<AvatarItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/verifications', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to load queue (Status: ${res.status})`);
      setIdentity(data.identity || []);
      setAvatars(data.avatars || []);
      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message || 'Unable to fetch review queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (kind: Kind, userId: string, action: 'approve' | 'reject') => {
    const key = `${kind}:${userId}`;
    try {
      setBusy(key);
      setFeedback(null);
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, userId, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Action failed');

      if (kind === 'identity') setIdentity((prev) => prev.filter((i) => i.id !== userId));
      else setAvatars((prev) => prev.filter((a) => a.id !== userId));
      setFeedback({
        type: 'success',
        text:
          kind === 'identity'
            ? action === 'approve' ? 'Identity approved. Verified badge is live.' : 'Verification rejected. Member was notified.'
            : action === 'approve' ? 'Main photo approved.' : 'Main photo rejected. Member was notified.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setBusy(null);
    }
  };

  const ActionButtons = ({ kind, userId }: { kind: Kind; userId: string }) => {
    const isBusy = busy === `${kind}:${userId}`;
    return (
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => decide(kind, userId, 'approve')}
          disabled={isBusy}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#6555B8] hover:bg-[#5344A6] text-white text-xs font-semibold disabled:opacity-50 min-h-[42px]"
        >
          {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Approve
        </button>
        <button
          onClick={() => decide(kind, userId, 'reject')}
          disabled={isBusy}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold disabled:opacity-50 min-h-[42px]"
        >
          {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Reject
        </button>
      </div>
    );
  };

  const SectionTitle = ({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) => (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-bold text-[#1C1924]" style={{ fontFamily: 'var(--font-brand)' }}>
        {icon}
        {title}
      </h2>
      <span className="px-2 py-0.5 rounded-full bg-[#F3EFFC] text-[#6555B8] text-[11px] font-semibold">{count}</span>
    </div>
  );

  const Empty = ({ text }: { text: string }) => (
    <p className="p-5 text-center text-xs text-[#9A93A8] bg-white rounded-2xl border border-[#ECE8F4]">{text}</p>
  );

  return (
    <div className="min-h-full bg-[#F9F8FC] text-[#1C1924] pb-[calc(5rem+env(safe-area-inset-bottom,16px))]">
      <div className="px-4 pt-6 space-y-5">
        <header className="space-y-3 border-b border-[#ECE8F4] pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#F3EFFC] border border-[#E5E1EC] rounded-xl text-[#6555B8]">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-brand)' }}>
                  Review Queue
                </h1>
                <p className="text-xs text-[#6C637B]">Identity checks, main photos and reports</p>
              </div>
            </div>
            <button
              onClick={() => load()}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-[#ECE8F4] hover:bg-[#F3EFFC] text-[#6C637B] disabled:opacity-50"
              aria-label="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <AdminTabs />
        </header>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="underline ml-3">
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-[#6C637B] flex flex-col items-center gap-3 bg-white rounded-2xl border border-[#ECE8F4]">
            <Loader2 className="w-7 h-7 animate-spin text-[#6555B8]" />
            <p className="text-xs">Loading review queue...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700 space-y-2">
            <AlertTriangle className="w-5 h-5 mx-auto" />
            <p className="text-xs font-medium">{error}</p>
            <button onClick={() => load()} className="text-xs underline">
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Identity verifications */}
            <section className="space-y-3">
              <SectionTitle icon={<BadgeCheck className="w-4 h-4 text-[#6555B8]" />} title="Identity verification" count={identity.length} />
              {identity.length === 0 ? (
                <Empty text="No pending identity checks." />
              ) : (
                identity.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-white border border-[#ECE8F4] shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      {item.avatar_url ? (
                        <img src={item.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover border border-[#ECE8F4]" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#F3EFFC]" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{nameOf(item)}</p>
                        <p className="text-[11px] text-[#9A93A8] truncate">
                          {[item.city, item.country].filter(Boolean).join(', ') || 'No location'}
                          {item.submission.submittedAt && ` · ${new Date(item.submission.submittedAt).toLocaleString()}`}
                        </p>
                      </div>
                    </div>

                    {item.submission.poses && (
                      <p className="text-[11px] text-[#6C637B]">
                        Requested poses: <span className="font-semibold text-[#1C1924]">{item.submission.poses}</span>
                      </p>
                    )}

                    {item.submission.photos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {item.avatar_url && (
                          <figure className="space-y-1">
                            <img src={item.avatar_url} alt="Profile photo" className="w-full aspect-square object-cover rounded-xl border border-[#ECE8F4]" />
                            <figcaption className="text-[10px] text-center text-[#9A93A8]">Profile</figcaption>
                          </figure>
                        )}
                        {item.submission.photos.map((url, i) => (
                          <figure key={url} className="space-y-1">
                            <a href={url} target="_blank" rel="noreferrer">
                              <img src={url} alt={`Pose ${i + 1}`} className="w-full aspect-square object-cover rounded-xl border border-[#ECE8F4]" />
                            </a>
                            <figcaption className="text-[10px] text-center text-[#9A93A8]">Pose {i + 1}</figcaption>
                          </figure>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                        No stored pose photos were found for this submission.
                      </p>
                    )}

                    {item.submission.ai && (
                      <div className="flex items-start gap-2 text-[11px] bg-[#F9F8FC] border border-[#ECE8F4] rounded-xl p-2.5 text-[#3D3650]">
                        <Sparkles className="w-3.5 h-3.5 text-[#6555B8] shrink-0 mt-0.5" />
                        <span>
                          AI pre-check: {item.submission.ai.isSafe ? 'safe' : 'NOT safe'},{' '}
                          {item.submission.ai.poseMatchesPrompt ? 'pose matches' : 'pose does NOT match'}.{' '}
                          <span className="text-[#6C637B]">{item.submission.ai.reason}</span>
                        </span>
                      </div>
                    )}

                    <ActionButtons kind="identity" userId={item.id} />
                  </div>
                ))
              )}
            </section>

            {/* Main photos */}
            <section className="space-y-3">
              <SectionTitle icon={<ImageIcon className="w-4 h-4 text-[#6555B8]" />} title="Main photos" count={avatars.length} />
              {avatars.length === 0 ? (
                <Empty text="No main photos waiting for review." />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {avatars.map((a) => (
                    <div key={a.id} className="p-3 rounded-2xl bg-white border border-[#ECE8F4] shadow-sm space-y-2">
                      {a.avatar_url ? (
                        <a href={a.avatar_url} target="_blank" rel="noreferrer">
                          <img src={a.avatar_url} alt="Main photo" className="w-full aspect-[4/5] object-cover rounded-xl" />
                        </a>
                      ) : (
                        <div className="w-full aspect-[4/5] rounded-xl bg-[#F3EFFC]" />
                      )}
                      <p className="text-xs font-semibold truncate">{nameOf(a)}</p>
                      <ActionButtons kind="avatar" userId={a.id} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Reports (read-only) */}
            <section className="space-y-3">
              <SectionTitle icon={<Flag className="w-4 h-4 text-rose-500" />} title="Open member reports" count={reports.length} />
              {reports.length === 0 ? (
                <Empty text="No open reports." />
              ) : (
                reports.map((r) => (
                  <div key={r.id} className="p-3.5 rounded-2xl bg-white border border-[#ECE8F4] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-semibold text-[11px]">
                        {r.reason.replace(/_/g, ' ')}
                      </span>
                      {r.created_at && (
                        <span className="text-[11px] text-[#9A93A8]">{new Date(r.created_at).toLocaleString()}</span>
                      )}
                    </div>
                    <p className="text-[#3D3650]">
                      Reported:{' '}
                      <a href={`/profile/${r.reported_id}`} className="font-mono text-[#6555B8] underline">
                        {r.reported_id.slice(0, 8)}
                      </a>{' '}
                      · by <span className="font-mono">{r.reporter_id.slice(0, 8)}</span>
                    </p>
                    {r.details && <p className="text-[#6C637B] break-words">{r.details}</p>}
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
