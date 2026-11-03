'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Ban, CheckCircle2, ChevronDown, ChevronUp, Flag, MessageCircle, MinusCircle, RefreshCw, ShieldAlert, UserRound, X } from 'lucide-react';
import { ReputationBadge } from '@/components/ReputationBadge';
import { AdminAvatar, AdminButton, EmptyState, Loading, Notice, PageTitle, adminFetch, timeAgo } from '@/components/admin/ui';

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

function PersonChip({ person, label }: { person: Person; label: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <AdminAvatar url={person?.avatarUrl ?? null} name={person?.name || 'Member'} size={36} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#9A92AB]">{label}</p>
        <p className="text-sm font-semibold text-[#2D264B] truncate">{person?.name || 'Deleted member'}</p>
        {person && (
          <div className="flex items-center gap-1 mt-0.5">
            <ReputationBadge score={person.reputation} size="xs" />
            {person.isBanned && <span className="text-[10px] font-semibold text-rose-600">Banned</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function ContextDrawer({ report, onClose }: { report: Report; onClose: () => void }) {
  const [messages, setMessages] = useState<ContextMessage[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    adminFetch<{ messages: ContextMessage[] }>(`/api/admin/reports?context=${report.id}`)
      .then((r) => setMessages(r.messages))
      .catch((e) => setError(e.message));
  }, [report.id]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Report context">
      <button type="button" className="absolute inset-0 bg-[#1C1924]/30" aria-label="Close" onClick={onClose} />
      <aside className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col">
        <header className="flex items-center justify-between px-4 h-14 border-b border-[#ECE8F4]">
          <div>
            <p className="text-sm font-bold text-[#2D264B]">Conversation context</p>
            <p className="text-[11px] text-[#6C637B]">
              {report.reporter?.name || 'Reporter'} and {report.reported?.name || 'reported member'}, latest 40 messages
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-[#F9F8FC]" aria-label="Close">
            <X className="w-4 h-4 text-[#6C637B]" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#F9F8FC]">
          {error && <Notice kind="error">{error}</Notice>}
          {!messages && !error && <Loading />}
          {messages && messages.length === 0 && (
            <p className="text-sm text-center text-[#6C637B] py-10">These members have not exchanged messages.</p>
          )}
          {messages?.map((m) => (
            <div key={m.id} className={`flex ${m.fromReported ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  m.fromReported ? 'bg-white border border-[#ECE8F4] text-[#1C1924]' : 'bg-[#2D264B] text-white'
                } ${m.quarantined ? 'ring-2 ring-rose-300' : ''}`}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`mt-1 text-[10px] ${m.fromReported ? 'text-[#9A92AB]' : 'text-white/60'}`}>
                  {m.fromReported ? report.reported?.name : report.reporter?.name} · {timeAgo(m.createdAt)}
                  {m.quarantined && ' · quarantined'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function ReportCard({ report, onResolved }: { report: Report; onResolved: (id: string, message: string) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [showPenalty, setShowPenalty] = useState(false);
  const [confirmBan, setConfirmBan] = useState(false);
  const [inspect, setInspect] = useState(false);

  const act = async (action: 'dismiss' | 'penalize' | 'ban', points?: number) => {
    setBusy(action + (points ?? ''));
    setError('');
    try {
      await adminFetch('/api/admin/reports', { reportId: report.id, action, points, note: note || undefined });
      const who = report.reported?.name || 'member';
      onResolved(
        report.id,
        action === 'dismiss' ? 'Report dismissed.' : action === 'ban' ? `${who} was banned.` : `${who} lost ${points} reputation points.`
      );
    } catch (e: any) {
      setError(e.message);
      setBusy(null);
    }
  };

  return (
    <article className="rounded-2xl border border-[#ECE8F4] bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
          <Flag className="w-3 h-3" aria-hidden />
          {report.reasonLabel}
        </span>
        {report.source && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F3EFFC] border border-[#E2DBF0] px-2 py-0.5 text-[11px] font-semibold text-[#6555B8]">
            {report.source === 'chat' ? <MessageCircle className="w-3 h-3" aria-hidden /> : <UserRound className="w-3 h-3" aria-hidden />}
            From {report.source}
          </span>
        )}
        <span className="ml-auto text-[11px] text-[#9A92AB]">{timeAgo(report.createdAt)}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
        <PersonChip person={report.reporter} label="Reporter" />
        <ArrowRight className="hidden sm:block w-4 h-4 text-[#C9C1DA]" aria-hidden />
        <PersonChip person={report.reported} label="Reported" />
      </div>

      {report.details && (
        <p className="mt-3 rounded-xl bg-[#F9F8FC] border border-[#ECE8F4] px-3 py-2 text-sm text-[#3A3350] whitespace-pre-wrap break-words">
          {report.details}
        </p>
      )}

      {error && (
        <div className="mt-3">
          <Notice kind="error">{error}</Notice>
        </div>
      )}

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={300}
        placeholder="Internal note (optional)"
        className="mt-3 w-full rounded-xl border border-[#ECE8F4] bg-white px-3 py-2 text-sm outline-none focus:border-[#8C71F5]"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <AdminButton onClick={() => setInspect(true)}>
          <MessageCircle className="w-3.5 h-3.5" aria-hidden />
          Inspect Context
        </AdminButton>
        <AdminButton onClick={() => act('dismiss')} busy={busy === 'dismiss'} disabled={!!busy}>
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
          Dismiss
        </AdminButton>
        <AdminButton tone="warn" onClick={() => setShowPenalty((v) => !v)} disabled={!!busy || !report.reported}>
          <MinusCircle className="w-3.5 h-3.5" aria-hidden />
          Penalize
          {showPenalty ? <ChevronUp className="w-3 h-3" aria-hidden /> : <ChevronDown className="w-3 h-3" aria-hidden />}
        </AdminButton>
        {confirmBan ? (
          <span className="inline-flex items-center gap-1.5">
            <AdminButton tone="danger" onClick={() => act('ban')} busy={busy === 'ban'} disabled={!!busy}>
              Confirm ban
            </AdminButton>
            <AdminButton onClick={() => setConfirmBan(false)} disabled={!!busy}>
              Cancel
            </AdminButton>
          </span>
        ) : (
          <AdminButton tone="danger" onClick={() => setConfirmBan(true)} disabled={!!busy || !report.reported || report.reported.isBanned}>
            <Ban className="w-3.5 h-3.5" aria-hidden />
            Ban Account
          </AdminButton>
        )}
      </div>

      {showPenalty && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50/60 border border-amber-100 px-3 py-2">
          <ShieldAlert className="w-4 h-4 text-amber-700" aria-hidden />
          <span className="text-xs text-amber-800 mr-1">Deduct reputation:</span>
          {[5, 10, 20].map((p) => (
            <AdminButton key={p} tone="warn" onClick={() => act('penalize', p)} busy={busy === `penalize${p}`} disabled={!!busy}>
              -{p}%
            </AdminButton>
          ))}
        </div>
      )}

      {inspect && <ContextDrawer report={report} onClose={() => setInspect(false)} />}
    </article>
  );
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

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
          <AdminButton onClick={() => { setReports(null); load(); }}>
            <RefreshCw className="w-3.5 h-3.5" aria-hidden />
            Refresh
          </AdminButton>
        }
      />
      {flash && <Notice kind="success">{flash}</Notice>}
      {error && <Notice kind="error">{error}</Notice>}
      {!reports ? (
        <Loading />
      ) : reports.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Queue is clear" body="No reports are waiting for review." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onResolved={(id, msg) => {
                setReports((list) => (list || []).filter((x) => x.id !== id));
                setFlash(msg);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
