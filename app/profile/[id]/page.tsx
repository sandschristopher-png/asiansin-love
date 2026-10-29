'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MoreHorizontal,
  MapPin,
  ShieldCheck,
  Zap,
  MessageCircle,
  Sparkles,
  ShieldAlert,
  Ban,
  Languages,
  Loader2,
  Share2
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface HighlightRow {
  tag_id: string;
  label: string;
  icon: string;
  story: string;
}

const HOBBY_ICONS: Record<string, string> = {
  'Cooking & Food': '🍳',
  'Beach & Ocean': '🏝️',
  'Island Hopping': '⛵',
  'Family First': '🏡',
  'Travel': '✈️',
  'Movies & Cinema': '🎬',
  'Music & Karaoke': '🎤',
  'Fitness & Gym': '💪',
  'Health & Wellness': '🌿',
  'Coffee & Cafes': '☕',
  'Hiking & Outdoors': '🥾',
  'Faith & Church': '🙏',
  'Homebody': '🛋️',
  'Nightlife & Bars': '🍸',
  'Shopping & Malls': '🛍️',
  'Photography': '📸',
  'Pets & Animals': '🐾',
  'Mobile Gaming & Esports': '🎮',
  'Art & Design': '🎨',
  'Business & Career': '💼',
};

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
  const [highlights, setHighlights] = useState<HighlightRow[]>([]);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const [isSparked, setIsSparked] = useState(false);
  const [sparkLoading, setSparkLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
            .select('interests')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (Array.isArray(viewerData?.interests)) {
            setViewerInterests(viewerData.interests);
          }

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
                icon: h.interest_tags?.icon || '✨',
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

      if (isSparked) {
        await supabase
          .from('sparks')
          .delete()
          .eq('sender_id', user.id)
          .eq('receiver_id', targetUserId);
        setIsSparked(false);
      } else {
        await supabase
          .from('sparks')
          .insert({
            sender_id: user.id,
            receiver_id: targetUserId,
          });
        setIsSparked(true);
      }
    } catch (err) {
      console.error('Error toggling spark:', err);
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
      <div className="min-h-screen bg-[#F8F7FA] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#6555B8]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8F7FA] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-[#1C1924]">Profile not found</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl bg-[#6555B8] text-white text-xs font-semibold"
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
  const displayAge = profile.age ? `, ${profile.age}` : '';
  const displayLocation =
    profile.city && profile.country
      ? `${profile.city}, ${profile.country}`
      : profile.location || profile.city || profile.country || 'Philippines';

  const isVerified = profile.verification_status === 'verified' || Boolean(profile.is_verified);

  const photoList: string[] =
    Array.isArray(profile.photos) && profile.photos.length > 0
      ? profile.photos.filter(Boolean)
      : profile.avatar_url
      ? [profile.avatar_url]
      : ['/placeholder-avatar.svg'];

  const currentImg = photoList[currentPhotoIdx] || photoList[0];
  const hasMultiplePhotos = photoList.length > 1;

  const targetInterests: string[] = Array.isArray(profile.interests) ? profile.interests : [];
  const sharedInterests = targetInterests.filter((tag) =>
    viewerInterests.some((v) => v.toLowerCase() === String(tag).toLowerCase())
  );

  const lookingForText = formatIntent(
    profile.looking_for || profile.relationship_goal || profile.relationship_intent || profile.intentions
  );

  const languagesList: string[] = Array.isArray(profile.languages)
    ? profile.languages
    : typeof profile.languages === 'string' && profile.languages.trim()
    ? profile.languages.split(',').map((s: string) => s.trim()).filter(Boolean)
    : ['English'];

  const vitals = [
    { label: 'Future Plans', value: formatIntent(profile.relationship_intent || profile.relationship_goal) },
    { label: 'Occupation', value: profile.occupation || profile.profession },
    { label: 'Marital Status', value: profile.marital_status },
    { label: 'Beliefs', value: profile.religion },
    { label: 'Relocation', value: profile.relocation },
    { label: 'Children', value: profile.has_kids },
    { label: 'Wants Children', value: profile.wants_kids },
    { label: 'Height', value: profile.height },
    { label: 'Drinks', value: profile.drinking },
    { label: 'Smokes', value: profile.smoking },
  ].filter((item) => Boolean(item.value && String(item.value).trim()));

  // Portal dock directly to document.body so LayoutShell's scroll container never moves it
  const floatingDock = mounted
    ? createPortal(
        <aside className="fixed bottom-3.5 left-1/2 -translate-x-1/2 w-[calc(100%-1.75rem)] max-w-[390px] z-[90] bg-white/92 backdrop-blur-2xl border border-[#E5E1EC]/80 shadow-[0_12px_36px_rgba(101,85,184,0.18),0_2px_8px_rgba(0,0,0,0.04)] rounded-full p-1.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleToggleSpark}
              disabled={sparkLoading}
              className={`flex h-11 w-full items-center justify-center gap-1.5 rounded-full border text-xs font-bold transition active:scale-95 cursor-pointer ${
                isSparked
                  ? 'border-[#6555B8]/30 bg-[#F3EFFC] text-[#6555B8]'
                  : 'border-[#DDD7E5] bg-[#F8F7FA] text-[#1C1924] hover:bg-[#F3EFFC]'
              }`}
            >
              {sparkLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#6555B8]" />
              ) : (
                <>
                  <Zap
                    className={`h-4 w-4 ${
                      isSparked ? 'text-[#6555B8] fill-[#6555B8]' : 'text-amber-500 fill-amber-500'
                    }`}
                  />
                  <span>{isSparked ? 'Sparked' : 'Spark'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/chat/${targetUserId}`)}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#6555B8] px-4 text-xs font-semibold text-white shadow-md shadow-[#6555B8]/25 transition hover:bg-[#52449E] active:scale-98 cursor-pointer"
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
    <div className="relative flex-1 w-full bg-[#F8F7FA] text-[#1C1924] font-sans">
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-2xl bg-[#1C1924]/90 text-white text-xs font-semibold shadow-lg backdrop-blur-md">
          {toastMsg}
        </div>
      )}

      {/* SCROLLABLE PROFILE CONTENT — pb-32 guarantees bottom cards clear the fixed dock */}
      <div className="w-full px-3.5 pt-3.5 pb-32 space-y-3.5">
        
        {/* 1. HERO PHOTO CARD (4:5 Aspect Ratio + Overlaid Controls + Bottom Scrim) */}
        <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden bg-neutral-200 shadow-xs select-none">
          <div
            className="w-full h-full cursor-pointer"
            onClick={(e) => {
              if (!hasMultiplePhotos) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const isLeft = e.clientX - rect.left < rect.width / 2;
              setCurrentPhotoIdx((prev) =>
                isLeft
                  ? (prev - 1 + photoList.length) % photoList.length
                  : (prev + 1) % photoList.length
              );
            }}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const startX = touchStartX.current;
              if (startX == null || !hasMultiplePhotos) return;
              const dx = e.changedTouches[0].clientX - startX;
              if (Math.abs(dx) > 40) {
                setCurrentPhotoIdx((prev) =>
                  dx > 0
                    ? (prev - 1 + photoList.length) % photoList.length
                    : (prev + 1) % photoList.length
                );
              }
              touchStartX.current = null;
            }}
          >
            <img
              src={currentImg}
              alt={displayName}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          </div>

          {hasMultiplePhotos && (
            <div className="absolute top-3 inset-x-16 z-20 flex gap-1.5 pointer-events-none">
              {photoList.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    idx === currentPhotoIdx ? 'bg-white shadow-xs' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Frosted Top Navigation (Back & More Menu) */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 pointer-events-none">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60 active:scale-95 shadow-xs cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="relative pointer-events-auto">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="More options"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60 active:scale-95 shadow-xs cursor-pointer"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-12 z-50 w-48 rounded-2xl border border-[#E5E1EC] bg-white p-1.5 shadow-xl">
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
                          navigator.clipboard?.writeText(window.location.href);
                          triggerToast('Profile link copied');
                        }
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1C1924] transition hover:bg-[#F8F7FA]"
                    >
                      <Share2 className="h-4 w-4 text-[#6555B8]" />
                      Share Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        triggerToast(`Report submitted for ${displayName}`);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1C1924] transition hover:bg-[#F8F7FA]"
                    >
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      Report Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        triggerToast(`${displayName} has been blocked`);
                        setTimeout(() => router.push('/discover'), 1000);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      <Ban className="h-4 w-4 text-rose-500" />
                      Block Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom Gradient Scrim Overlay with Username & Location */}
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-5 pt-24 pointer-events-none">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-2xl font-bold tracking-tight text-white"
                style={{ fontFamily: 'var(--font-brand)' }}
              >
                {displayName}{displayAge}
              </h1>

              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/25 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 backdrop-blur-xs border border-emerald-400/30">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-neutral-200">
              <MapPin className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
              <span>{displayLocation}</span>
              {profile.location_source === 'gps_verified' && (
                <span className="ml-1 rounded-full bg-white/20 px-2 py-0.2 text-[10px] font-semibold text-white backdrop-blur-xs">
                  GPS
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. HIGHLIGHTS & MINI-STORIES */}
        {highlights.length > 0 && (
          <section className="p-4 rounded-3xl bg-white border border-[#DDD7E5] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2
                className="text-xs font-bold uppercase tracking-wider text-[#6555B8]"
                style={{ fontFamily: 'var(--font-brand)' }}
              >
                Highlights &amp; Stories
              </h2>
              <span className="text-[10px] font-medium text-[#8C849B]">Tap to reply</span>
            </div>

            <div className="grid gap-2.5">
              {highlights.map((item) => (
                <div
                  key={item.tag_id}
                  onClick={() => router.push(`/chat/${targetUserId}`)}
                  className="group cursor-pointer rounded-2xl border border-[#DDD7E5]/80 bg-[#FAF8FD] p-3.5 transition hover:border-[#6555B8]/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs font-bold text-[#1C1924]">{item.label}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#6555B8]">
                      Reply 💬
                    </span>
                  </div>
                  {item.story && (
                    <p className="mt-1.5 text-xs leading-relaxed text-[#524B5E] italic">
                      “{item.story}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. INTERESTS & THINGS IN COMMON */}
        {targetInterests.length > 0 && (
          <section className="p-4 rounded-3xl bg-white border border-[#DDD7E5] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#F3EFFC] text-[#6555B8] flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2
                    className="text-xs font-bold uppercase tracking-wider text-[#1C1924]"
                    style={{ fontFamily: 'var(--font-brand)' }}
                  >
                    Interests &amp; Things in Common
                  </h2>
                  <p className="text-[11px] text-[#6C637B]">
                    {sharedInterests.length > 0
                      ? `You share ${sharedInterests.length} interest${sharedInterests.length > 1 ? 's' : ''} & values`
                      : `${displayName}'s hobbies & passions`}
                  </p>
                </div>
              </div>

              {sharedInterests.length > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-[#6555B8] text-white text-[10px] font-bold shrink-0">
                  {sharedInterests.length} Shared
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {targetInterests.map((tag) => {
                const isShared = sharedInterests.some(
                  (s) => s.toLowerCase() === String(tag).toLowerCase()
                );
                const icon = HOBBY_ICONS[tag] || '✨';
                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition ${
                      isShared
                        ? 'bg-[#F3EFFC] border border-[#6555B8]/40 font-bold text-[#6555B8]'
                        : 'bg-[#F8F7FA] border border-[#DDD7E5] font-medium text-[#524B5E]'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{tag}</span>
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. ABOUT ME */}
        <section className="p-4 rounded-3xl bg-white border border-[#DDD7E5] shadow-2xs space-y-2">
          <h2
            className="text-xs font-bold uppercase tracking-wider text-[#6555B8]"
            style={{ fontFamily: 'var(--font-brand)' }}
          >
            About Me
          </h2>
          <p className="text-xs sm:text-sm text-[#1C1924] leading-relaxed whitespace-pre-line">
            {profile.bio || 'Looking for something genuine and sincere.'}
          </p>
        </section>

        {/* 5. WHAT I'M LOOKING FOR */}
        {lookingForText && (
          <section className="p-4 rounded-3xl bg-white border border-[#DDD7E5] shadow-2xs space-y-1.5">
            <h2
              className="text-xs font-bold uppercase tracking-wider text-[#6555B8]"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              What I&apos;m Looking For
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#1C1924]">
              {lookingForText}
            </p>
          </section>
        )}

        {/* 6. VITALS & LIFESTYLE */}
        {vitals.length > 0 && (
          <section className="p-4 rounded-3xl bg-white border border-[#DDD7E5] shadow-2xs space-y-3">
            <h2
              className="text-xs font-bold uppercase tracking-wider text-[#6555B8]"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              Vitals &amp; Lifestyle
            </h2>
            <div className="divide-y divide-[#F0EDF5] text-xs">
              {vitals.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2.5 first:pt-1 last:pb-0">
                  <span className="font-medium text-[#6C637B]">{item.label}</span>
                  <span className="font-semibold text-[#1C1924]">{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. LANGUAGES SPOKEN */}
        {languagesList.length > 0 && (
          <section className="p-4 rounded-3xl bg-white border border-[#DDD7E5] shadow-2xs space-y-2.5">
            <h2
              className="text-xs font-bold uppercase tracking-wider text-[#6555B8] flex items-center gap-1.5"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              <Languages className="w-4 h-4 text-[#6555B8]" />
              <span>Languages Spoken</span>
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {languagesList.map((lang) => (
                <span
                  key={lang}
                  className="px-3 py-1 rounded-full bg-[#F8F7FA] border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                >
                  {lang}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      {floatingDock}
    </div>
  );
}