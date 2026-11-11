import React from 'react';
import { encodeQr, qrSvgPath } from '@/lib/qr';

/** Inline QR code (lib/qr.ts, no dependency). Dark modules in brand ink on white with a quiet zone. */
export function QrCode({
  value,
  size = 96,
  color = '#413B5E',
  label,
  className = '',
}: {
  value: string;
  size?: number;
  color?: string;
  /** Accessible name; defaults to the encoded link. */
  label?: string;
  className?: string;
}) {
  const { d, size: units } = qrSvgPath(encodeQr(value));
  return (
    <svg
      role="img"
      aria-label={label ?? `QR code for ${value}`}
      viewBox={`0 0 ${units} ${units}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={units} height={units} fill="#FFFFFF" />
      <path d={d} fill={color} />
    </svg>
  );
}

export default QrCode;
