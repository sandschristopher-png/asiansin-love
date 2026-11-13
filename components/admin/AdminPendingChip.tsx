'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { adminRoleOf, isStaff } from '@/lib/adminRoles';

/**
 * Count chip shared by the avatar (unread notifications) and the Admin Console rows (pending
 * queues): solid brand purple, rounded-full, soft shadow, no ring. Renders nothing at zero.
 */
export function CountChip({ count, className = '', label }: { count: number; className?: string; label?: string }) {
  if (!count || count <= 0) return null;
  return (
    <span
      aria-label={label ?? `${count} pending`}
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#8574B7] text-white text-[10px] font-semibold leading-none shadow-[0_1px_3px_rgba(65,59,94,0.25)] ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * Pending verifications + photo approvals + open reports (GET /api/admin/pending-count).
 * Only fetched when `enabled` (the caller already knows the member is staff); 0 otherwise.
 */
export function useAdminPendingCount(enabled: boolean, refreshKey?: unknown): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    let cancelled = false;
    fetch('/api/admin/pending-count', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { total: 0 }))
      .then((j) => !cancelled && setCount(Number(j.total) || 0))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled, refreshKey]);
  return count;
}

/** Settings page row: Admin Console with the pending chip. Staff only; renders nothing for members. */
export function AdminConsoleSettingsRow({ label, sub }: { label: string; sub: string }) {
  const [staff, setStaff] = useState(false);
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('admin_role, role, is_admin').eq('id', user.id).maybeSingle();
      if (!cancelled) setStaff(isStaff(adminRoleOf(data)));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const count = useAdminPendingCount(staff);
  if (!staff) return null;
  return (
    <div className="rounded-3xl bg-white border border-[#D0CDE1] p-2 shadow-2xs">
      <Link href="/admin/notifications" className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#E8E6F1]/40 transition cursor-pointer">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white text-[#413B5E]/85 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#413B5E]">{label}</p>
            <p className="text-[11px] text-[#413B5E]/75 truncate">{sub}</p>
          </div>
        </div>
        <span className="flex items-center gap-2 shrink-0">
          <CountChip count={count} />
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </span>
      </Link>
    </div>
  );
}
