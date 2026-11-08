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
  ScanFace,
  Zap,
} from 'lucide-react';
import { getPoseById } from '@/lib/poses';
import { REPUTATION_RULES } from '@/lib/reputation';

/** Pre-screen shape from older multi-pose submissions. */
interface AiVerdict {
  isSafe: boolean;
  poseMatchesPrompt: boolean;
  reason: string;
}

/** Gemini pre-screen stored with each selfie submission (scores only; never grants the badge). */
interface SelfieReview {
  pose_matches: boolean;
  same_person: boolean;
  face_match_confidence: number;
  spoof_detected: boolean;
  summary: string;
}

interface IdentityItem {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  country?: string | null;
  age?: number | null;
  birthdate?: string | null;
  submission: {
    submittedAt: string | null;
    photos: string[];
    poses: string | null;
    poseId?: string | null;
    ai: AiVerdict | null;
    review?: SelfieReview | null;
    fastTrack?: boolean;
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

type Kind = 'identity' | 'avatar' | 'report';

const Chip = ({ tone, children }: { tone: 'good' | 'bad' | 'neutral'; children: React.ReactNode }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
      tone === 'good'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : tone === 'bad'
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-[#E8E6F1]/60 border-[#D0CDE1] text-[#8574B7]'
    }`}
  >
    {children}
  </span>
);

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
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

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

  /** `id` is the member id, or the report id when kind is 'report'. */
  const decide = async (kind: Kind, id: string, action: 'approve' | 'reject') => {
    const key = `${kind}:${id}`;
    try {
      setBusy(key);
      setFeedback(null);
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          kind === 'report'
            ? { kind, reportId: id, action }
            : { kind, userId: id, action, reason: action === 'reject' ? rejectReasons[id] || '' : undefined }
        ),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Action failed');

      if (kind === 'identity') setIdentity((prev) => prev.filter((i) => i.id !== id));
      else if (kind === 'avatar') setAvatars((prev) => prev.filter((a) => a.id !== id));
      else setReports((prev) => prev.filter((r) => r.id !== id));
      setFeedback({
        type: 'success',
        text:
          kind === 'identity'
            ? action === 'approve' ? 'Identity approved. Verified badge is live.' : 'Verification rejected. Member was notified.'
            : kind === 'avatar'
              ? action === 'approve' ? 'Main photo approved.' : 'Main photo rejected. Member was notified.'
              : action === 'approve'
                ? `Report confirmed. Member docked ${REPUTATION_RULES.confirmedReport} reputation points.`
                : 'Report dismissed.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setBusy(null);
    }
  };

  const ActionButtons = ({
    kind,
    userId,
    labels = ['Approve', 'Reject'],
  }: {
    kind: Kind;
    userId: string;
    labels?: [string, string];
  }) => {
    const isBusy = busy === `${kind}:${userId}`;
    return (
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => decide(kind, userId, 'approve')}
          disabled={isBusy}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#8574B7] hover:bg-[#8574B7] text-white text-xs font-semibold disabled:opacity-50 min-h-[42px]"
        >
          {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {labels[0]}
        </button>
        <button
          onClick={() => decide(kind, userId, 'reject')}
          disabled={isBusy}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-semibold disabled:opacity-50 min-h-[42px]"
        >
          {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          {labels[1]}
        </button>
      </div>
    );
  };

  const SectionTitle = ({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) => (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-bold text-[#413B5E]" style={{ fontFamily: 'var(--font-brand)' }}>
        {icon}
        {title}
      </h2>
      <span className="px-2 py-0.5 rounded-full bg-[#E8E6F1]/60 text-[#8574B7] text-[11px] font-semibold">{count}</span>
    </div>
  );

  const Empty = ({ text }: { text: string }) => (
    <p className="p-5 text-center text-xs text-[#413B5E]/55 bg-white rounded-2xl border border-[#D0CDE1]">{text}</p>
  );

  return (
    <div className="text-[#413B5E]">
      <div className="space-y-4">
        <header className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#E8E6F1]/60 border border-[#D0CDE1] rounded-xl text-[#8574B7]">
                <BadgeCheck className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#413B5E]">ID Checks</h1>
                <p className="text-xs text-[#413B5E]/75">
                  {loading ? 'Loading...' : `${identity.length} pending identity check${identity.length === 1 ? '' : 's'}`} · main photos · reports
                </p>
              </div>
            </div>
            <button
              onClick={() => load()}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-[#D0CDE1] hover:bg-[#E8E6F1]/70 text-[#413B5E]/75 disabled:opacity-50"
              aria-label="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="underline ml-3">
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-[#413B5E]/75 flex flex-col items-center gap-3 bg-white rounded-2xl border border-[#D0CDE1]">
            <Loader2 className="w-7 h-7 animate-spin text-[#8574B7]" />
            <p className="text-xs">Loading review queue...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700 space-y-2">
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
              <SectionTitle icon={<BadgeCheck className="w-4 h-4 text-[#8574B7]" />} title="Identity verification" count={identity.length} />
              {identity.length === 0 ? (
                <Empty text="All verifications caught up" />
              ) : (
                identity.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-white border border-[#D0CDE1] shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      {item.avatar_url ? (
                        <img src={item.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover border border-[#D0CDE1]" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#E8E6F1]/60" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {nameOf(item)}
                          {(() => {
                            const age =
                              item.age ??
                              (item.birthdate
                                ? Math.floor((Date.now() - new Date(item.birthdate).getTime()) / (365.25 * 24 * 3600 * 1000))
                                : null);
                            return age ? <span className="font-normal text-[#413B5E]/75">, {age}</span> : null;
                          })()}
                        </p>
                        <p className="text-[11px] text-[#413B5E]/55 truncate">
                          {[item.city, item.country].filter(Boolean).join(', ') || 'No location'}
                          {item.submission.submittedAt && ` · ${new Date(item.submission.submittedAt).toLocaleString()}`}
                        </p>
                      </div>
                    </div>

                    {(() => {
                      const sub = item.submission;
                      const pose = getPoseById(sub.poseId);
                      const review = sub.review;
                      return (
                        <>
                          {sub.photos.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                              <figure className="space-y-1">
                                {item.avatar_url ? (
                                  <img src={item.avatar_url} alt="Profile photo" className="w-full aspect-[3/4] object-cover rounded-xl border border-[#D0CDE1]" />
                                ) : (
                                  <div className="w-full aspect-[3/4] rounded-xl bg-[#E8E6F1]/60" />
                                )}
                                <figcaption className="text-[10px] text-center text-[#413B5E]/55">Main photo</figcaption>
                              </figure>
                              {sub.photos.map((url, i) => (
                                <figure key={url} className="space-y-1">
                                  <a href={url} target="_blank" rel="noreferrer">
                                    <img src={url} alt={pose ? 'Selfie' : `Pose ${i + 1}`} className="w-full aspect-[3/4] object-cover rounded-xl border border-[#D0CDE1]" />
                                  </a>
                                  <figcaption className="text-[10px] text-center text-[#413B5E]/55">{pose ? 'Captured selfie' : `Pose ${i + 1}`}</figcaption>
                                </figure>
                              ))}
                              {pose && (
                                <figure className="space-y-1">
                                  <img src={pose.image} alt={pose.label} className="w-full aspect-[3/4] object-contain rounded-xl border border-[#D0CDE1] bg-[#E8E6F1]/60" />
                                  <figcaption className="text-[10px] text-center text-[#413B5E]/55 leading-tight">{pose.label}</figcaption>
                                </figure>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                              No stored verification photo was found for this submission.
                            </p>
                          )}

                          {!pose && sub.poses && (
                            <p className="text-[11px] text-[#413B5E]/75">
                              Requested poses: <span className="font-semibold text-[#413B5E]">{sub.poses}</span>
                            </p>
                          )}

                          {review ? (
                            <div className="space-y-2 bg-white border border-[#D0CDE1] rounded-xl p-2.5">
                              <div className="flex flex-wrap gap-1.5">
                                {sub.fastTrack && (
                      <Chip tone="neutral">
                        <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3" aria-hidden /> Fast-track</span>
                      </Chip>
                    )}
                                <Chip tone={review.pose_matches ? 'good' : 'bad'}>
                                  {review.pose_matches ? 'Pose Matched' : 'Pose Mismatched'}
                                </Chip>
                                <Chip tone={review.same_person && review.face_match_confidence >= 85 ? 'good' : review.same_person ? 'neutral' : 'bad'}>
                                  Match Confidence {review.face_match_confidence}%
                                </Chip>
                                <Chip tone={review.spoof_detected ? 'bad' : 'good'}>
                                  {review.spoof_detected ? 'Spoof Suspect' : 'Spoof Clean'}
                                </Chip>
                              </div>
                              {review.summary && (
                                <p className="flex items-start gap-1.5 text-[11px] text-[#413B5E]">
                                  <ScanFace className="w-3.5 h-3.5 text-[#8574B7] shrink-0 mt-0.5" />
                                  <span>{review.summary}</span>
                                </p>
                              )}
                            </div>
                          ) : sub.ai ? (
                            <div className="flex items-start gap-2 text-[11px] bg-white border border-[#D0CDE1] rounded-xl p-2.5 text-[#413B5E]">
                              <ScanFace className="w-3.5 h-3.5 text-[#8574B7] shrink-0 mt-0.5" />
                              <span>
                                AI pre-check: {sub.ai.isSafe ? 'safe' : 'NOT safe'},{' '}
                                {sub.ai.poseMatchesPrompt ? 'pose matches' : 'pose does NOT match'}.{' '}
                                <span className="text-[#413B5E]/75">{sub.ai.reason}</span>
                              </span>
                            </div>
                          ) : (
                            <p className="text-[11px] text-[#413B5E]/75 bg-white border border-[#D0CDE1] rounded-xl p-2.5">
                              AI pre-screen unavailable for this submission. Review the photos manually.
                            </p>
                          )}
                        </>
                      );
                    })()}

                    <input
                      type="text"
                      value={rejectReasons[item.id] || ''}
                      onChange={(e) => setRejectReasons((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      maxLength={300}
                      placeholder="Rejection reason (optional, sent to the member)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#D0CDE1] text-xs text-[#413B5E] placeholder:text-[#413B5E]/55 focus:outline-none focus:border-[#8574B7]"
                    />

                    <ActionButtons kind="identity" userId={item.id} labels={['Approve Identity', 'Reject']} />
                  </div>
                ))
              )}
            </section>

            {/* Main photos */}
            <section className="space-y-3">
              <SectionTitle icon={<ImageIcon className="w-4 h-4 text-[#8574B7]" />} title="Main photos" count={avatars.length} />
              {avatars.length === 0 ? (
                <Empty text="No main photos waiting for review." />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {avatars.map((a) => (
                    <div key={a.id} className="p-3 rounded-2xl bg-white border border-[#D0CDE1] shadow-sm space-y-2">
                      {a.avatar_url ? (
                        <a href={a.avatar_url} target="_blank" rel="noreferrer">
                          <img src={a.avatar_url} alt="Main photo" className="w-full aspect-[4/5] object-cover rounded-xl" />
                        </a>
                      ) : (
                        <div className="w-full aspect-[4/5] rounded-xl bg-[#E8E6F1]/60" />
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
              <SectionTitle icon={<Flag className="w-4 h-4 text-red-500" />} title="Open member reports" count={reports.length} />
              {reports.length === 0 ? (
                <Empty text="No open reports." />
              ) : (
                reports.map((r) => (
                  <div key={r.id} className="p-3.5 rounded-2xl bg-white border border-[#D0CDE1] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold text-[11px]">
                        {r.reason.replace(/_/g, ' ')}
                      </span>
                      {r.created_at && (
                        <span className="text-[11px] text-[#413B5E]/55">{new Date(r.created_at).toLocaleString()}</span>
                      )}
                    </div>
                    <p className="text-[#413B5E]">
                      Reported:{' '}
                      <a href={`/profile/${r.reported_id}`} className="font-mono text-[#8574B7] underline">
                        {r.reported_id.slice(0, 8)}
                      </a>{' '}
                      · by <span className="font-mono">{r.reporter_id.slice(0, 8)}</span>
                    </p>
                    {r.details && <p className="text-[#413B5E]/75 break-words">{r.details}</p>}
                    <ActionButtons kind="report" userId={r.id} labels={[`Confirm (-${REPUTATION_RULES.confirmedReport} rep)`, 'Dismiss']} />
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
