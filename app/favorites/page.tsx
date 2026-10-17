'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Loader2, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface FavoriteProfile {
  id: string;
  name: string;
  age?: number;
  location?: string;
  verified?: boolean;
  repScore?: number;
  avatarUrl?: string;
  photoUrl?: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadFavorites() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);

        const { data: favRecords, error: favErr } = await supabase
          .from('favorites')
          .select('favorite_id')
          .eq('user_id', user.id);

        if (favErr) throw favErr;

        if (!favRecords || favRecords.length === 0) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        const profileIds = favRecords.map((r: { favorite_id: string }) => r.favorite_id);

        const { data: profs, error: profErr } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, photos, reputation_score, age, city, country, location_source, is_verified')
          .in('id', profileIds);

        if (profErr) throw profErr;

        const mapped: FavoriteProfile[] = (profs || []).map((p: any) => {
          const rawName = p.username || p.display_name || 'Member';
          const cleanName = rawName.startsWith('user_') ? 'Member' : rawName;
          const firstPhoto = Array.isArray(p.photos) && p.photos.length > 0 ? p.photos[0] : (p.avatar_url || '/placeholder-avatar.svg');

          return {
            id: p.id,
            name: cleanName,
            age: p.age,
            location: [p.city, p.country].filter(Boolean).join(', ') || 'Global',
            verified: p.is_verified ?? false,
            repScore: p.reputation_score || 98,
            avatarUrl: p.avatar_url || '/placeholder-avatar.svg',
            photoUrl: firstPhoto,
          };
        });

        setFavorites(mapped);
      } catch (err) {
        console.error('Error loading favorites:', err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err)));
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, []);

  const handleRemoveFavorite = async (profileId: string) => {
    if (!userId) return;

    setFavorites((prev) => prev.filter((p) => p.id !== profileId));

    try {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('favorite_id', profileId);
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FA] text-[#1C1924]">
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 pb-32 md:pb-24 space-y-5">

        {/* Section Heading */}
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#1C1924]" style={{ fontFamily: 'var(--font-brand)' }}>
            Sparks
          </h1>
          <p className="text-xs text-[#756D82] mt-0.5">Profiles you&apos;ve sparked with</p>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-7 h-7 text-[#6555b8] animate-spin mx-auto" />
            <p className="text-xs sm:text-sm text-[#756D82]">Loading your sparks...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="py-16 sm:py-24 text-center">
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#F0EBF8] text-[#6555b8] flex items-center justify-center mx-auto transition-transform">
                <Zap className="w-6 h-6 fill-[#6555B8]" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-base sm:text-lg font-medium text-[#1C1924]">No sparks yet</h2>
                <p className="text-xs sm:text-sm text-[#756D82] leading-relaxed">
                  When you discover someone who stands out, tap the spark button on their profile card to save them here.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/discover"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#6555b8] hover:bg-[#52449e] text-xs sm:text-sm font-semibold text-white transition active:scale-95 shadow-sm"
                >
                  Explore Discover Feed
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 w-full">
            {favorites.map((profile) => {
              const cityPart = profile.location ? profile.location.split(',')[0].trim() : '';
              return (
                <div
                  key={profile.id}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/5] w-full bg-[#F2EEF7] border border-[#DDD7E5]/70 shadow-xs hover:shadow-md transition-all duration-300 select-none"
                >
                  <Link href={'/profile/' + profile.id} className="absolute inset-0 z-0">
                    <img
                      src={profile.photoUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                    />
                  </Link>

                  {/* Rep Pill */}
                  <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-xs text-[10px] font-semibold text-white">
                      <span>{profile.repScore ? profile.repScore + '% Rep' : '100% Rep'}</span>
                    </div>
                  </div>

                  {/* Un-spark Button */}
                  <button
                    type="button"
                    aria-label="Remove Spark"
                    title="Remove Spark"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleRemoveFavorite(profile.id);
                    }}
                    className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-[#6555B8] hover:bg-[#52449e] text-white shadow-md transition-all duration-200 active:scale-90 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                  </button>

                  {/* Name / Location Overlay */}
                  <div className="absolute bottom-0 inset-x-0 pt-10 pb-3 px-3 z-10 pointer-events-none bg-gradient-to-t from-black/65 via-black/25 to-transparent">
                    <Link href={'/profile/' + profile.id} className="block min-w-0 pointer-events-auto">
                      <div className="flex items-center min-w-0">
                        <h3 className="text-sm font-bold text-white leading-tight truncate" style={{ fontFamily: 'var(--font-brand)' }}>
                          {profile.name}
                        </h3>
                        {profile.age ? (
                          <span className="text-sm font-bold text-white leading-tight shrink-0" style={{ fontFamily: 'var(--font-brand)' }}>
                            {', ' + profile.age}
                          </span>
                        ) : null}
                        {profile.verified && <CheckCircle className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                      </div>
                      <p className="text-[11px] text-white/90 font-medium mt-0.5 truncate pr-7">
                        {cityPart || 'Unknown'}
                      </p>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}