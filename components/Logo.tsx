export function Logo({ className = "h-6 w-6", textSize = "text-lg" }: { className?: string; textSize?: string }) {
  return (
    <div className="flex items-center gap-2.5 group">
      {/* Geometric AIL Monogram Crest */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} transition duration-200 group-hover:scale-105 shrink-0`}
      >
        <defs>
          <linearGradient id="ailGradientV2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
        </defs>
        {/* Shield Frame */}
        <path
          d="M16 2.5L5 7.5V15C5 22.2 9.8 28.8 16 30.5C22.2 28.8 27 22.2 27 15V7.5L16 2.5Z"
          fill="#1c070c"
          stroke="url(#ailGradientV2)"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        {/* Sharp Interlocking Monogram (A / I / L Fusion) */}
        <path
          d="M16 8L22 19H18.8L16 13.8L13.2 19H10L16 8Z"
          fill="url(#ailGradientV2)"
        />
        <path
          d="M11 20.5H21V22.5H11V20.5Z"
          fill="url(#ailGradientV2)"
        />
        <circle cx="16" cy="25.5" r="1.25" fill="#f43f5e" />
      </svg>

      <span className={`${textSize} font-black tracking-tight text-white select-none`}>
        asiansin<span className="text-rose-500">.love</span>
      </span>
    </div>
  )
}
