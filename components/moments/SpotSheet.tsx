'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Zap } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { supabaseImage, AVATAR_IMAGE } from '@/lib/images/supabaseImage';
import { directionsUrl, placeQuery } from '@/lib/momentPlace';
import type { MomentItem } from '@/lib/moments';

/**
 * The white sheet a map pin opens (it slides up on transform, like every sheet here): the spot's photo and caption, who
 * posted it, a way to their profile or a Spark, and a one-tap hand-off to Google Maps directions (Apple Maps as the second
 * choice). Detail rows are separated by 1px #F3F4F6 hairlines, the title bar by the sheet's own.
 */
export default function SpotSheet({ moment, onClose, onSpark }: { moment: MomentItem; onClose: () => void; onSpark: (m: MomentItem) => void }) {
  const { t } = useLocale();
  const { author } = moment;
  const query = placeQuery(moment.place ?? '', moment.city);

  return (
    <BottomSheet title={moment.place ?? ''} onClose={onClose}>
      <div className="divide-y divide-[#F3F4F6]">
        <div className="space-y-3 py-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#EAE9F2]/50">
            <Image src={moment.imageUrl} alt={moment.place ?? ''} fill sizes="(max-width: 480px) 100vw, 440px" className="object-cover" />
          </div>
          {moment.caption && <p className="break-words text-sm leading-relaxed text-[#413B5E]">{moment.caption}</p>}
          <p className="flex items-center gap-1.5 text-xs text-slate-600">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#726E97]" aria-hidden />
            <span className="truncate">{moment.city}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 py-4">
          {author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={supabaseImage(author.avatarUrl, AVATAR_IMAGE)}
              alt=""
              width={44}
              height={44}
              loading="lazy"
              decoding="async"
              className="h-11 w-11 shrink-0 rounded-full border border-[#D0CDE1] object-cover"
            />
          ) : (
            <span className="h-11 w-11 shrink-0 rounded-full bg-[#EAE9F2]/50" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[#413B5E]">
              <span className="truncate">
                {author.username}
                {author.age ? `, ${author.age}` : ''}
              </span>
              {author.verified && <VerifiedBadge size="sm" />}
            </p>
            {author.localGuide && (
              <span className="mt-1 inline-flex h-5 items-center rounded-full border border-[#D0CDE1] bg-white px-2 text-[11px] font-semibold text-[#726E97]">
                {t('moments.guideTag')}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 py-4">
          <Link
            href={`/profile/${author.id}`}
            className="flex h-11 items-center justify-center rounded-full border border-[#D0CDE1] bg-white text-sm font-medium text-[#413B5E] transition-colors hover:bg-[#EAE9F2]/40 active:scale-[0.98]"
          >
            {t('moments.spotProfile')}
          </Link>
          {!moment.isMine ? (
            <button
              type="button"
              onClick={() => onSpark(moment)}
              className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#726E97] text-sm font-medium text-white transition-colors hover:bg-[#524E75] active:scale-[0.98]"
            >
              <Zap className="h-4 w-4 fill-current" aria-hidden />
              {t('moments.spotSpark')}
            </button>
          ) : (
            <span aria-hidden />
          )}
        </div>

        <div className="space-y-2 py-4">
          <a
            href={directionsUrl('google', query, 'walk')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-full items-center justify-center rounded-full border border-[#726E97] bg-white text-sm font-medium text-[#726E97] transition-colors hover:bg-[#726E97]/10 active:scale-[0.98]"
          >
            {t('moments.spotDirections')}
          </a>
          <a
            href={directionsUrl('apple', query, 'walk')}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs font-medium text-slate-600 underline underline-offset-4 hover:text-[#726E97]"
          >
            {t('moments.openApple')}
          </a>
        </div>
      </div>
    </BottomSheet>
  );
}
