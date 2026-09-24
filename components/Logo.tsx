import React from 'react'

interface LogoProps {
  className?: string
  textSize?: string
  showText?: boolean
}

export function Logo({ className = "h-7 w-7", textSize = "text-base", showText = true }: LogoProps) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          <defs>
            <linearGradient id="proton-light" x1="16" y1="5" x2="3" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9b72cf" />
              <stop offset="1" stopColor="#6d4aff" />
            </linearGradient>
            <linearGradient id="proton-bright" x1="16" y1="5" x2="29" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#c084fc" />
              <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id="proton-deep" x1="16" y1="14" x2="16" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#5b21b6" />
              <stop offset="1" stopColor="#4c1d95" />
            </linearGradient>
          </defs>

          {/* Facet 1: Upper Left */}
          <polygon points="16,13 4,9 4,16 16,13" fill="url(#proton-light)" opacity="0.9" />
          <polygon points="16,5 8,2 4,9 16,13" fill="#6d4aff" />

          {/* Facet 2: Upper Right (Highlight) */}
          <polygon points="16,5 24,2 28,9 16,13" fill="url(#proton-bright)" />
          <polygon points="16,13 28,9 28,16 16,13" fill="#c084fc" opacity="0.85" />

          {/* Facet 3: Lower Left */}
          <polygon points="16,13 4,16 16,28" fill="#6d4aff" />

          {/* Facet 4: Lower Right (Deep Indigo Shadow) */}
          <polygon points="16,13 28,16 16,28" fill="url(#proton-deep)" />

          {/* Facet Accent Creases */}
          <line x1="16" y1="5" x2="16" y2="28" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75" strokeLinecap="round" />
          <line x1="4" y1="16" x2="28" y2="16" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />
        </svg>
      </div>

      {showText && (
        <span className={`font-black tracking-tight text-[#1e192b] ${textSize}`}>
          asiansin<span className="text-[#6d4aff]">.love</span>
        </span>
      )}
    </div>
  )
}