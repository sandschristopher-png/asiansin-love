"use client";

export interface ProfileHighlightRow {
  tag_id: string;
  highlight_story?: string | null;
  interest_tags?: { label?: string | null; icon?: string | null } | null;
}

export function ProfileHighlights({
  highlights,
  viewerInterests,
  targetUserName,
}: {
  highlights: ProfileHighlightRow[];
  viewerInterests: string[];
  targetUserName: string;
}) {
  if (!highlights || highlights.length === 0) return null;

  const shared = highlights
    .map((h) => h.interest_tags?.label || "")
    .filter((label) =>
      label && viewerInterests.some((v) => v.toLowerCase() === label.toLowerCase())
    );

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h2
          className="text-xs font-bold uppercase tracking-wider text-[#1C1924]"
          style={{ fontFamily: "var(--font-brand)" }}
        >
          Highlights
        </h2>
        {shared.length > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-[#6555b8] text-white text-[11px] font-bold shadow-2xs">
            You both love {shared.length > 1 ? shared.slice(0, 2).join(", ") : shared[0]}
          </span>
        )}
      </div>

      <div className="space-y-2.5 pt-1">
        {highlights.map((h) => {
          const label = h.interest_tags?.label || "Interest";
          const icon = h.interest_tags?.icon || "\u2728";
          return (
            <div key={h.tag_id} className="p-3 rounded-2xl bg-[#FAF8FD] border border-[#DDD7E5]/70">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#F3EFFC] text-[#6555b8] flex items-center justify-center text-xs">
                  {icon}
                </span>
                <span className="text-xs font-bold text-[#1C1924]">{label}</span>
                {shared.some((s) => s.toLowerCase() === label.toLowerCase()) && (
                  <span className="text-[10px] font-semibold text-[#6555b8]">shared</span>
                )}
              </div>
              {h.highlight_story && (
                <p className="mt-1.5 text-xs leading-relaxed text-[#524B5E] italic">
                  &ldquo;{h.highlight_story}&rdquo;
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}