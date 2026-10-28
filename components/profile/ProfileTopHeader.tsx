"use client";
import { useState } from "react";

export function ProfileTopHeader({
  targetUserId,
  targetUserName,
}: {
  targetUserId: string;
  targetUserName: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Expose setter to parent via window or prop - for now, we'll use a custom event
  // Better: pass down setProfileMenuOpen as prop, but for simplicity we'll use custom event
  return (
    <>
      {/* Trigger hidden button to open menu - parent will listen */}
      <button
        id="open-profile-menu"
        className="hidden"
        onClick={() => setMenuOpen(true)}
      />
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