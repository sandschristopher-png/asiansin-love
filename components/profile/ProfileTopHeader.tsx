"use client";
import { useRouter } from "next/navigation";

export function ProfileTopHeader({ targetUserId, targetUserName }: { targetUserId: string; targetUserName: string }) {
  const router = useRouter();
  const onBack = () => router.back();

  return (
    <div className="fixed top-0 inset-x-0 z-30 mx-auto max-w-md pointer-events-none p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="pointer-events-auto h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-md flex items-center justify-center active:scale-95 transition"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button
          aria-label="More options"
          className="pointer-events-auto h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-md flex items-center justify-center active:scale-95 transition"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
        </button>
      </div>
    </div>
  );
}