import React from 'react';

export function Logo({ className = "h-6 w-6", textSize = "text-xl" }: { className?: string; textSize?: string }) {
  return (
    <div className="flex items-center gap-2.5 group select-none">
      {/* Sleek Gradient Heart Glyph */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} transition-transform duration-200 group-hover:scale-105 shrink-0`}
      >
        <defs>
          <linearGradient id="ailGradient" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C6BE8" />
            <stop offset="50%" stopColor="#6555B8" />
            <stop offset="100%" stopColor="#4E3E9E" />
          </linearGradient>
        </defs>
        <path
          d="M16 27.5C15.6 27.5 15.2 27.3 14.9 27C10.5 22.8 3.5 16.4 3.5 10.8C3.5 6.2 7.1 2.5 11.7 2.5C14.1 2.5 16 3.7 16 3.7C16 3.7 17.9 2.5 20.3 2.5C24.9 2.5 28.5 6.2 28.5 10.8C28.5 16.4 21.5 22.8 17.1 27C16.8 27.3 16.4 27.5 16 27.5Z"
          fill="url(#ailGradient)"
        />
        {/* Subtle Inner Sparkle Dot */}
        <circle cx="16" cy="11.5" r="2.2" fill="#FFFFFF" fillOpacity="0.92" />
      </svg>

      <span className={`${textSize} font-sans leading-none  flex items-baseline gap-1`}>
        <span className="font-medium text-[#1C1924]">Asians</span>
        <span className="font-normal text-[#756D82] text-[0.88em]">in</span>
        <span className="font-medium text-[#6555B8]">Love</span>
      </span>
    </div>
  );
}

