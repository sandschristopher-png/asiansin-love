"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileTopHeader({
  targetUserId,
  targetUserName,
}: {
  targetUserId: string;
  targetUserName: string;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const onBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/discover");
    }
  };

  return (
    <>
      {/* Frosted white control pills — sit below Navbar, no collision */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="pointer-events-auto h-9 w-9 rounded-full bg-white/85 backdrop-blur-md border border-black/5 shadow-sm text-[#1C1924] flex items-center justify-center active:scale-95 transition"
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="More options"
          className="pointer-events-auto h-9 w-9 rounded-full bg-white/85 backdrop-blur-md border border-black/5 shadow-sm text-[#1C1924] flex items-center justify-center active:scale-95 transition"
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <circle cx="12" cy="19" r="1.7" />
          </svg>
        </button>
      </div>

      {/* Options bottom sheet */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-full max-w-md p-4 pb-6 rounded-t-3xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
            <div className="space-y-1">
              <button
                onClick={() => setMenuOpen(false)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-[#1C1924]"
              >
                Report Profile
              </button>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-[#1C1924]"
              >
                Block User
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (typeof navigator !== "undefined" && navigator.share) {
                    navigator.share({
                      title: `${targetUserName} on asiansin.love`,
                      url: typeof window !== "undefined" ? window.location.href : "",
                    }).catch(() => {});
                  }
                }}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-[#1C1924]"
              >
                Share Profile
              </button>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="mt-3 w-full py-3 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}