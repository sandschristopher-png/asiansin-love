import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 48, height: 48 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: '12px',
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 32 32"
          fill="none"
        >
          {/* Facets */}
          <polygon points="16,5 8,2 4,9 16,13" fill="#e11d48" />
          <polygon points="16,13 4,9 4,16 16,13" fill="#f43f5e" />
          <polygon points="16,5 24,2 28,9 16,13" fill="#fb7185" />
          <polygon points="16,13 28,9 28,16 16,13" fill="#fda4af" />
          <polygon points="16,13 4,16 16,28" fill="#e11d48" />
          <polygon points="16,13 28,16 16,28" fill="#be123c" />
          <line x1="16" y1="5" x2="16" y2="28" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
