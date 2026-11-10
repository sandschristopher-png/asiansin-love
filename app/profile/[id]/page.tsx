'use client';

import dynamic from 'next/dynamic';
import VerifiedBadge from '@/components/VerifiedBadge';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MoreHorizontal,
  MapPin,
  MessageCircle,
  Tag,
  Heart,
  ShieldAlert,
  Ban,
  Languages,
  Loader2,
  Share2
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { VoicePlayer } from '@/components/VoicePlayer';
import { ageOf } from '@/lib/age';
import { VisitingBadge } from '@/components/VisitingBadge';
import { CardPhoto, DETAIL_PHOTO_SIZES } from '@/components/CardPhoto';
import { PhotoCarousel } from '@/components/cards/PhotoCarousel';
import { DETAIL_IMAGE, supabaseImage } from '@/lib/images/supabaseImage';
import { DayOneBadge, NewMemberPill, VerifiedLocationBadge } from '@/components/profile/TrustBadges';
import { getPresenceStatus } from '@/lib/presence';
import { isTrustedVoiceIntroUrl } from '@/lib/audio';
import { resolveCountry } from '@/lib/countries';
import { rhythmOption, sharedTraits } from '@/lib/rhythm';
import { scoreOf } from '@/lib/reputation';
import { InCommonCard, RhythmPill } from '@/components/profile/RhythmBadges';
import RepScoreCard from '@/components/RepScoreCard';
import { PrivateNotesCard } from '@/components/profile/PrivateNotesCard';
import { useActionToast } from '@/components/ActionToast';
import { interestIcon, interestIconOrDefault } from '@/lib/interestIcons';
import { languageLabel, readLanguages } from '@/lib/constants/languages';
import { formatHeight, lifestyleOption, readHeightCm, readLifestyle } from '@/lib/lifestyle';
import { LifestyleBadges } from '@/components/profile/LifestyleFields';
import { BackButton } from '@/components/BackButton';

/** Loaded on first open (keeps the report sheet out of the page bundle). */
const ReportModal = dynamic(() => import('@/components/ReportModal').then((m) => m.ReportModal), { ssr: false });

interface HighlightRow {
  tag_id: string;
  label: string;
  icon: string;
  story: string;
}


function formatIntent(val: unknown): string {
  if (!val) return '';
  const raw = String(val).trim();
  const map: Record<string, string> = {
    marriage: 'Marriage & Long-Term Partner',
    serious_relationship: 'Long-Term Relationship',
    long_term: 'Long-Term Relationship',
    casual: 'Casual Dating',
    friendship: 'Friendship & Connection',
  };
  return map[raw.toLowerCase()] || raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const targetUserId = params?.id as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [viewerInterests, setViewerInterests] = useState<string[]>([]);
  const [viewerLanguages, setViewerLanguages] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<HighlightRow[]>([]);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  const [isSparked, setIsSparked] = useState(false);
  const [sparkLoading, setSparkLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const showActionToast = useActionToast();

  const blockMember = async () => {
    try {
      const res = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedId: targetUserId }),
      });
      if (!res.ok) throw new Error();
      showActionToast('Member blocked', 'shield');
      setTimeout(() => router.push('/discover'), 900);
    } catch {
      showActionToast('Could not block this member. Try again.', 'info');
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!targetUserId) return;
      setLoading(true);

      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (currentUser) {
          const { data: viewerData } = await supabase
            .from('profiles')
            .select('interests, languages')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (Array.isArray(viewerData?.interests)) {
            setViewerInterests(viewerData.interests);
          }
          setViewerLanguages(readLanguages(viewerData?.languages));

          const { data: existingSpark } = await supabase
            .from('sparks')
            .select('id')
            .eq('sender_id', currentUser.id)
            .eq('receiver_id', targetUserId)
            .maybeSingle();

          setIsSparked(Boolean(existingSpark));
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
          // Visitor footprint (skipped server-side for Plus members in Ghost Mode).
          if (currentUser && currentUser.id !== profileData.id) {
            fetch('/api/profile/view', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ viewed_id: profileData.id }),
            }).catch(() => {});
          }
        }

        try {
          const { data: hlData } = await supabase
            .from('user_highlights')
            .select('tag_id, highlight_story, interest_tags(id, name, label, icon)')
            .eq('user_id', targetUserId);

          if (Array.isArray(hlData) && hlData.length > 0) {
            setHighlights(
              hlData.map((h: any) => ({
                tag_id: h.tag_id,
                label: h.interest_tags?.label || h.interest_tags?.name || 'Highlight',
                // Stored tag icons may be emoji: the UI renders a Lucide icon from the label instead.
                icon: '',
                story: h.highlight_story || '',
              }))
            );
          }
        } catch {
          // Optional table
        }
      } catch (err) {
        console.error('Error loading public profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [targetUserId]);

  const handleToggleSpark = async () => {
    setSparkLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/spark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // This button is a real on/off toggle (Discover cards only ever add a Spark).
        body: JSON.stringify({ targetUserId, action: 'toggle' }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        triggerToast(data?.error || 'Spark limit reached. Try again later.');
        return;
      }

      const sparked = Boolean(data.sparked);
      setIsSparked(sparked);

      // Invalidate sparks cache so /favorites stays in sync
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('ail_sparks_fast_cache_v2');
          window.dispatchEvent(
            new CustomEvent('ail_spark_sync', {
              detail: { targetUserId, sparked, mutual: Boolean(data.mutual) },
            })
          );
        } catch {}
      }

      if (data.mutual) {
        triggerToast("It's a Match! You both sparked each other.");
      } else if (sparked) {
        triggerToast('Spark sent!');
      } else {
        triggerToast('Spark removed');
      }
    } catch (err) {
      console.error('Error toggling spark:', err);
      triggerToast('Network error toggling spark.');
    } finally {
      setSparkLoading(false);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  if (loading) {
    return (
      <div className="w-full px-3.5 pt-3.5 space-y-3.5 bg-white" aria-busy="true" aria-label="Loading profile">
        <div className="aspect-[4/5] w-full rounded-3xl ail-shimmer" />
        <div className="h-24 rounded-3xl ail-shimmer" />
        <div className="h-16 rounded-3xl ail-shimmer" />
        <div className="h-28 rounded-3xl ail-shimmer" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-[#413B5E]">Profile not found</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl bg-[#8574B7] text-white text-xs font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Strictly prioritize username; if unset on a Google Auth account, strip surname
  const rawHandle =
    (profile.username && !String(profile.username).startsWith('user_')
      ? String(profile.username)
      : '') ||
    String(profile.display_name || profile.full_name || 'Member')
      .trim()
      .split(/\s+/)[0];

  const displayName = rawHandle.replace(/^@/, '');
  const memberAge = ageOf(profile);
  const displayAge = memberAge ? `, ${memberAge}` : '';
  const resolvedCountry = resolveCountry(profile.city, profile.country);
  const displayLocation =
    profile.city && resolvedCountry
      ? `${profile.city}, ${resolvedCountry}`
      : profile.city || resolvedCountry || profile.location || 'Location not shared';

  const isVerified = profile.verification_status === 'verified' || Boolean(profile.is_verified);

  const photoList: string[] =
    Array.isArray(profile.photos) && profile.photos.length > 0
      ? profile.photos.filter(Boolean)
      : profile.avatar_url
      ? [profile.avatar_url]
      : ['/placeholder-avatar.svg'];

  const placeholders: Record<string, string> =
    profile.photo_placeholders && typeof profile.photo_placeholders === 'object' ? profile.photo_placeholders : {};
  const dayOneNumber: number | null = profile.is_day_one && Number.isInteger(profile.day_one_number) ? profile.day_one_number : null;
  const travel =
    profile.is_travel_mode_active && profile.is_plus && profile.visiting_city
      ? { city: profile.visiting_city, country: profile.visiting_country ?? null, dates: profile.visiting_dates ?? null }
      : null;
  const isOnline = profile.show_active_status !== false && getPresenceStatus(profile.last_active).isOnline;
  const hasMultiplePhotos = photoList.length > 1;

  const targetInterests: string[] = Array.isArray(profile.interests) ? profile.interests : [];
  const sharedInterests = targetInterests.filter((tag) =>
    viewerInterests.some((v) => v.toLowerCase() === String(tag).toLowerCase())
  );

  const lookingForText = formatIntent(
    profile.looking_for || profile.relationship_goal || profile.relationship_intent || profile.intentions
  );

  const parsedLanguages = readLanguages(profile.languages);
  const languagesList: string[] = parsedLanguages.length > 0 ? parsedLanguages : ['English'];

  // Interests + languages you both have (shown as the "N in common" card above the bio).
  const inCommon = sharedTraits(
    { interests: viewerInterests, languages: viewerLanguages },
    { interests: targetInterests, languages: parsedLanguages }
  );
  const relocationReadiness = rhythmOption('relocation_readiness', profile.relocation_readiness);
  const timelineIntent = rhythmOption('timeline_intent', profile.timeline_intent);

  const vitals = [
    { label: 'Future Plans', value: formatIntent(profile.relationship_intent || profile.relationship_goal) },
    { label: 'Occupation', value: profile.occupation || profile.profession },
    { label: 'Marital Status', value: profile.marital_status },
    { label: 'Beliefs', value: profile.religion },
    {
      label: 'Relocation',
      value: relocationReadiness ? relocationReadiness.label : profile.relocation,
    },
    { label: 'Timeline', value: timelineIntent ? timelineIntent.label : null },
    { label: 'Children', value: profile.has_kids },
    { label: 'Wants Children', value: profile.wants_kids },
    { label: 'Height', value: formatHeight(readHeightCm(profile.height_cm, profile.height)) },
    { label: 'Drinks', value: lifestyleOption('drinking', readLifestyle('drinking', profile.drinking))?.label },
    { label: 'Smokes', value: lifestyleOption('smoking', readLifestyle('smoking', profile.smoking))?.label },
  ].filter((item) => Boolean(item.value && String(item.value).trim()));
  // Self-expression badges (body type, tattoos, piercings, fitness); drinking / smoking are vitals rows.
  const lifestyleBadges = Object.fromEntries(
    (['body_type', 'tattoos', 'piercings', 'fitness_rhythm'] as const).map((k) => [k, readLifestyle(k, profile[k])])
  );

  // Portal dock directly to document.body so LayoutShell's scroll container never moves it
  const floatingDock = mounted
    ? createPortal(
        <aside className="fixed bottom-3.5 left-1/2 -translate-x-1/2 w-[calc(100%-1.75rem)] max-w-[390px] z-[90] bg-white/95 border border-[#D0CDE1] shadow-[0_12px_36px_rgba(102,93,150,0.18),0_2px_8px_rgba(0,0,0,0.04)] rounded-full p-1.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleToggleSpark}
              disabled={sparkLoading}
              className={`flex h-11 w-full items-center justify-center gap-1.5 rounded-full border text-xs font-bold transition active:scale-95 cursor-pointer ${
                isSparked
                  ? 'border-[#8574B7]/30 bg-[#E8E6F1]/60 text-[#8574B7]'
                  : 'border-[#D0CDE1] bg-white text-[#413B5E] hover:bg-[#E8E6F1]/70'
              }`}
            >
              {sparkLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#8574B7]" />
              ) : (
                <>
                  <Heart
                    strokeWidth={2}
                    className={`h-4 w-4 ${isSparked ? 'text-[#8574B7] fill-[#8574B7]' : 'text-[#413B5E]/55'}`}
                  />
                  <span>{isSparked ? 'Sparked' : 'Spark'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/chat/${targetUserId}`)}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#8574B7] px-4 text-xs font-semibold text-white shadow-md shadow-[#8574B7]/25 transition hover:bg-[#413B5E] active:scale-98 cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Message</span>
            </button>
          </div>
        </aside>,
        document.body
      )
    : null;

  return (
    <div className="relative flex-1 w-full bg-white text-[#413B5E] font-sans">
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-[100] px-4 py-2.5 rounded-2xl bg-white/95 border border-[#D0CDE1] text-[#413B5E] text-xs font-semibold text-center shadow-[0_12px_32px_rgba(102,93,150,0.18)]">
          {toastMsg}
        </div>
      )}

      {/* SCROLLABLE PROFILE CONTENT: 8rem + safe area keeps the last card ~24px+ clear of the fixed action dock */}
      <div className="w-full px-3.5 pt-3.5 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] space-y-3.5">
        
        {/* 1. HERO PHOTO CARD (4:5 Aspect Ratio + Overlaid Controls + Bottom Scrim) */}
        <div data-profile-hero className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden bg-white shadow-xs select-none">
          {/* Scroll-snap swiping on touch; tap left 30% / right 70% for previous / next. Photo dots
              and the thumbnail grid below stay in sync through currentPhotoIdx. */}
          <PhotoCarousel
            photos={photoList}
            alt={displayName}
            sizes={DETAIL_PHOTO_SIZES}
            edge={DETAIL_IMAGE}
            priority
            placeholders={placeholders}
            tapNavigation="always"
            index={currentPhotoIdx}
            onIndexChange={setCurrentPhotoIdx}
            imgClassName="object-cover pointer-events-none"
          />

          {/* Frosted Top Navigation (Back & More Menu) */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 pointer-events-none">
            <BackButton variant="dark" className="pointer-events-auto" />

            <div className="relative pointer-events-auto">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="More options"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60 active:scale-95 shadow-xs cursor-pointer"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-12 z-50 w-48 rounded-2xl border border-[#D0CDE1] bg-white p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        if (typeof navigator !== 'undefined' && navigator.share) {
                          navigator.share({
                            title: `${displayName} on Asians in Love`,
                            url: window.location.href,
                          }).catch(() => {});
                        } else {
                          navigator.clipboard
                            ?.writeText(window.location.href)
                            .then(() => showActionToast('Profile link copied to clipboard', 'copy'))
                            .catch(() => {});
                        }
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#413B5E] transition hover:bg-[#E8E6F1]/40"
                    >
                      <Share2 className="h-4 w-4 text-[#8574B7]" />
                      Share Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        setReportOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#413B5E] transition hover:bg-[#E8E6F1]/40"
                    >
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      Report Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        blockMember();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Ban className="h-4 w-4 text-red-500" />
                      Block Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* New member (7 days) top-left, online status top-right, under the nav buttons */}
          <div className="absolute top-[4.25rem] left-3.5 z-20 pointer-events-none">
            <NewMemberPill createdAt={profile.created_at} />
          </div>
          {isOnline && (
            <div className="absolute top-[4.6rem] right-5 z-20 pointer-events-none" title="Online now">
              <span className="block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white/90 shadow" />
            </div>
          )}

        </div>

        {/* 1b. NAME, TRUST ROW, TRAVEL */}
        <section className="px-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight text-[#413B5E]" style={{ fontFamily: 'var(--font-brand)' }}>
              {displayName}{displayAge}
            </h1>
            {isVerified && <VerifiedBadge size="md" showText />}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#413B5E]/75">
            <MapPin className="h-3.5 w-3.5 text-[#8574B7] shrink-0" />
            <span className="truncate">{displayLocation}</span>
          </div>
          {(profile.location_source === 'gps_verified' || dayOneNumber) && (
            <div className="flex items-center gap-2 flex-wrap">
              {profile.location_source === 'gps_verified' && <VerifiedLocationBadge />}
              <DayOneBadge number={dayOneNumber} />
            </div>
          )}
          <VisitingBadge travel={travel} />
        </section>

        {/* 2. VOICE INTRO (hidden when none recorded; plays only on tap) */}
        {isTrustedVoiceIntroUrl(profile.voice_intro_url) && (
          <VoicePlayer src={profile.voice_intro_url} title={`Hear ${displayName} say hello`} />
        )}

        {/* 3. REPUTATION */}
        <RepScoreCard score={scoreOf(profile.reputation_score)} />

        {/* 4. ABOUT ME (with things in common) */}
        <section className="p-4 rounded-3xl bg-white border border-[#D0CDE1] shadow-2xs space-y-2">
          <h2
            className="text-xs font-bold uppercase tracking-wider text-[#8574B7]"
            style={{ fontFamily: 'var(--font-brand)' }}
          >
            About Me
          </h2>
          <InCommonCard items={inCommon} />
          <p className="text-xs sm:text-sm text-[#413B5E] leading-relaxed whitespace-pre-line">
            {profile.bio || 'Looking for something genuine and sincere.'}
          </p>
        </section>

        {/* 4b. PRIVATE NOTES: only the viewer can read them (hidden on your own profile) */}
        <PrivateNotesCard targetId={targetUserId} />

        {/* 5. HIGHLIGHTS & MINI-STORIES */}
        {highlights.length > 0 && (
          <section className="p-4 rounded-3xl bg-white border border-[#D0CDE1] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2
                className="text-xs font-bold uppercase tracking-wider text-[#8574B7]"
                style={{ fontFamily: 'var(--font-brand)' }}
              >
                Highlights &amp; Stories
              </h2>
              <span className="text-[10px] font-medium text-[#413B5E]/55">Tap to reply</span>
            </div>

            <div className="grid gap-2.5">
              {highlights.map((item) => (
                <div
                  key={item.tag_id}
                  onClick={() => router.push(`/chat/${targetUserId}`)}
                  className="group cursor-pointer rounded-2xl border border-[#D0CDE1] bg-white p-3.5 transition hover:border-[#8574B7]/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = interestIconOrDefault(item.label);
                        return <Icon className="w-4 h-4 text-[#8574B7] shrink-0" aria-hidden />;
                      })()}
                      <span className="text-xs font-bold text-[#413B5E]">{item.label}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#8574B7]">
                      <span className="inline-flex items-center gap-1">Reply <MessageCircle className="w-3 h-3" aria-hidden /></span>
                    </span>
                  </div>
                  {item.story && (
                    <p className="mt-1.5 text-xs leading-relaxed text-[#413B5E]/85 italic">
                      “{item.story}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. INTERESTS & HOBBIES */}
        {targetInterests.length > 0 && (
          <section className="p-4 rounded-3xl bg-white border border-[#D0CDE1] shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8574B7]"
                style={{ fontFamily: 'var(--font-brand)' }}
              >
                <Tag className="w-3.5 h-3.5" />
                Interests &amp; Hobbies
              </h2>
              {sharedInterests.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#8574B7]/10 text-[#8574B7] font-medium shrink-0">
                  {sharedInterests.length} in common
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {targetInterests.map((tag) => {
                const isShared = sharedInterests.some(
                  (s) => s.toLowerCase() === String(tag).toLowerCase()
                );
                const Icon = interestIcon(tag);
                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                      isShared
                        ? 'border-[#8574B7] text-[#8574B7] bg-[#8574B7]/5'
                        : 'border-transparent bg-white text-[#413B5E]'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />}
                    <span>{tag}</span>
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* 7. WHAT I'M LOOKING FOR & MY RHYTHM */}
        {(lookingForText || profile.reply_pace || relocationReadiness || timelineIntent) && (
          <section className="p-4 rounded-3xl bg-white border border-[#D0CDE1] shadow-2xs space-y-2">
            <h2
              className="text-xs font-bold uppercase tracking-wider text-[#8574B7]"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              What I&apos;m Looking For
            </h2>
            {lookingForText && (
              <p className="text-xs sm:text-sm font-semibold text-[#413B5E]">{lookingForText}</p>
            )}
            {(profile.reply_pace || relocationReadiness || timelineIntent) && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <RhythmPill field="reply_pace" value={profile.reply_pace} className="text-[11px] px-2.5 py-1" />
                <RhythmPill field="relocation_readiness" value={profile.relocation_readiness} className="text-[11px] px-2.5 py-1" />
                <RhythmPill field="timeline_intent" value={profile.timeline_intent} className="text-[11px] px-2.5 py-1" />
              </div>
            )}
          </section>
        )}

        {/* 8. VITALS, LIFESTYLE & LANGUAGES */}
        {vitals.length > 0 && (
          <section className="p-4 rounded-3xl bg-white border border-[#D0CDE1] shadow-2xs space-y-3">
            <h2
              className="text-xs font-bold uppercase tracking-wider text-[#8574B7]"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              Vitals &amp; Lifestyle
            </h2>
            <LifestyleBadges values={lifestyleBadges} />
            <div className="divide-y divide-[#D0CDE1] text-xs">
              {vitals.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2.5 first:pt-1 last:pb-0">
                  <span className="font-medium text-[#413B5E]/75">{item.label}</span>
                  <span className="font-semibold text-[#413B5E]">{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8b. LANGUAGES SPOKEN */}
        {languagesList.length > 0 && (
          <section className="p-4 rounded-3xl bg-white border border-[#D0CDE1] shadow-2xs space-y-2.5">
            <h2
              className="text-xs font-bold uppercase tracking-wider text-[#8574B7] flex items-center gap-1.5"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              <Languages className="w-4 h-4 text-[#8574B7]" />
              <span>Languages Spoken</span>
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {languagesList.map((lang) => (
                <span
                  key={languageLabel(lang)}
                  className="px-3 py-1 rounded-full bg-white border border-[#D0CDE1] text-xs font-semibold text-[#413B5E]"
                >
                  {lang}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 9. PHOTO GALLERY */}
        {hasMultiplePhotos && (
          <section className="grid grid-cols-3 gap-2" aria-label="Photos">
            {photoList.map((url, idx) => (
              <button
                key={url}
                type="button"
                onClick={() => {
                  setCurrentPhotoIdx(idx);
                  document.querySelector('[data-profile-hero]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                aria-label={`Show photo ${idx + 1}`}
                className={`relative aspect-[4/5] rounded-2xl overflow-hidden bg-white border ${idx === currentPhotoIdx ? 'border-[#8574B7]' : 'border-[#D0CDE1]'}`}
              >
                <CardPhoto src={supabaseImage(url, { width: 320, height: 400, quality: 70, resize: 'cover' })} alt="" placeholder={placeholders[url] ?? null} className="object-cover" />
              </button>
            ))}
          </section>
        )}

      </div>

      {floatingDock}

      {reportOpen && (
      <ReportModal
        open
        reportedId={targetUserId}
        name={displayName}
        context="profile"
        onClose={() => setReportOpen(false)}
        onDone={(blocked) => {
          setReportOpen(false);
          showActionToast('Thank you for keeping our community safe. Our team is reviewing this profile.', 'shield');
          if (blocked) setTimeout(() => router.push('/discover'), 1200);
        }}
      />
      )}
    </div>
  );
}
