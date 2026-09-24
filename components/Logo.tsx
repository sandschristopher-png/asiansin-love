export function Logo({ className = "h-6 w-6", textSize = "text-lg" }: { className?: string; textSize?: string }) {
  return (
    <div className="flex items-center gap-2.5 group">
      {/* Faceted / Low-Poly Angled Heart */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} transition duration-200 group-hover:scale-105 shrink-0`}
      >
        {/* Left Upper Lobe Facets */}
        <path d="M16 11L9 4L3 8L6 15L16 11Z" fill="#9333ea" />
        <path d="M3 8L9 4L16 11H8L3 8Z" fill="#a855f7" opacity="0.9" />

        {/* Right Upper Lobe Facets */}
        <path d="M16 11L23 4L29 8L26 15L16 11Z" fill="#7c3aed" />
        <path d="M29 8L23 4L16 11H24L29 8Z" fill="#8b5cf6" opacity="0.9" />

        {/* Central Facet Cleft */}
        <path d="M16 11L9 4L16 2L23 4L16 11Z" fill="#c084fc" opacity="0.8" />

        {/* Mid Torso Facets */}
        <path d="M6 15L16 11L16 20L6 15Z" fill="#6d4aff" />
        <path d="M26 15L16 11L16 20L26 15Z" fill="#581c87" />

        {/* Bottom Point / Angled Taper */}
        <path d="M6 15L16 20L16 30L6 15Z" fill="#4c1d95" />
        <path d="M26 15L16 20L16 30L26 15Z" fill="#3b0764" />

        {/* Prismatic Shimmer Facets */}
        <path d="M16 11L11 8L16 2L16 11Z" fill="#e9d5ff" opacity="0.4" />
        <path d="M16 20L11 15L16 11L16 20Z" fill="#c084fc" opacity="0.3" />
      </svg>

      <span className={`${textSize} font-black tracking-tight text-slate-900 select-none`}>
        asiansin<span className="text-[#6d4aff]">.love</span>
      </span>
    </div>
  )
}
