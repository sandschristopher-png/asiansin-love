import { redirect } from 'next/navigation';

// /admin has no dashboard of its own; middleware.ts already restricts /admin/* to admins.
export default function AdminIndexPage() {
  redirect('/admin/verifications');
}
