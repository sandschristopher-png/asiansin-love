import { Lock } from 'lucide-react';
import { getAdminContext } from '@/lib/adminAuth';
import { MembersManager } from '@/components/admin/MembersManager';
import { ACCOUNT_OWNER_ID, isAccountOwner } from '@/lib/adminRoles';

export const dynamic = 'force-dynamic';

/** Members & Roles: super admins only (the API routes enforce the same rule). */
export default async function AdminMembersPage() {
  const admin = await getAdminContext();
  if (admin?.role !== 'super_admin') {
    return (
      <div className="rounded-2xl border border-[#ECE8F4] bg-white py-14 px-6 text-center">
        <Lock className="w-8 h-8 mx-auto text-[#8C71F5]" />
        <p className="mt-3 font-semibold text-[#2D264B]">Super admin only</p>
        <p className="mt-1 text-sm text-[#6C637B]">Member management and role delegation are limited to super admins.</p>
      </div>
    );
  }
  return <MembersManager selfId={admin.userId} ownerId={ACCOUNT_OWNER_ID} isOwner={isAccountOwner(admin.userId)} />;
}
