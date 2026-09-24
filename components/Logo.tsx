import React from 'react'

interface LogoProps {
  className?: string
  textSize?: string
  showText?: boolean
}

export function Logo({
  className = "h-8 w-8",
  textSize = "text-xl",
  showText = true,
}: LogoProps) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none group">
      {/* Custom Vector Heart & Spark Mark */}
      <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full drop-shadow-[0_2px_10px_rgba(244,63,94,0.35)] transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="ail-grad-primary" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="50%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#9F1239" />
            </linearGradient>
            <linearGradient id="ail-grad-spark" x1="22" y1="2" x2="38" y2="18" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FDA4AF" />
            </linearGradient>
          </defs>

          {/* Primary Heart Body - Overlapping Modern Ribbon Curves */}
          <path
            d="M20 34.5C19.2 34.5 7 26.2 4.6 18.8C2.5 12.3 6.2 5.5 13.2 5.5C16.8 5.5 19.1 7.4 20 8.5C20.9 7.4 23.2 5.5 26.8 5.5C33.8 5.5 37.5 12.3 35.4 18.8C33 26.2 20.8 34.5 20 34.5Z"
            fill="url(#ail-grad-primary)"
          />

          {/* Inner Accent Loop / Depth Highlight */}
          <path
            d="M20 30C19.5 30 10.5 23.5 8.6 17.5C7 12.5 9.8 8.8 14 8.8C17 8.8 19 10.5 20 11.5C21 10.5 23 8.8 26 8.8C30.2 8.8 33 12.5 31.4 17.5C29.5 23.5 20.5 30 20 30Z"
            fill="#09090B"
            fillOpacity="0.35"
          />

          {/* Proprietary 4-Point Spark Accent */}
          <path
            d="M29 3C29 6.5 31.5 9 35 9C31.5 9 29 11.5 29 15C29 11.5 26.5 9 23 9C26.5 9 29 6.5 29 3Z"
            fill="url(#ail-grad-spark)"
          />
        </svg>
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <span className={`font-black tracking-tight text-white ${textSize}`}>
          asiansin<span className="text-rose-500">.love</span>
        </span>
      )}
    </div>
  )
}
