"use client";
import type { PublicProfileData } from "@/types/profile";

export function ProfileHero({ profile }: { profile: PublicProfileData }) {
  return (
    <div className="aspect-[4/5] w-full relative overflow-hidden rounded-3xl bg-neutral-100 shadow-sm">
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatar_url} alt={profile.full_name} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-neutral-300">
          {profile.full_name.charAt(0)}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 pt-20">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {profile.full_name}{profile.age ? `, ${profile.age}` : ""}
        </h1>
        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-200 mt-1">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
          {profile.city}{profile.country ? `, ${profile.country}` : ""}
        </div>
        {profile.is_verified && (
          <span className="mt-2 inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 backdrop-blur-sm">
            Verified
          </span>
        )}
      </div>
    </div>
  );
}