import React from 'react';

/**
 * Ice-blue accent test (pure styling, light mode only). Two small pieces:
 *
 *   IceFrame   a 3px pastel gradient frame (#DCEBFF -> #E8E3F6 -> #F5F3FB) around a crisp white card. Decorative:
 *              never put it on a button or link, and keep the inner card white.
 *   IceNotice  the calm pill for "Upgrades opening shortly": ice wash #EBF3FF, muted blue text #3B66A8 (5.1:1).
 *
 * Primary buttons, links and active states stay brand purple (#8574B7). To revert the test, replace <IceFrame>
 * with its children and <IceNotice> with a plain paragraph; nothing else depends on them.
 */
export function IceFrame({
  children,
  className = '',
  radius = '1rem',
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  /** Corner radius of the inner card; the frame adds its 3px on top so the curves stay concentric. */
  radius?: string;
}) {
  return (
    <div
      {...rest}
      style={{ borderRadius: `calc(${radius} + 3px)`, ...style }}
      className={`bg-[linear-gradient(135deg,#DCEBFF_0%,#E8E3F6_50%,#F5F3FB_100%)] p-[3px] ${className}`}
    >
      {children}
    </div>
  );
}

export function IceNotice({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      role="status"
      className={`mx-auto w-fit max-w-full rounded-full border border-[#DCEBFF] bg-[#EBF3FF] px-3 py-1 text-center text-[11px] font-semibold leading-snug text-[#3B66A8] ${className}`}
    >
      {children}
    </p>
  );
}
