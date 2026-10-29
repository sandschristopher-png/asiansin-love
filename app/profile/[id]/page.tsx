'use client';

import React, { useState, useEffect } from 'react';
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
  Ban
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Highlight {
  id: string;
  label: string;
  icon: string;
  story: string;
}

interface ProfileData {
  id: string;
  full_name: string;
  age: number;
  city: string;
  country: string;
  avatar_url: string;
  bio: string;
  is_verified: boolean;
  relationship_goal?: string;
  languages?: string[];
  highlights?: Highlight[];
}

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isSparked, setIsSparked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!profileId) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, birthdate, city, country, avatar_url, bio, is_verified, relationship_intent, languages')
          .eq('id', profileId)
          .maybeSingle();

        if (error || !data) {
          setNotFound(true);
          return;
        }

        const bd = data.birthdate ? new Date(data.birthdate) : null;
        const age = bd ? Math.floor((Date.now() - bd.getTime()) / (365.25 * 24 * 3600 * 1000)) : 0;

        // Second query: highlights are optional — a profile with none still renders
        let highlights: Highlight[] = [];
        try {
          const { data: hi } = await supabase
            .from('user_interests')
            .select('tag_id, highlight_story, interest_tags ( id, label, icon )')
            .eq('user_id', profileId)
            .eq('is_highlight', true);
          highlights = (hi || [])
            .filter((h: any) => h.interest_tags)
            .map((h: any) => ({
              id: h.interest_tags.id,
              label: h.interest_tags.label || 'Interest',
              icon: h.interest_tags.icon || '',
              story: h.highlight_story || ''
            }));
        } catch (e) {
          console.warn('Highlights fetch failed, rendering profile without them:', e);
        }

        setProfile({
          id: data.id,
          full_name: data.full_name || 'Member',
          age,
          city: data.city || '',
          country: data.country || '',
          avatar_url: data.avatar_url || '',
          bio: data.bio || '',
          is_verified: Boolean(data.is_verified),
          relationship_goal: data.relationship_intent || undefined,
          languages: Array.isArray(data.languages) ? data.languages : undefined,
          highlights
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#6555B8] border-t-transparent" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-6 text-center">
        <p className="text-sm font-semibold text-neutral-700">This profile is no longer available.</p>
        <button
          type="button"
          onClick={() => router.push('/discover')}
          className="rounded-2xl bg-[#6555B8] px-5 py-3 text-xs font-semibold text-white active:scale-95"
        >
          Back to Discover
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-neutral-50 font-sans text-neutral-900">
      <main className="mx-auto max-w-md px-3 pt-3 pb-28 space-y-3.5">

        {/* HERO CARD: 4:5 Photo + Frosted Top Controls + Scrim */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-neutral-200 shadow-xs">
          <img
            src={profile.avatar_url || '/placeholder-avatar.svg'}
            alt={profile.full_name}
            className="h-full w-full object-cover"
          />

          {/* Floating Frosted Top Nav */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 pointer-events-none">
            <button
              type="button"
              onClick={() => { if (window.history.length > 1) { router.back(); } else { router.push('/discover'); } }}
              aria-label="Back"
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60 active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="relative pointer-events-auto">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="More options"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60 active:scale-95"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-12 z-50 w-48 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => setShowMenu(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                    >
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      Report Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMenu(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      <Ban className="h-4 w-4 text-rose-500" />
                      Block Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom Gradient Scrim */}
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-24 pointer-events-none">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                {profile.full_name}{profile.age ? `, ${profile.age}` : ''}
              </h1>

              {profile.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/25 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 backdrop-blur-xs border border-emerald-400/30">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-neutral-200">
              <MapPin className="h-3.5 w-3.5 text-neutral-300" />
              <span>{[profile.city, profile.country].filter(Boolean).join(', ') || 'Somewhere'}</span>
            </div>
          </div>
        </div>

        {/* COMMON GROUND ICEBREAKER BANNER */}
        {profile.highlights && profile.highlights.length > 0 && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-[#6555B8]/20 bg-[#6555B8]/5 p-3.5">
            <Sparkles className="h-4 w-4 text-[#6555B8] shrink-0" />
            <p className="text-xs font-medium text-neutral-800 leading-snug">
              You and {profile.full_name} both enjoy{' '}
              <span className="font-bold text-[#6555B8]">{profile.highlights[0].label}</span>
            </p>
          </div>
        )}

        {/* ABOUT ME / BIO */}
        {profile.bio && (
          <section className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              About Me
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-neutral-700 whitespace-pre-line font-sans">
              {profile.bio}
            </p>
          </section>
        )}

        {/* HIGHLIGHTS & STORIES */}
        {profile.highlights && profile.highlights.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Highlights & Interests
              </h2>
            </div>

            <div className="grid gap-2.5">
              {profile.highlights.map((item) => (
                <div
                  key={item.id}
                  className="group cursor-pointer rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs transition hover:border-[#6555B8]/40 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.icon && <span className="text-base">{item.icon}</span>}
                      <span className="text-xs font-bold text-neutral-900">{item.label}</span>
                    </div>
                  </div>

                  {item.story && (
                    <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                      &ldquo;{item.story}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BASIC DETAILS / TRAITS */}
        {(profile.relationship_goal || (profile.languages && profile.languages.length > 0)) && (
          <section className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs space-y-3">
            {profile.relationship_goal && (
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Looking For
                </h3>
                <p className="mt-1 text-xs font-semibold text-neutral-800">
                  {profile.relationship_goal}
                </p>
              </div>
            )}

            {profile.languages && profile.languages.length > 0 && (
              <div className="border-t border-neutral-100 pt-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Languages
                </h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {profile.languages.map((lang) => (
                    <span
                      key={lang}
                      className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* FIXED FLOATING DOCK — pinned like the Discover bottom nav */}
      <aside className="fixed bottom-3.5 left-1/2 -translate-x-1/2 w-[calc(100%-1.75rem)] max-w-md z-40">
        <div className="flex items-center gap-2.5 rounded-2xl border border-neutral-200/80 bg-white/95 p-2.5 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsSparked(!isSparked)}
            aria-label="Spark"
            className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition active:scale-95 ${
              isSparked
                ? 'border-neutral-200 bg-neutral-100 text-neutral-400'
                : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100'
            }`}
          >
            <Zap className={`h-4 w-4 ${isSparked ? 'fill-amber-500 text-amber-500' : 'text-neutral-400'}`} />
            <span>{isSparked ? 'Sparked' : 'Spark'}</span>
          </button>

          <button
            type="button"
            onClick={() => router.push(`/chat/${profile.id}`)}
            aria-label="Message"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#6555B8] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5849a6] active:scale-95"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Message</span>
          </button>
        </div>
      </aside>
    </div>
  );
}