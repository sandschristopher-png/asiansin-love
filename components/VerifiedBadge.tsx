import React from "react";
import { Check } from "lucide-react";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Adds the "Verified" label inside the pill. */
  showText?: boolean;
}

const sizeConfig = {
  sm: { pill: "h-4 px-1 gap-0.5", icon: "w-2.5 h-2.5", text: "text-[9.5px]" },
  md: { pill: "py-0.5 px-2.5 gap-1.5", icon: "w-3 h-3", text: "text-xs" },
  lg: { pill: "h-6 px-2 gap-1", icon: "w-3.5 h-3.5", text: "text-xs" },
};

/**
 * Selfie-verified member: hairline purple pill with a checkmark, shown beside verified usernames
 * on Discover cards, chat headers and profiles. Verification is free for every member.
 */
export default function VerifiedBadge({ size = "md", className = "", showText = false }: VerifiedBadgeProps) {
  const s = sizeConfig[size] || sizeConfig.md;
  return (
    <span
      className={`inline-flex items-center shrink-0 rounded-full border border-[#D0CDE1] bg-white bg-[linear-gradient(rgba(232,230,241,0.5),rgba(232,230,241,0.5))] shadow-brand-sm text-[#665D96] font-semibold leading-none select-none ${s.pill} ${className}`}
      title="Selfie verified member"
      aria-label="Verified member"
    >
      <Check className={s.icon} strokeWidth={3} aria-hidden />
      {showText && <span className={`${s.text} tracking-tight`}>Verified</span>}
    </span>
  );
}
