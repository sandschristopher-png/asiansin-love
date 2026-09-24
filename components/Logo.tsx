import React from 'react'

interface LogoProps {
  className?: string
  textSize?: string
  showText?: boolean
}

export function Logo({ className = "h-7 w-7", textSize = "text-base", showText = true }: LogoProps) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      {/* Scaled & Reshaped Minimal Prism Heart */}
      <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Subtle Outer Boundary Gradient */}
          <defs>
            <linearGradient id="prism-left-light" x1="16" y1="5" x2="3" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f43f5e" />
              <stop offset="1" stopColor="#e11d48" />
            </linearGradient>
            <linearGradient id="prism-right-light" x1="16" y1="5" x2="29" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fb7185" />
              <stop offset="1" stopColor="#f43f5e" />
            </linearGradient>
            <linearGradient id="prism-base-deep" x1="16" y1="14" x2="16" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#be123c" />
              <stop offset="1" stopColor="#9f1239" />
            </linearGradient>
          </defs>

          {/* Facet 1: Upper Left Lobe */}
          <polygon
            points="16,13 4,9 4,16 16,13"
            fill="url(#prism-left-light)"
            opacity="0.9"
          />
          <polygon
            points="16,5 8,2 4,9 16,13"
            fill="#e11d48"
          />

          {/* Facet 2: Upper Right Lobe (Catching highlight) */}
          <polygon
            points="16,5 24,2 28,9 16,13"
            fill="url(#prism-right-light)"
          />
          <polygon
            points="16,13 28,9 28,16 16,13"
            fill="#fb7185"
            opacity="0.85"
          />

          {/* Facet 3: Lower Left Taper */}
          <polygon
            points="16,13 4,16 16,28"
            fill="#e11d48"
          />

          {/* Facet 4: Lower Right Taper (Shadow plane creating 3D depth) */}
          <polygon
            points="16,13 28,16 16,28"
            fill="url(#prism-base-deep)"
          />

          {/* Subtle Crisp Edge Lines */}
          <line x1="16" y1="5" x2="16" y2="28" stroke="rgba(255,255,255,0.22)" strokeWidth="0.75" strokeLinecap="round" />
          <line x1="4" y1="16" x2="28" y2="16" stroke="rgba(255,255,255,0.15)" strokeWidth="0.75" />
        </svg>
      </div>

      {showText && (
        <span className={`font-bold tracking-tight text-stone-900 ${textSize}`}>
          asiansin<span className="text-rose-600">.love</span>
        </span>
      )}
    </div>
  )
}
