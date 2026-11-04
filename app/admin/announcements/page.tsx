import { AnnouncementsManager } from '@/components/admin/AnnouncementsManager';

export const dynamic = 'force-dynamic';

/** Broadcast announcements. Staff only: app/admin/layout.tsx 404s everyone else, and every
 *  /api/admin/announcements call re-checks the role server-side. */
export default function AdminAnnouncementsPage() {
  return <AnnouncementsManager />;
}
