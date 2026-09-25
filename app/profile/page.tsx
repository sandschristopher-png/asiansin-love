'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function PersonalProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadUserProfile() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
      } else {
        setProfile({
          full_name: user.user_metadata?.full_name || 'Member',
          age: null,
          city: '',
          country: '',
          relationship_goal: 'Marriage',
          is_verified: false,
          reputation_score: 100,
        });
      }
      setLoading(false);
    }
    loadUserProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-sm font-semibold text-[#B6AEC7]">
        Loading your profile...
      </div>
    );
  }

  const rep = profile?.reputation_score ?? 100;
  const isVerified = Boolean(profile?.is_verified);

  return (
    <main className="w-full max-w-2xl mx-auto p-4 sm:py-8 space-y-5">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Your Profile</h1>
          <p className="text-xs text-[#B6AEC7]">Public preview seen by other members</p>
        </div>
        <Link
          href="/profile/edit"
          className="px-4 py-2 rounded-xl bg-[#653C87] hover:bg-[#7D48A5] text-white text-xs font-bold shadow-sm transition-all"
        >
          Edit Profile
        </Link>
      </div>

      {/* Hero Photo / Avatar Frame */}
      <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-[#241E2F] border border-[#7D7E92]/25 shadow-xl">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.full_name || 'Profile photo'}
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover object-top"
            unoptimized
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-[#7D7E92]/50 gap-2">
            <span className="text-6xl font-black">
              {profile?.full_name ? profile.full_name[0] : 'U'}
            </span>
            <Link
              href="/profile/edit"
              className="text-xs font-semibold text-[#E6D7FA] underline"
            >
              Upload profile photo
            </Link>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
          {isVerified ? (
            <div className="h-7 w-7 rounded-full bg-[#653C87] border border-[#9A79BA]/50 flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <Link
              href="/verify"
              className="pointer-events-auto px-2.5 py-1 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs font-bold backdrop-blur-md"
            >
              Get Verified
            </Link>
          )}

          <div className="px-3 py-1 rounded-full bg-[#17131F]/85 border border-[#7D7E92]/40 backdrop-blur-md flex items-center gap-1.5 shadow-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold text-[#ECE8F4]">{rep}% Rep</span>
          </div>
        </div>
      </div>

      {/* Identity & Location */}
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-white tracking-tight">
          {profile?.full_name || 'Anonymous'}{profile?.age ? `, ${profile.age}` : ''}
        </h2>
        <p className="text-sm font-semibold text-[#DDD8D4]">
          {profile?.city ? `${profile.city}, ` : ''}{profile?.country || 'Location not set'}
          {profile?.profession && (
            <>
              <span className="mx-2 text-[#7D7E92]">•</span>
              <span className="text-[#B6AEC7]">{profile.profession}</span>
            </>
          )}
        </p>
      </div>

      {/* Trust & Intent Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#241E2F] border border-[#7D7E92]/25 p-3.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#B6AEC7] block">
            Community Trust
          </span>
          <span className="text-sm sm:text-base font-extrabold text-[#ECE8F4] flex items-center gap-1.5 mt-0.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {rep}% Reputation
          </span>
        </div>

        <div className="rounded-2xl bg-[#241E2F] border border-[#7D7E92]/25 p-3.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#B6AEC7] block">
            Relationship Goal
          </span>
          <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 block truncate">
            {profile?.relationship_goal || 'Marriage'}
          </span>
        </div>
      </div>

      {/* Bio */}
      <div className="rounded-3xl bg-[#241E2F] border border-[#7D7E92]/25 p-5 space-y-2.5">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#B6AEC7]">
          About You
        </h3>
        <p className="text-sm sm:text-base text-[#F3EBF9] leading-relaxed font-medium">
          {profile?.bio || 'You haven’t added a bio yet. Tap "Edit Profile" above to share your story.'}
        </p>
      </div>
    </main>
  );
}