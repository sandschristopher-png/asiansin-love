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
      <div className="rounded-2xl border border-[#D5C6EC] bg-white py-14 px-6 text-center">
        <Lock className="w-8 h-8 mx-auto text-[#72519A]" />
        <p className="mt-3 font-semibold text-[#51376D]">Super admin only</p>
        <p className="mt-1 text-sm text-[#51376D]/75">Member management and role delegation are limited to super admins.</p>
      </div>
    );
  }
  return <MembersManager selfId={admin.userId} ownerId={ACCOUNT_OWNER_ID} isOwner={isAccountOwner(admin.userId)} />;
}
