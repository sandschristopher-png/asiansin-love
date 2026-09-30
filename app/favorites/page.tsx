'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Heart, ArrowRight, MapPin, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface FavoriteProfile {
  id: string;
  name: string;
  age?: number;
  location?: string;
  location_source?: string;
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
          .select('favorite_profile_id')
          .eq('user_id', user.id);

        if (favErr) throw favErr;

        if (!favRecords || favRecords.length === 0) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        const profileIds = favRecords.map((r: { favorite_profile_id: string }) => r.favorite_profile_id);

        const { data: profs, error: profErr } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, photos, reputation_score, age, location, location_source, verified')
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
            location: p.location,
            location_source: p.location_source,
            verified: p.verified,
            repScore: p.reputation_score || 98,
            avatarUrl: p.avatar_url || '/placeholder-avatar.svg',
            photoUrl: firstPhoto,
          };
        });

        setFavorites(mapped);
      } catch (err) {
        console.error('Error loading favorites:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, []);

  const handleRemoveFavorite = async (profileId: string) => {
    if (!userId) return;

    // Optimistically remove from UI
    setFavorites((prev) => prev.filter((p) => p.id !== profileId));

    try {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('favorite_profile_id', profileId);
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-32 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1924]">Saved Profiles</h1>
          <p className="text-xs sm:text-sm text-[#756D82] mt-1">
            Members bookmarked for sincere courtship and intentional conversation.
          </p>
        </div>

        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#DDD7E5] text-xs font-semibold text-[#524B5E] hover:text-[#1C1924] hover:bg-[#F3EFFC] transition shadow-xs"
        >
          <span>Discover Feed</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-7 h-7 text-[#6555b8] animate-spin mx-auto" />
          <p className="text-xs sm:text-sm text-[#756D82]">Loading your saved profiles...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#DDD7E5] p-8 sm:p-12 shadow-xs text-center">
          <div className="space-y-4 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#F3EFFC] text-[#6555b8] flex items-center justify-center mx-auto shadow-xs">
              <Bookmark className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-[#1C1924]">No Saved Profiles Yet</h2>
              <p className="text-xs sm:text-sm text-[#756D82] leading-relaxed">
                When someone matches your values and relationship goals, bookmark them to keep their profile accessible here.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/discover"
                className="inline-flex px-6 py-2.5 rounded-full bg-[#6555b8] hover:bg-[#52449e] text-xs sm:text-sm font-semibold text-white transition active:scale-95 shadow-md"
              >
                Explore Profiles
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5 w-full">
          {favorites.map((profile) => (
            <div
              key={profile.id}
              className="group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-[#E5E1EC] hover:border-[#6555b8]/35 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              {/* Photo Container */}
              <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#F2EEF7]">
                <Link href={'/profile/' + profile.id} className="absolute inset-0 z-0">
                  <img
                    src={profile.photoUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {/* Reputation Badge */}
                {profile.repScore !== undefined && (
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-white">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{profile.repScore}%</span>
                  </div>
                )}

                {/* Gradient for bottom action button */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                {/* Un-favorite Button */}
                <div className="absolute bottom-2.5 right-2.5 z-20">
                  <button
                    type="button"
                    aria-label="Remove from saved"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleRemoveFavorite(profile.id);
                    }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-rose-500 hover:bg-rose-600 border border-rose-400 text-white shadow-md transition-all active:scale-90"
                    title="Remove from bookmarks"
                  >
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                  </button>
                </div>
              </div>

              {/* Profile Details */}
              <div className="p-3.5 sm:p-4 bg-white">
                <Link href={'/profile/' + profile.id} className="block group-hover:opacity-95">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-sm sm:text-base font-bold text-[#1C1924] flex items-center gap-1.5 truncate">
                      {profile.name}{profile.age ? `, ${profile.age}` : ''}
                      {profile.verified && <CheckCircle className="w-3.5 h-3.5 text-[#6555b8] shrink-0" />}
                    </h3>
                  </div>
                  <p className="text-xs font-medium text-[#756D82] flex items-center gap-1.5 truncate">
                    <MapPin
                      className={'w-3 h-3 shrink-0 ' + (
                        profile.location_source === 'gps_verified' ? 'text-emerald-500' : 'text-[#8C849B]'
                      )}
                    />
                    <span className="truncate">{profile.location ? profile.location.split(',')[0] : 'Unknown'}</span>
                  </p>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
