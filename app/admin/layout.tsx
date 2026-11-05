import { notFound } from 'next/navigation';
import { getAdminContext } from '@/lib/adminAuth';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

/**
 * Admin Console gate. Anyone who is not staff (moderator / super_admin) - including signed-out
 * visitors - gets the ordinary 404 page, so the console's existence is never disclosed.
 * Every /api/admin/* route re-checks the role server-side.
 * The role is read from profiles on every request (force-dynamic), never from the session.
 * Renders inside LayoutShell's standard 430px mobile frame, like the rest of the app.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminContext();
  if (!admin) notFound();

  return (
    <div className="flex-1 flex flex-col bg-white text-[#51376D]">
      <AdminHeader name={admin.name} />
      <div className="flex-1 bg-white px-4 py-4 pb-16">{children}</div>
    </div>
  );
}
