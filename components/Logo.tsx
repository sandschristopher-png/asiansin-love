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
      {/* Proprietary AIL Monogram Crest */}
      <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full drop-shadow-[0_2px_12px_rgba(244,63,94,0.4)] transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="ail-linear-glow" x1="6" y1="4" x2="38" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="45%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#BE123C" />
            </linearGradient>
            <linearGradient id="ail-spark-glow" x1="20" y1="2" x2="24" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FECDD3" />
            </linearGradient>
          </defs>

          {/* Outer Monogram Heart Frame (A-ribbon contours) */}
          <path
            d="M22 38.5C21.3 38.5 7.5 28.6 5.2 20.2C3.1 12.8 7.2 6.5 14.8 6.5C18.6 6.5 20.9 8.6 22 9.8C23.1 8.6 25.4 6.5 29.2 6.5C36.8 6.5 40.9 12.8 38.8 20.2C36.5 28.6 22.7 38.5 22 38.5Z"
            stroke="url(#ail-linear-glow)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Integrated 'I' Center Core with Heart V-Intersection */}
          <path
            d="M22 13V26"
            stroke="url(#ail-linear-glow)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Integrated 'A' Crossbar flowing smoothly into the 'L' base cradle */}
          <path
            d="M13 23.5H27C29.2 23.5 30.5 25.5 29.5 28L28.2 30.8C27 33.2 24.5 35 22 35"
            stroke="url(#ail-linear-glow)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.85"
          />

          {/* Radiant 4-point Spark Star topping the 'I' */}
          <path
            d="M22 2C22 5 24 6.5 26.5 6.5C24 6.5 22 8 22 11C22 8 20 6.5 17.5 6.5C20 6.5 22 5 22 2Z"
            fill="url(#ail-spark-glow)"
          />
        </svg>
      </div>

      {/* Modern Wordmark */}
      {showText && (
        <span className={`font-black tracking-tight text-white ${textSize}`}>
          asiansin<span className="text-rose-500">.love</span>
        </span>
      )}
    </div>
  )
}
