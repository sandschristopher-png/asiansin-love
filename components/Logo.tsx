export function Logo({ className = "h-6 w-6", textSize = "text-lg" }: { className?: string; textSize?: string }) {
  return (
    <div className="flex items-center gap-2.5 group">
      {/* Modern AIL Monogram Heart */}
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} transition duration-200 group-hover:scale-105 shrink-0`}
      >
        <defs>
          <linearGradient id="ailGrad" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="45%" stopColor="#6d4aff" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
          <linearGradient id="ailInnerGrad" x1="12" y1="8" x2="24" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ede9fe" />
          </linearGradient>
        </defs>

        {/* Clean Heart Silhouette Base */}
        <path
          d="M18 31.5C17.4 31.5 16.9 31.3 16.5 30.9C14.8 29.3 12.3 27.2 9.9 24.9C5.4 20.6 2 16.4 2 11.6C2 6.3 6.1 2.2 11.4 2.2C14.2 2.2 16.5 3.3 18 5.2C19.5 3.3 21.8 2.2 24.6 2.2C29.9 2.2 34 6.3 34 11.6C34 16.4 30.6 20.6 26.1 24.9C23.7 27.2 21.2 29.3 19.5 30.9C19.1 31.3 18.6 31.5 18 31.5Z"
          fill="url(#ailGrad)"
        />

        {/* Monogram Integration (A, I, L) */}
        {/* The "A" Arch */}
        <path
          d="M18 9L13.2 20.5H15.6L16.7 17.8H19.3L20.4 20.5H22.8L18 9ZM17.3 16L18 13.8L18.7 16H17.3Z"
          fill="url(#ailInnerGrad)"
        />

        {/* The Interlocking "L" Bar anchoring the base */}
        <path
          d="M14.5 22.5H21.5C22.1 22.5 22.5 22.9 22.5 23.5C22.5 24.1 22.1 24.5 21.5 24.5H14.5C13.9 24.5 13.5 24.1 13.5 23.5C13.5 22.9 13.9 22.5 14.5 22.5Z"
          fill="url(#ailInnerGrad)"
        />

        {/* The Central "I" Accent Dot */}
        <circle cx="18" cy="7.2" r="1.1" fill="#ffffff" />
      </svg>

      <span className={`${textSize} font-black tracking-tight text-slate-900 select-none`}>
        asiansin<span className="text-[#6d4aff]">.love</span>
      </span>
    </div>
  )
}
