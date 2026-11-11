'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle2, ChevronDown, ChevronUp, Flag, MessageCircle, MinusCircle, RefreshCw, UserRound } from 'lucide-react';
import { ReputationBadge } from '@/components/ReputationBadge';
import { AdminAvatar, AdminButton, BottomSheet, EmptyState, Loading, Notice, PageTitle, adminFetch, timeAgo } from '@/components/admin/ui';
import { useActionToast } from '@/components/ActionToast';

type ReportAction = 'dismiss' | 'penalize' | 'ban';

type Person = { id: string; name: string; avatarUrl: string | null; reputation: number; isBanned: boolean } | null;
type Report = {
  id: string;
  reason: string;
  reasonLabel: string;
  source: 'chat' | 'profile' | null;
  details: string;
  createdAt: string;
  reporter: Person;
  reported: Person;
};
type ContextMessage = { id: string; fromReported: boolean; content: string; createdAt: string; quarantined: boolean };

function PersonRow({ person, label }: { person: Person; label: string }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <AdminAvatar url={person?.avatarUrl ?? null} name={person?.name || 'Member'} size={32} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#413B5E] truncate">{person?.name || 'Deleted member'}</p>
        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-600">{label}</p>
      </div>
      {person && (
        <div className="flex items-center gap-1 shrink-0">
          {person.isBanned && <span className="text-[10px] font-semibold text-red-600">Banned</span>}
          <ReputationBadge score={person.reputation} size="xs" />
        </div>
      )}
    </div>
  );
}

function ContextSheet({ report, onClose }: { report: Report; onClose: () => void }) {
  const [messages, setMessages] = useState<ContextMessage[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    adminFetch<{ messages: ContextMessage[] }>(`/api/admin/reports?context=${report.id}`)
      .then((r) => setMessages(r.messages))
      .catch((e) => setError(e.message));
  }, [report.id]);

  return (
    <BottomSheet
      title="Conversation context"
      subtitle={`${report.reporter?.name || 'Reporter'} and ${report.reported?.name || 'reported member'}, latest 40 messages`}
      onClose={onClose}
    >
      <div className="p-4 space-y-2 bg-white min-h-[200px]">
        {error && <Notice kind="error">{error}</Notice>}
        {!messages && !error && <Loading />}
        {messages && messages.length === 0 && (
          <p className="text-sm text-center text-[#413B5E]/75 py-10">These members have not exchanged messages.</p>
        )}
        {messages?.map((m) => (
          <div key={m.id} className={`flex ${m.fromReported ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.fromReported ? 'bg-white border border-[#D0CDE1] text-[#413B5E]' : 'bg-[#413B5E] text-white'
              } ${m.quarantined ? 'ring-2 ring-red-300' : ''}`}
            >
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
              <p className={`mt-1 text-[10px] ${m.fromReported ? 'text-slate-600' : 'text-white/60'}`}>
                {m.fromReported ? report.reported?.name : report.reporter?.name} · {timeAgo(m.createdAt)}
                {m.quarantined && ' · quarantined'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}

function ReportCard({
  report,
  onAction,
}: {
  report: Report;
  /** Resolves the report; the page removes the card right away and restores it if the server refuses. */
  onAction: (report: Report, action: ReportAction, points: number | undefined, note: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showPenalty, setShowPenalty] = useState(false);
  const [confirmBan, setConfirmBan] = useState(false);
  const [inspect, setInspect] = useState(false);

  const act = (action: ReportAction, points?: number) => {
    setBusy(action + (points ?? ''));
    onAction(report, action, points, note.trim());
  };

  return (
    <article className="p-4 rounded-2xl border border-[#D0CDE1] bg-white mb-3 shadow-2xs">
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[11px] font-semibold text-red-700">
          <Flag className="w-3 h-3" aria-hidden />
          {report.reasonLabel}
        </span>
        {report.source && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#8574B7]/10 px-2 py-0.5 text-[11px] font-semibold text-[#8574B7]">
            {report.source === 'chat' ? <MessageCircle className="w-3 h-3" aria-hidden /> : <UserRound className="w-3 h-3" aria-hidden />}
            {report.source === 'chat' ? 'Chat' : 'Profile'}
          </span>
        )}
        <span className="ml-auto text-[11px] text-slate-600">{timeAgo(report.createdAt)}</span>
      </div>

      <div className="space-y-2.5 rounded-xl border border-[#D0CDE1] p-3">
        <PersonRow person={report.reported} label="Reported" />
        <div className="h-px bg-[#E8E6F1]/60" />
        <PersonRow person={report.reporter} label="Reported by" />
      </div>

      {report.details && (
        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-[#413B5E] whitespace-pre-wrap break-words">{report.details}</p>
      )}

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={300}
        enterKeyHint="done"
        placeholder="Internal note (optional)"
        className="mt-3 w-full h-10 rounded-xl border border-[#D0CDE1] bg-white px-3 text-sm outline-none focus:border-[#8574B7]"
      />

      <AdminButton size="lg" className="mt-2 w-full" onClick={() => setInspect(true)}>
        <MessageCircle className="w-4 h-4" aria-hidden />
        Inspect Context
      </AdminButton>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <AdminButton size="lg" onClick={() => act('dismiss')} busy={busy === 'dismiss'} disabled={!!busy}>
          <CheckCircle2 className="w-4 h-4" aria-hidden />
          Dismiss
        </AdminButton>
        <AdminButton
          size="lg"
          tone="warn"
          onClick={() => setShowPenalty((v) => !v)}
          disabled={!!busy || !report.reported}
          aria-expanded={showPenalty}
        >
          <MinusCircle className="w-4 h-4" aria-hidden />
          Penalize
          {showPenalty ? <ChevronUp className="w-3 h-3" aria-hidden /> : <ChevronDown className="w-3 h-3" aria-hidden />}
        </AdminButton>
        <AdminButton
          size="lg"
          tone="danger"
          onClick={() => setConfirmBan(true)}
          disabled={!!busy || !report.reported || report.reported.isBanned || confirmBan}
        >
          <Ban className="w-4 h-4" aria-hidden />
          Ban
        </AdminButton>
      </div>

      {showPenalty && (
        <div className="mt-2 rounded-xl bg-amber-50/70 border border-amber-100 p-2.5">
          <p className="text-xs text-amber-800 mb-2">Deduct reputation from {report.reported?.name || 'this member'}</p>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 20].map((p) => (
              <AdminButton key={p} size="lg" tone="warn" onClick={() => act('penalize', p)} busy={busy === `penalize${p}`} disabled={!!busy}>
                -{p}%
              </AdminButton>
            ))}
          </div>
        </div>
      )}

      {confirmBan && (
        <div className="mt-2 rounded-xl bg-red-50 border border-red-100 p-2.5">
          <p className="text-xs text-red-800 mb-2">Ban {report.reported?.name || 'this member'}? They are signed out and cannot sign in again.</p>
          <div className="grid grid-cols-2 gap-2">
            <AdminButton size="lg" onClick={() => setConfirmBan(false)} disabled={!!busy}>
              Cancel
            </AdminButton>
            <AdminButton size="lg" tone="danger" onClick={() => act('ban')} busy={busy === 'ban'} disabled={!!busy}>
              Confirm ban
            </AdminButton>
          </div>
        </div>
      )}

      {inspect && <ContextSheet report={report} onClose={() => setInspect(false)} />}
    </article>
  );
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState('');
  const showToast = useActionToast();

  /** Optimistic: the card leaves the queue immediately; on failure it comes back with the error. */
  const resolve = async (report: Report, action: ReportAction, points: number | undefined, note: string) => {
    setError('');
    setReports((list) => (list || []).filter((x) => x.id !== report.id));
    try {
      await adminFetch('/api/admin/reports', { reportId: report.id, action, points, note: note || undefined });
      const who = report.reported?.name || 'Member';
      showToast(
        action === 'dismiss' ? 'Report dismissed' : action === 'ban' ? `${who} banned` : `${who} penalized (-${points}%)`,
        action === 'dismiss' ? 'check' : 'shield'
      );
    } catch (e: unknown) {
      setReports((list) =>
        [...(list || []), report].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
      setError(`Could not apply that action: ${e instanceof Error ? e.message : 'please try again.'}`);
    }
  };

  const load = useCallback(async () => {
    setError('');
    try {
      const r = await adminFetch<{ reports: Report[] }>('/api/admin/reports');
      setReports(r.reports);
    } catch (e: any) {
      setError(e.message);
      setReports([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageTitle
        title="Reports"
        subtitle={reports ? `${reports.length} pending report${reports.length === 1 ? '' : 's'}` : 'Member reports awaiting review'}
        right={
          <AdminButton onClick={() => { setReports(null); load(); }} aria-label="Refresh">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden />
            Refresh
          </AdminButton>
        }
      />
      {error && <Notice kind="error">{error}</Notice>}
      {!reports ? (
        <Loading />
      ) : reports.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Queue is clear" body="No reports are waiting for review." />
      ) : (
        reports.map((r) => (
          <ReportCard key={r.id} report={r} onAction={resolve} />
        ))
      )}
    </div>
  );
}
