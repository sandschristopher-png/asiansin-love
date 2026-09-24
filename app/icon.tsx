import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
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
          background: 'transparent',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <polygon points="16,5 8,2 4,9 16,13" fill="#6d4aff" />
          <polygon points="16,13 4,9 4,16 16,13" fill="#9b72cf" opacity="0.9" />
          <polygon points="16,5 24,2 28,9 16,13" fill="#c084fc" />
          <polygon points="16,13 28,9 28,16 16,13" fill="#a855f7" opacity="0.85" />
          <polygon points="16,13 4,16 16,28" fill="#6d4aff" />
          <polygon points="16,13 28,16 16,28" fill="#4c1d95" />
          <line x1="16" y1="5" x2="16" y2="28" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        </svg>
      </div>
    ),
    { ...size }
  )
}