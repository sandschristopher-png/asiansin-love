import React from "react";
import { Check } from "lucide-react";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Adds the "Selfie-Verified" label inside the badge. */
  showText?: boolean;
}

const sizeConfig = {
  sm: { pill: "px-1 py-0.5 gap-0.5", icon: "w-2.5 h-2.5", text: "text-[10px]" },
  md: { pill: "px-1.5 py-0.5 gap-1", icon: "w-3 h-3", text: "text-[10px]" },
  lg: { pill: "px-1.5 py-1 gap-1", icon: "w-3.5 h-3.5", text: "text-[10px]" },
};

/**
 * Selfie-verified member: the standard micro-badge (soft rounded rectangle, light purple tint,
 * never a pill) with a checkmark, shown beside usernames on Discover cards, chat headers and
 * profiles. Label is title-case "Selfie-Verified". Verification is free for every member.
 */
export default function VerifiedBadge({ size = "md", className = "", showText = false }: VerifiedBadgeProps) {
  const s = sizeConfig[size] || sizeConfig.md;
  return (
    <span
      className={`inline-flex items-center shrink-0 rounded-md bg-[#8574B7]/15 text-[#8574B7] font-semibold leading-none select-none ${s.pill} ${className}`}
      title="Selfie verified member"
      aria-label="Verified member"
    >
      <Check className={s.icon} strokeWidth={3} aria-hidden />
      {showText && <span className={`${s.text} tracking-tight`}>Selfie-Verified</span>}
    </span>
  );
}
