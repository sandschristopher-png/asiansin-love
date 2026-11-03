import React from 'react';

type SparkingHeartProps = Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
  size?: number | string;
};

/**
 * "Sparking Heart": the Sparks icon (bottom nav, Sparks tab, profile and notifications).
 * A symmetric heart centered in the 24px box, so it sits on the same optical center as the other
 * nav icons, plus one small solid 4-point star detached from the right shoulder.
 * Lucide-compatible props (className, strokeWidth, size); `fill-*` classes fill the heart only.
 */
export function SparkingHeart({ size = 24, strokeWidth = 2, className, ...rest }: SparkingHeartProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {/* Lucide heart scaled to 84% around the box center (12, 12.4). */}
      <g transform="translate(1.92 2.38) scale(0.84)">
        <path
          vectorEffect="non-scaling-stroke"
          d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        />
      </g>
      {/* Solid 4-point star, ~2px clear of the heart's right shoulder. */}
      <path
        d="M21 0.9 L21.7 2.3 L23.1 3 L21.7 3.7 L21 5.1 L20.3 3.7 L18.9 3 L20.3 2.3 Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export default SparkingHeart;
