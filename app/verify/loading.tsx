import { VerifySkeleton } from '@/components/skeletons/Skeletons';

/** Shown the instant this route is tapped, before its page code and data arrive (same shapes as the real screen). */
export default function Loading() {
  return <VerifySkeleton />;
}
