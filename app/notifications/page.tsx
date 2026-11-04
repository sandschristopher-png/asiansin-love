import { redirect } from 'next/navigation';

// Activity now lives on the Sparks / Messages tabs; system notices moved to /announcements.
export default function NotificationsPage() {
  redirect('/announcements');
}
