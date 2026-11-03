'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Ban, BadgeCheck, Search, ShieldPlus, Undo2, Users } from 'lucide-react';
import { ReputationBadge } from '@/components/ReputationBadge';
import { ADMIN_ROLE_LABEL, type AdminRole } from '@/lib/adminRoles';
import { AdminAvatar, AdminButton, EmptyState, Loading, Notice, PageTitle, adminFetch } from '@/components/admin/ui';

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
  super_admin: 'bg-[#2D264B] text-white',
  moderator: 'bg-[#F3EFFC] text-[#6555B8] border border-[#E2DBF0]',
  member: 'bg-[#F9F8FC] text-[#6C637B] border border-[#ECE8F4]',
};

function MemberRow({ member, selfId, onChange }: { member: Member; selfId: string; onChange: (m: Member, msg: string) => void }) {
  const [rep, setRep] = useState(String(member.reputation));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const locked = member.role === 'super_admin' || member.id === selfId;

  useEffect(() => setRep(String(member.reputation)), [member.reputation]);

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

  return (
    <tr className="border-t border-[#ECE8F4] align-middle">
      <td className="py-3 pl-4 pr-2">
        <div className="flex items-center gap-2.5 min-w-[180px]">
          <AdminAvatar url={member.avatarUrl} name={member.name} size={36} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#2D264B] truncate flex items-center gap-1">
              {member.name}
              {member.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-[#8C71F5]" aria-label="Verified" />}
            </p>
            <p className="text-[11px] text-[#6C637B] truncate">
              {[member.age, member.location].filter(Boolean).join(' · ') || 'No details'}
            </p>
            {error && <p className="text-[11px] text-rose-600 mt-0.5">{error}</p>}
          </div>
        </div>
      </td>
      <td className="px-2">
        <div className="flex items-center gap-1.5">
          <ReputationBadge score={member.reputation} size="xs" />
          {!locked && (
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number(rep);
                call('rep', '/api/admin/members', { action: 'set_reputation', score: n }, { reputation: Math.round(n) }, `${member.name}'s reputation set to ${Math.round(n)}%.`);
              }}
            >
              <input
                type="number"
                min={0}
                max={100}
                value={rep}
                onChange={(e) => setRep(e.target.value)}
                aria-label={`Reputation for ${member.name}`}
                className="w-14 rounded-lg border border-[#ECE8F4] px-1.5 py-1 text-xs tabular-nums"
              />
              <AdminButton type="submit" busy={busy === 'rep'} disabled={!!busy || rep === String(member.reputation)} className="!px-2 !py-1">
                Set
              </AdminButton>
            </form>
          )}
        </div>
      </td>
      <td className="px-2">
        {locked ? (
          <span className={`text-xs font-semibold ${member.isVerified ? 'text-[#6555B8]' : 'text-[#9A92AB]'}`}>{member.isVerified ? 'Verified' : 'Unverified'}</span>
        ) : (
          <label className="inline-flex items-center gap-1.5 text-xs text-[#2D264B] cursor-pointer">
            <input
              type="checkbox"
              checked={member.isVerified}
              disabled={!!busy}
              onChange={(e) =>
                call('ver', '/api/admin/members', { action: 'set_verified', verified: e.target.checked }, { isVerified: e.target.checked }, e.target.checked ? `${member.name} is now verified.` : `Removed ${member.name}'s verified badge.`)
              }
              className="accent-[#8C71F5]"
            />
            Verified
          </label>
        )}
      </td>
      <td className="px-2">
        {locked ? (
          <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_PILL[member.role]}`}>
            {ADMIN_ROLE_LABEL[member.role]}
            {member.id === selfId && ' (you)'}
          </span>
        ) : (
          <select
            value={member.role}
            disabled={!!busy || (member.isBanned && member.role === 'member')}
            aria-label={`Role for ${member.name}`}
            onChange={(e) => {
              const role = e.target.value as AdminRole;
              call('role', '/api/admin/roles', { role }, { role }, role === 'moderator' ? `${member.name} is now a moderator.` : `${member.name}'s admin access was revoked.`);
            }}
            className="rounded-lg border border-[#ECE8F4] bg-white px-2 py-1 text-xs"
          >
            <option value="member">Member</option>
            <option value="moderator">Moderator</option>
          </select>
        )}
      </td>
      <td className="px-2 pr-4 text-right">
        {!locked &&
          (member.isBanned ? (
            <AdminButton busy={busy === 'ban'} disabled={!!busy} onClick={() => call('ban', '/api/admin/members', { action: 'set_banned', banned: false }, { isBanned: false }, `${member.name} was unbanned.`)}>
              <Undo2 className="w-3.5 h-3.5" aria-hidden />
              Unban
            </AdminButton>
          ) : (
            <AdminButton
              tone="danger"
              busy={busy === 'ban'}
              disabled={!!busy || member.role !== 'member'}
              title={member.role !== 'member' ? 'Revoke admin access first' : undefined}
              onClick={() => {
                if (window.confirm(`Ban ${member.name}? They are signed out and cannot sign in again.`)) {
                  call('ban', '/api/admin/members', { action: 'set_banned', banned: true }, { isBanned: true }, `${member.name} was banned.`);
                }
              }}
            >
              <Ban className="w-3.5 h-3.5" aria-hidden />
              Ban
            </AdminButton>
          ))}
      </td>
    </tr>
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
      <PageTitle title="Members & Roles" subtitle="Delegate moderator access and manage member standing." />

      <form onSubmit={grant} className="mb-4 rounded-2xl border border-[#ECE8F4] bg-white p-4 flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="grant-name" className="block text-[11px] font-semibold uppercase tracking-wider text-[#9A92AB] mb-1">
            Username
          </label>
          <input
            id="grant-name"
            value={grantName}
            onChange={(e) => setGrantName(e.target.value)}
            placeholder="e.g. mai_hcmc"
            className="w-full rounded-xl border border-[#ECE8F4] px-3 py-2 text-sm outline-none focus:border-[#8C71F5]"
          />
        </div>
        <div>
          <label htmlFor="grant-role" className="block text-[11px] font-semibold uppercase tracking-wider text-[#9A92AB] mb-1">
            Role
          </label>
          <select
            id="grant-role"
            value={grantRole}
            onChange={(e) => setGrantRole(e.target.value as 'moderator' | 'member')}
            className="rounded-xl border border-[#ECE8F4] bg-white px-3 py-2 text-sm"
          >
            <option value="moderator">Moderator</option>
            <option value="member">Member</option>
          </select>
        </div>
        <AdminButton type="submit" tone="primary" busy={granting} disabled={!grantName.trim()} className="!py-2 !text-sm">
          <ShieldPlus className="w-4 h-4" aria-hidden />
          Grant Access
        </AdminButton>
      </form>

      {flash && <Notice kind="success">{flash}</Notice>}
      {error && <Notice kind="error">{error}</Notice>}

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A92AB]" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or display name"
          aria-label="Search members"
          className="w-full rounded-xl border border-[#ECE8F4] bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-[#8C71F5]"
        />
      </div>
      {!query.trim() && <p className="text-xs text-[#6C637B] mb-2">Showing current staff. Search to find any member.</p>}

      {!members ? (
        <Loading />
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No members found" body="Try a different username or display name." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#ECE8F4] bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-[#9A92AB]">
                <th className="py-2.5 pl-4 pr-2 font-semibold">Member</th>
                <th className="px-2 font-semibold">Reputation</th>
                <th className="px-2 font-semibold">Verification</th>
                <th className="px-2 font-semibold">Role</th>
                <th className="px-2 pr-4 font-semibold text-right">Account</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  selfId={selfId}
                  onChange={(next, msg) => {
                    setMembers((list) => (list || []).map((x) => (x.id === next.id ? next : x)));
                    setFlash(msg);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MembersManager;
