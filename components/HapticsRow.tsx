'use client';

import React, { useEffect, useState } from 'react';
import { Vibrate } from 'lucide-react';
import { hapticTap, hapticsEnabled, hapticsSupported, setHapticsEnabled } from '@/lib/utils/haptics';

/** Settings row: device-local haptic feedback toggle (lib/utils/haptics.ts). */
export function HapticsRow() {
  const [on, setOn] = useState(true);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setOn(hapticsEnabled());
    setSupported(hapticsSupported());
  }, []);

  const toggle = () => {
    const next = !on;
    setHapticsEnabled(next);
    setOn(next);
    if (next) hapticTap();
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#F8F7FA] transition">
      <div className="flex items-center gap-3 pr-4">
        <div className="w-8 h-8 rounded-xl bg-[#F8F7FA] text-[#524B5E] flex items-center justify-center shrink-0">
          <Vibrate className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#1C1924]">Haptic feedback</p>
          <p className="text-[11px] text-[#6C637B]">
            {supported ? 'Gentle vibrations on taps, sends and photos' : 'Not supported on this device'}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Haptic feedback"
        disabled={!supported}
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${on ? 'bg-[#6555B8]' : 'bg-[#DDD7E5]'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default HapticsRow;
