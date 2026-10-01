import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

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
          background: 'linear-gradient(135deg, #7A69D6 0%, #52449E 100%)',
          borderRadius: 8,
          color: '#FFFFFF',
          fontSize: 21,
          fontWeight: 800,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '-1.5px',
          paddingBottom: 3,
          paddingRight: 1,
        }}
      >
        a.
      </div>
    ),
    { ...size }
  );
}
