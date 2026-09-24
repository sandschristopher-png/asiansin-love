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
          <linearGradient id="ailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
        </defs>
        {/* Crest Shield Contour */}
        <path
          d="M16 2L4 7V15C4 22.5 9.1 29.4 16 31C22.9 29.4 28 22.5 28 15V7L16 2Z"
          fill="#18181b"
          stroke="url(#ailGradient)"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        {/* Sharp Interlocking Monogram (A / I / L Fusion) */}
        <path
          d="M16 9L21.5 19H18.5L16 14.5L13.5 19H10.5L16 9Z"
          fill="url(#ailGradient)"
        />
        <path
          d="M11 20.5H21V22.5H11V20.5Z"
          fill="url(#ailGradient)"
        />
        <circle cx="16" cy="25" r="1.25" fill="#f43f5e" />
      </svg>

      <span className={`${textSize} font-black tracking-tight text-white select-none`}>
        asiansin<span className="text-rose-500">.love</span>
      </span>
    </div>
  )
}
