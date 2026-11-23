import type { ReactNode } from 'react';

/**
 * A lightweight Google Pixel bezel drawn with CSS only (no mockup image): a thin matte dark frame, a punch-hole camera at the
 * top centre, the power and volume buttons on the right edge, rounded screen corners and a soft ambient shadow.
 * It fills the width of its parent, and every measurement is a percentage of that width, so it scales without breakpoints.
 * The screen takes any children; the screenshots are 390x844, so the screen keeps that ratio.
 */
export function PixelDeviceFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative w-full ${className}`}>
      {/* Side buttons sit behind the frame, so only their edge shows. */}
      <span aria-hidden className="absolute -right-[1.1%] top-[17%] h-[6.5%] w-[2.2%] rounded-r-[2px] bg-[#2B2A33]" />
      <span aria-hidden className="absolute -right-[1.1%] top-[27%] h-[12%] w-[2.2%] rounded-r-[2px] bg-[#2B2A33]" />
      <div
        className="relative rounded-[2.4rem] bg-[#17161C] p-[3.4%] shadow-[0_28px_44px_-20px_rgba(65,59,94,0.45),0_8px_16px_-10px_rgba(65,59,94,0.3)] ring-1 ring-black/40"
      >
        <div className="relative aspect-[390/844] w-full overflow-hidden rounded-[28px] bg-[#FAF9FC]">
          {children}
          {/* Punch-hole camera */}
          <span aria-hidden className="absolute left-1/2 top-[1.6%] h-[2.6%] w-[4.9%] -translate-x-1/2 rounded-full bg-[#0B0B0F] ring-[2px] ring-[#17161C]" />
        </div>
      </div>
    </div>
  );
}

export default PixelDeviceFrame;
