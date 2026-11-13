'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { BadgeCheck, Heart, MessageCircle } from 'lucide-react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { hapticLight } from '@/lib/haptics';

/** Sample cards: brand illustrations, not photos of real people (no fake members). */
const SAMPLES = [
  { id: 'a', name: 'Mai', age: 26, city: 'Manila', src: '/hero-woman.webp' },
  { id: 'b', name: 'Ploy', age: 24, city: 'Bangkok', src: '/intention.webp' },
] as const;

const CITY_CHIPS = ['Manila', 'Cebu', 'Bangkok', 'Ho Chi Minh City'];

/**
 * Floating phone with a miniature Discover feed. Gentle idle float; on a mouse, tilts toward the
 * pointer (spring). Spark / Message respond to tap. Labelled as a preview with sample profiles.
 */
export function PhonePreview() {
  const { m } = useLocale();
  const p = m.landing.preview;
  const [sparked, setSparked] = useState<Record<string, boolean>>({});
  const [city, setCity] = useState(CITY_CHIPS[0]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 18 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), { stiffness: 150, damping: 18 });

  return (
    <figure className="w-full flex flex-col items-center" aria-label={p.label}>
      <div
        className="[perspective:1000px]"
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse') return;
          const r = e.currentTarget.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width - 0.5);
          py.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onPointerLeave={() => {
          px.set(0);
          py.set(0);
        }}
      >
        <motion.div
          style={{ rotateX, rotateY }}
          animate={{ y: [0, -8, 0] }}
          transition={{ y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
          className="w-[264px] max-w-full rounded-[2.5rem] border-[6px] border-[#413B5E] bg-white shadow-[0_30px_60px_-20px_rgba(65,59,94,0.35)] overflow-hidden will-change-transform"
        >
          {/* Status notch */}
          <div className="flex justify-center pt-2">
            <span className="h-1.5 w-16 rounded-full bg-[#413B5E]/15" />
          </div>
          <div className="px-3 pt-2 pb-3">
            <div className="flex items-center justify-between">
              <span className="font-brand text-[15px] font-semibold text-[#413B5E]">
                Meet in <span className="text-[#8574B7]">Asia</span>
              </span>
              <span className="w-6 h-6 rounded-full bg-[#F3F0FF]" aria-hidden />
            </div>
            <div className="mt-2 flex gap-1.5" aria-hidden>
              {[p.all, p.online, p.nearMe].map((label, i) => (
                <span
                  key={label}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${i === 0 ? 'bg-[#8574B7] text-white' : 'border border-[#D0CDE1] text-[#413B5E]'}`}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar [scrollbar-width:none]">
              {CITY_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] transition-colors ${
                    city === c ? 'bg-[#F3F0FF] text-[#8574B7] font-semibold' : 'text-[#413B5E]/70'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {SAMPLES.map((s) => {
                const on = !!sparked[s.id];
                return (
                  <div key={s.id} className="rounded-2xl border border-[#D0CDE1] overflow-hidden bg-white">
                    <div className="relative aspect-square bg-[#F3F0FF]">
                      <Image src={s.src} alt="" fill sizes="120px" className="object-contain" />
                      <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-[#8574B7]">
                        <BadgeCheck className="w-2.5 h-2.5" aria-hidden />
                        {p.verified}
                      </span>
                    </div>
                    <div className="px-2 pt-1.5 pb-2">
                      <p className="text-[11px] font-semibold text-[#413B5E] leading-tight">
                        {s.name}, {s.age}
                      </p>
                      <p className="text-[10px] text-[#413B5E]/70 leading-tight">{s.city}</p>
                      <div className="mt-1.5 flex gap-1.5">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.85 }}
                          whileHover={{ scale: 1.08 }}
                          onClick={() => {
                            hapticLight();
                            setSparked((prev) => ({ ...prev, [s.id]: !prev[s.id] }));
                          }}
                          aria-pressed={on}
                          aria-label={on ? p.sparked : p.spark}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                            on ? 'bg-[#8574B7] text-white' : 'bg-[#F3F0FF] text-[#8574B7]'
                          }`}
                        >
                          <Heart className="w-3.5 h-3.5" fill={on ? 'currentColor' : 'none'} aria-hidden />
                        </motion.button>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.85 }}
                          whileHover={{ scale: 1.08 }}
                          aria-label={p.message}
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-[#F3F0FF] text-[#8574B7]"
                        >
                          <MessageCircle className="w-3.5 h-3.5" aria-hidden />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
      <figcaption className="mt-3 text-[11px] text-slate-600">{p.sample}</figcaption>
    </figure>
  );
}

export default PhonePreview;
