'use client';

import React, { useEffect, useState } from 'react';
import { Vibrate } from 'lucide-react';
import { hapticTap, hapticsEnabled, hapticsSupported, setHapticsEnabled } from '@/lib/utils/haptics';
import { Switch } from '@/components/ui/Switch';

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
    <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#E8DFF5]/40 transition">
      <div className="flex items-center gap-3 pr-4">
        <div className="w-8 h-8 rounded-xl bg-white text-[#51376D]/85 flex items-center justify-center shrink-0">
          <Vibrate className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#51376D]">Haptic feedback</p>
          <p className="text-[11px] text-[#51376D]/75">
            {supported ? 'Gentle vibrations on taps, sends and photos' : 'Not supported on this device'}
          </p>
        </div>
      </div>
      <Switch on={on} onClick={toggle} label="Haptic feedback" disabled={!supported} />
    </div>
  );
}

export default HapticsRow;
