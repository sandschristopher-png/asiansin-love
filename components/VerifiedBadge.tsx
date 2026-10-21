import React from "react";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

const sizeConfig = {
  sm: { icon: "w-3.5 h-3.5", box: "w-3.5 h-3.5", text: "text-[10px]" },
  md: { icon: "w-4 h-4", box: "w-4 h-4", text: "text-xs" },
  lg: { icon: "w-5 h-5", box: "w-5 h-5", text: "text-sm" },
};

export default function VerifiedBadge({
  size = "md",
  className = "",
  showText = false,
}: VerifiedBadgeProps) {
  const currentSize = sizeConfig[size] || sizeConfig.md;

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium select-none ${className}`}
      title="Selfie Verified Member"
      aria-label="Verified Member"
    >
      <span className={`relative flex items-center justify-center shrink-0 ${currentSize.box}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`${currentSize.icon} text-[#6555B8] drop-shadow-sm`}
          aria-hidden="true"
        >
          <path
            d="M12 2L14.7 4.9L18.6 4.3L19.9 8.1L23.4 9.9L22.6 13.9L24 17.5L20.6 19.6L19.6 23.5L15.6 23.2L12.9 26L10.3 23.2L6.3 23.5L5.3 19.6L1.9 17.5L3.3 13.9L2.5 9.9L6 8.1L7.3 4.3L11.2 4.9L12 2Z"
            fill="currentColor"
            transform="scale(0.8) translate(3, 1.5)"
          />
          <path
            d="M9.5 12.5L11.2 14.2L15 9.8"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showText && (
        <span className={`${currentSize.text} text-[#6555B8] font-medium tracking-tight`}>
          Verified
        </span>
      )}
    </span>
  );
}