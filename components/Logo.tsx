export function Logo({ className = "h-8 w-8", textSize = "text-xl" }: { className?: string; textSize?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
        </defs>
        <rect width="36" height="36" rx="10" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
        <path
          d="M18 26.5s-7-4.8-9-8C7 15.2 8 11.5 11.2 10.7c2.2-.5 4.6.4 5.8 2.3 1.2-1.9 3.6-2.8 5.8-2.3 3.2.8 4.2 4.5 2.2 7.8-2 3.2-9 8-9 8z"
          fill="url(#brandGradient)"
        />
        <circle cx="18" cy="8" r="1.5" fill="#f43f5e" />
      </svg>
      <span className={`font-black tracking-tight text-white ${textSize}`}>
        asiansin<span className="text-rose-500">.love</span>
      </span>
    </div>
  )
}
