import { notFound } from 'next/navigation';
import { getAdminContext } from '@/lib/adminAuth';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

/**
 * Admin Console gate. Anyone who is not staff (moderator / super_admin) - including signed-out
 * visitors - gets the ordinary 404 page, so the console's existence is never disclosed.
 * Every /api/admin/* route re-checks the role server-side.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminContext();
  if (!admin) notFound();

  return (
    <div className="min-h-full bg-[#F9F8FC] text-[#1C1924]">
      <AdminHeader name={admin.name} role={admin.role} />
      <div className="px-4 sm:px-6 py-5 pb-16">{children}</div>
    </div>
  );
}
