import { PublicProfileSkeleton } from '@/components/skeletons/Skeletons';

/**
 * Shown the instant a member's profile is tapped. It replaces the shared /profile loading screen (which has
 * a header block this page does not) with the exact frame the page itself uses while it loads.
 */
export default function Loading() {
  return <PublicProfileSkeleton />;
}
