'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Ban, BadgeCheck, ChevronRight, Search, ShieldPlus, Undo2, Users } from 'lucide-react';
import { ReputationBadge } from '@/components/ReputationBadge';
import { ADMIN_ROLE_LABEL, type AdminRole } from '@/lib/adminRoles';
import { AdminAvatar, AdminButton, BottomSheet, EmptyState, Loading, Notice, PageTitle, adminFetch } from '@/components/admin/ui';

type Member = {
  id: string;
  name: string;
  displayName: string | null;
  age: number | null;
  location: string | null;
  avatarUrl: string | null;
  reputation: number;
  isVerified: boolean;
  isBanned: boolean;
  role: AdminRole;
};

const ROLE_PILL: Record<AdminRole, string> = {
  super_admin: 'bg-gradient-to-r from-[#8C71F5] to-[#EC4899] text-white',
  moderator: 'bg-[#8C71F5]/10 text-[#6555B8] border border-[#8C71F5]/25',
  member: 'bg-[#F9F8FC] text-[#6C637B] border border-[#ECE8F4]',
};

const RolePill = ({ role }: { role: AdminRole }) => (
  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${ROLE_PILL[role]}`}>{ADMIN_ROLE_LABEL[role]}</span>
);

/** Edit sheet: role delegation, manual reputation override, verification and ban. */
function MemberSheet({ member, onClose, onChange }: { member: Member; onClose: () => void; onChange: (m: Member, msg: string) => void }) {
  const [rep, setRep] = useState(String(member.reputation));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [confirmBan, setConfirmBan] = useState(false);

  const call = async (key: string, url: string, body: Record<string, unknown>, patch: Partial<Member>, msg: string) => {
    setBusy(key);
    setError('');
    try {
      await adminFetch(url, { userId: member.id, ...body });
      onChange({ ...member, ...patch }, msg);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const repNum = Number(rep);
  const repValid = rep.trim() !== '' && Number.isFinite(repNum) && repNum >= 0 && repNum <= 100;

  return (
    <BottomSheet title={member.name} subtitle={[member.age, member.location].filter(Boolean).join(' · ') || undefined} onClose={onClose}>
      <div className="p-4 space-y-4">
        {error && <Notice kind="error">{error}</Notice>}

        <section>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A92AB] mb-1.5">Role</p>
          <div className="grid grid-cols-2 gap-2">
            {(['member', 'moderator'] as const).map((r) => (
              <button
                key={r}
                type="button"
                disabled={!!busy || member.role === r || (r === 'moderator' && member.isBanned)}
                aria-pressed={member.role === r}
                onClick={() =>
                  call('role', '/api/admin/roles', { role: r }, { role: r }, r === 'moderator' ? `${member.name} is now a moderator.` : `${member.name}'s admin access was revoked.`)
                }
                className={`h-10 rounded-xl text-sm font-semibold border transition disabled:cursor-not-allowed ${
                  member.role === r ? 'bg-[#2D264B] text-white border-transparent' : 'bg-white text-[#2D264B] border-[#ECE8F4] disabled:opacity-50'
                }`}
              >
                {ADMIN_ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A92AB] mb-1.5 flex items-center gap-2">
            Reputation <ReputationBadge score={member.reputation} size="xs" />
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!repValid) return;
              const n = Math.round(repNum);
              call('rep', '/api/admin/members', { action: 'set_reputation', score: n }, { reputation: n }, `${member.name}'s reputation set to ${n}%.`);
            }}
          >
            <input
              type="number"
              inputMode="numeric"
              enterKeyHint="done"
              min={0}
              max={100}
              value={rep}
              onChange={(e) => setRep(e.target.value)}
              aria-label="Reputation score, 0 to 100"
              className="flex-1 min-w-0 h-10 rounded-xl border border-[#ECE8F4] px-3 text-sm tabular-nums outline-none focus:border-[#8C71F5]"
            />
            <AdminButton type="submit" size="lg" tone="primary" busy={busy === 'rep'} disabled={!!busy || !repValid || Math.round(repNum) === member.reputation}>
              Save
            </AdminButton>
          </form>
        </section>

        <section className="flex items-center justify-between rounded-xl border border-[#ECE8F4] px-3 h-12">
          <span className="text-sm font-semibold text-[#2D264B] flex items-center gap-1.5">
            <BadgeCheck className="w-4 h-4 text-[#8C71F5]" aria-hidden />
            Verified badge
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={member.isVerified}
            aria-label="Verified badge"
            disabled={!!busy}
            onClick={() =>
              call('ver', '/api/admin/members', { action: 'set_verified', verified: !member.isVerified }, { isVerified: !member.isVerified }, !member.isVerified ? `${member.name} is now verified.` : `Removed ${member.name}'s verified badge.`)
            }
            className={`w-11 h-6 rounded-full relative transition-colors disabled:opacity-50 ${member.isVerified ? 'bg-[#8C71F5]' : 'bg-[#DDD7E5]'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${member.isVerified ? 'left-6' : 'left-1'}`} />
          </button>
        </section>

        <section>
          {member.isBanned ? (
            <AdminButton size="lg" className="w-full" busy={busy === 'ban'} disabled={!!busy} onClick={() => call('ban', '/api/admin/members', { action: 'set_banned', banned: false }, { isBanned: false }, `${member.name} was unbanned.`)}>
              <Undo2 className="w-4 h-4" aria-hidden />
              Unban account
            </AdminButton>
          ) : confirmBan ? (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-2.5">
              <p className="text-xs text-rose-800 mb-2">Ban {member.name}? They are signed out and cannot sign in again.</p>
              <div className="grid grid-cols-2 gap-2">
                <AdminButton size="lg" onClick={() => setConfirmBan(false)} disabled={!!busy}>
                  Cancel
                </AdminButton>
                <AdminButton size="lg" tone="danger" busy={busy === 'ban'} disabled={!!busy} onClick={() => call('ban', '/api/admin/members', { action: 'set_banned', banned: true }, { isBanned: true }, `${member.name} was banned.`)}>
                  Confirm ban
                </AdminButton>
              </div>
            </div>
          ) : (
            <AdminButton size="lg" tone="danger" className="w-full" disabled={!!busy || member.role !== 'member'} onClick={() => setConfirmBan(true)}>
              <Ban className="w-4 h-4" aria-hidden />
              {member.role !== 'member' ? 'Revoke admin access before banning' : 'Ban account'}
            </AdminButton>
          )}
        </section>
      </div>
    </BottomSheet>
  );
}

export function MembersManager({ selfId }: { selfId: string }) {
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [grantName, setGrantName] = useState('');
  const [grantRole, setGrantRole] = useState<'moderator' | 'member'>('moderator');
  const [granting, setGranting] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);

  const load = useCallback(async (q: string) => {
    setError('');
    try {
      const r = await adminFetch<{ members: Member[] }>(`/api/admin/members?q=${encodeURIComponent(q)}`);
      setMembers(r.members);
    } catch (e: any) {
      setError(e.message);
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query, load]);

  /** "Grant Access": resolve the username exactly, then set the role through /api/admin/roles. */
  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = grantName.trim().replace(/^@/, '');
    if (!name) return;
    setGranting(true);
    setError('');
    setFlash('');
    try {
      const r = await adminFetch<{ members: Member[] }>(`/api/admin/members?q=${encodeURIComponent(name)}`);
      const lower = name.toLowerCase();
      const match =
        r.members.find((m) => m.name.toLowerCase() === lower) ||
        r.members.find((m) => (m.displayName || '').toLowerCase() === lower) ||
        (r.members.length === 1 ? r.members[0] : undefined);
      if (!match) throw new Error(r.members.length ? `"${name}" matches several members. Use the exact username.` : `No member named "${name}".`);
      await adminFetch('/api/admin/roles', { userId: match.id, role: grantRole });
      setFlash(grantRole === 'moderator' ? `${match.name} is now a moderator.` : `${match.name}'s admin access was revoked.`);
      setGrantName('');
      load(query.trim());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGranting(false);
    }
  };

  return (
    <div>
      <PageTitle title="Members & Roles" subtitle="Delegate moderator access and manage standing." />

      <form onSubmit={grant} className="mb-4 p-4 rounded-2xl border border-[#ECE8F4] bg-white shadow-2xs space-y-2">
        <label htmlFor="grant-name" className="block text-[11px] font-semibold uppercase tracking-wider text-[#9A92AB]">
          Grant access by username
        </label>
        <input
          id="grant-name"
          value={grantName}
          onChange={(e) => setGrantName(e.target.value)}
          placeholder="e.g. mai_hcmc"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          className="w-full h-10 rounded-xl border border-[#ECE8F4] px-3 text-sm outline-none focus:border-[#8C71F5]"
        />
        <select
          aria-label="Role to grant"
          value={grantRole}
          onChange={(e) => setGrantRole(e.target.value as 'moderator' | 'member')}
          className="w-full h-10 rounded-xl border border-[#ECE8F4] bg-white px-3 text-sm"
        >
          <option value="moderator">Moderator</option>
          <option value="member">Member (revoke access)</option>
        </select>
        <AdminButton type="submit" size="lg" tone="primary" busy={granting} disabled={!grantName.trim()} className="w-full">
          <ShieldPlus className="w-4 h-4" aria-hidden />
          Grant Access
        </AdminButton>
      </form>

      {flash && <Notice kind="success">{flash}</Notice>}
      {error && <Notice kind="error">{error}</Notice>}

      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A92AB]" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or display name"
          aria-label="Search members"
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="search"
          className="w-full h-10 rounded-xl border border-[#ECE8F4] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#8C71F5]"
        />
      </div>
      {!query.trim() && <p className="text-xs text-[#6C637B] mb-2">Showing current staff. Search to find any member.</p>}

      {!members ? (
        <Loading />
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No members found" body="Try a different username or display name." />
      ) : (
        <ul className="rounded-2xl border border-[#ECE8F4] bg-white divide-y divide-[#ECE8F4] overflow-hidden">
          {members.map((m) => {
            const locked = m.role === 'super_admin' || m.id === selfId;
            const body = (
              <>
                <AdminAvatar url={m.avatarUrl} name={m.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#2D264B] truncate flex items-center gap-1">
                    <span className="truncate">{m.name}</span>
                    {m.age !== null && <span className="font-normal text-[#6C637B]">, {m.age}</span>}
                    {m.isVerified && <BadgeCheck className="w-3.5 h-3.5 shrink-0 text-[#8C71F5]" aria-label="Verified" />}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <RolePill role={m.role} />
                    <ReputationBadge score={m.reputation} size="xs" />
                    {m.isBanned && <span className="text-[10px] font-semibold text-rose-600">Banned</span>}
                  </div>
                </div>
              </>
            );
            return (
              <li key={m.id}>
                {locked ? (
                  <div className="flex items-center gap-3 px-3 py-3">
                    {body}
                    <span className="text-[10px] text-[#9A92AB] shrink-0">{m.id === selfId ? 'You' : 'Locked'}</span>
                  </div>
                ) : (
                  <button type="button" onClick={() => setEditing(m)} className="w-full flex items-center gap-3 px-3 py-3 text-left active:bg-[#FAF8FD]">
                    {body}
                    <ChevronRight className="w-4 h-4 text-[#C9C1DA] shrink-0" aria-hidden />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <MemberSheet
          member={editing}
          onClose={() => setEditing(null)}
          onChange={(next, msg) => {
            setMembers((list) => (list || []).map((x) => (x.id === next.id ? next : x)));
            setEditing(next);
            setFlash(msg);
          }}
        />
      )}
    </div>
  );
}

export default MembersManager;
