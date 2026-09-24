export function Logo({ className = "h-6 w-6", textSize = "text-lg" }: { className?: string; textSize?: string }) {
  return (
    <div className="flex items-center gap-2 group">
      {/* Purple Angled / Faceted Heart */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} transition duration-200 group-hover:scale-105 shrink-0`}
      >
        <path d="M16 28L6 16L16 6L26 16L16 28Z" fill="#7c3aed" />
        <path d="M16 6L6 16H16V6Z" fill="#9333ea" />
        <path d="M16 6V16H26L16 6Z" fill="#a855f7" />
        <path d="M6 16L16 28V16H6Z" fill="#6d4aff" />
        <path d="M26 16L16 28V16H26Z" fill="#581c87" />
        <path d="M6 16L11 9L16 16H6Z" fill="#c084fc" opacity="0.6" />
        <path d="M26 16L21 9L16 16H26Z" fill="#d8b4fe" opacity="0.6" />
      </svg>

      <span className={`${textSize} font-black tracking-tight text-slate-900 select-none`}>
        asiansin<span className="text-[#6d4aff]">.love</span>
      </span>
    </div>
  )
}
