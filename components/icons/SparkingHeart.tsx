import React from 'react';

type SparkingHeartProps = Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
  size?: number | string;
};

/**
 * "Sparking Heart": the Spark action icon. A heart outline with three short spark rays at its
 * upper-right. Lucide-compatible props (className, strokeWidth, size), so it drops in where
 * `Zap` was used; `fill-*` classes fill the heart, the rays stay strokes.
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
      {/* Lucide heart, scaled down toward the lower-left to leave room for the sparks. */}
      <g transform="translate(0.6 3.4) scale(0.82)">
        <path
          vectorEffect="non-scaling-stroke"
          d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        />
      </g>
      <path fill="none" d="M20.4 1.4v2.2" />
      <path fill="none" d="M22.6 5.3h-2.2" />
      <path fill="none" d="M22.3 2.1l-1.3 1.3" />
    </svg>
  );
}

export default SparkingHeart;
