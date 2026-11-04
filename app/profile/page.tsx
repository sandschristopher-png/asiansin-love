'use client';

import { captureCurrentLocation, formatVerifiedDate } from '@/lib/location';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  MapPin,
  Languages,
  Edit3,
  Settings,
  Check,
  Camera,
  X,
  Loader2,
  Navigation,
  Clock,
  ShieldAlert,
  Mic,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { hardSignOut } from '@/lib/hardSignOut';
import { INTENT_OPTIONS, normalizeIntent, intentLabel } from '@/lib/intents';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { isPlusProfile } from '@/lib/plus';
import { createPortal } from 'react-dom';
import { useHideBottomNav } from '@/lib/bottomNavStore';
import { adminRoleOf } from '@/lib/adminRoles';
import RepScoreCard from '@/components/RepScoreCard';
import { ProfileHighlightsEditorRow } from '@/components/ProfileHighlightsEditorRow';
import { VoicePlayer } from '@/components/VoicePlayer';
import { VoiceRecordModal } from '@/components/VoiceRecordModal';
import { VisitingBadge, type TravelNotice } from '@/components/VisitingBadge';
import { DayOneBadge, NewMemberPill, VerifiedLocationBadge } from '@/components/profile/TrustBadges';
import { isTrustedVoiceIntroUrl } from '@/lib/audio';
import { BIO_REJECTION_MESSAGE } from '@/lib/moderation/textFilter';
import { RhythmPill, RhythmSelectors, rhythmFromRow, type RhythmValues } from '@/components/profile/RhythmBadges';
import { saveProfileFields } from '@/lib/profileApi';
import { useActionToast } from '@/components/ActionToast';
import { SelectSheet } from '@/components/SelectSheet';
import { HeightInput, LanguagePicker, LifestyleBadges, LifestylePills } from '@/components/profile/LifestyleFields';
import { languageLabel, readLanguages } from '@/lib/constants/languages';
import { LIFESTYLE_KEYS, formatHeight, readHeightCm, readLifestyle, type LifestyleValues } from '@/lib/lifestyle';

const INTENT_CHIP_OPTIONS = INTENT_OPTIONS;

const toIntentLabel = (v: unknown) => intentLabel(v) || String(v || '').trim();

const toIntentChipValue = (v: unknown): string => normalizeIntent(v) || 'serious_relationship';

const RELIGION_OPTIONS = ['Catholic', 'Christian', 'Buddhist', 'Muslim', 'Spiritual', 'None', 'Other'];
const MARITAL_OPTIONS = ['Never Married', 'Divorced', 'Widowed', 'Separated'];
const RELOCATION_OPTIONS = ['Can Relocate', 'Open to Either', 'Cannot Relocate', 'Other'];

const HOBBY_TAGS = [
  'Cooking & Food',
  'Beach & Ocean',
  'Island Hopping',
  'Family First',
  'Travel',
  'Movies & Cinema',
  'Music & Karaoke',
  'Fitness & Gym',
  'Health & Wellness',
  'Coffee & Cafes',
  'Hiking & Outdoors',
  'Faith & Church',
  'Homebody',
  'Nightlife & Bars',
  'Shopping & Malls',
  'Photography',
  'Pets & Animals',
  'Mobile Gaming & Esports',
  'Art & Design',
  'Business & Career'
];


// --- IN-MEMORY & SESSION PROFILE CACHE (ELIMINATES ROUTE FLASH) ---
let memoryProfileCache: any = null;
const getInitialProfileCache = () => {
  if (memoryProfileCache) return memoryProfileCache;
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('ail_profile_cache');
      if (stored) {
        memoryProfileCache = JSON.parse(stored);
        return memoryProfileCache;
      }
    } catch {}
  }
  return null;
};

const updateProfileCache = (data: any) => {
  memoryProfileCache = { ...(memoryProfileCache || {}), ...data };
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('ail_profile_cache', JSON.stringify(memoryProfileCache));
    } catch {}
  }
};

export default function MyProfilePage() {
  const router = useRouter();

  const initialProfile = getInitialProfileCache();

  const [loading, setLoading] = useState(!initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  // Editing: the floating BottomNav would cover the form, so it steps aside for a pinned Save bar.
  useHideBottomNav(isEditing);
  // Main photo awaiting admin review (photo_review_status from 20261112, avatar_status before it).
  const [photoPending, setPhotoPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [name, setName] = useState<string>(() => initialProfile?.name ?? '');
  const [username, setUsername] = useState<string>(() => initialProfile?.username ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => initialProfile?.avatarUrl ?? null);
  const [photos, setPhotos] = useState<string[]>(() => initialProfile?.photos ?? []);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const justSwiped = useRef(false);
  const [age, setAge] = useState<number>(() => initialProfile?.age ?? 25);
  const [location, setLocation] = useState<string>(() => initialProfile?.location ?? '');
  const [locationSource, setLocationSource] = useState<'gps_verified' | 'self_reported'>(() => initialProfile?.locationSource ?? 'self_reported');
  const [locationVerifiedAt, setLocationVerifiedAt] = useState<string | null>(() => initialProfile?.locationVerifiedAt ?? null);
  const [latitude, setLatitude] = useState<number | null>(() => initialProfile?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(() => initialProfile?.longitude ?? null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [bio, setBio] = useState<string>(() => initialProfile?.bio ?? '');
  const [rhythm, setRhythm] = useState<RhythmValues>(() => rhythmFromRow(initialProfile));
  const [saveError, setSaveError] = useState<string | null>(null);
  const [bioRejected, setBioRejected] = useState(false);
  const [lookingFor, setLookingFor] = useState<string>(() => initialProfile?.lookingFor ?? '');
  const [interests, setInterests] = useState<string[]>(() => initialProfile?.interests ?? []);

  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified'>(
    () => initialProfile?.verificationStatus ?? 'unverified'
  );
  const [isPlus, setIsPlus] = useState<boolean>(() => initialProfile?.isPlus ?? false);
  const [repScore, setRepScore] = useState<number | null>(() => initialProfile?.repScore ?? null);

  const [profession, setProfession] = useState<string>(() => initialProfile?.profession ?? '');
  const [intent, setIntent] = useState<string>(() => initialProfile?.intent ?? '');
  const [religion, setReligion] = useState<string>(() => initialProfile?.religion ?? 'Christian');
  const [maritalStatus, setMaritalStatus] = useState<string>(() => initialProfile?.maritalStatus ?? 'Never Married');
  const [hasKids, setHasKids] = useState<string>(() => initialProfile?.hasKids ?? 'No');
  const [wantsKids, setWantsKids] = useState<string>(() => initialProfile?.wantsKids ?? 'Yes');
  const [relocation, setRelocation] = useState<string>(() => initialProfile?.relocation ?? 'Can Relocate');
  const [userLanguages, setUserLanguages] = useState<string>(() => initialProfile?.userLanguages ?? 'English');
  const [heightCm, setHeightCm] = useState<number | null>(() => readHeightCm(initialProfile?.heightCm, initialProfile?.height));
  const [voiceIntroUrl, setVoiceIntroUrl] = useState<string | null>(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [dayOneNumber, setDayOneNumber] = useState<number | null>(() => initialProfile?.dayOneNumber ?? null);
  const [createdAt, setCreatedAt] = useState<string | null>(() => initialProfile?.createdAt ?? null);
  const [travel, setTravel] = useState<TravelNotice | null>(() => initialProfile?.travel ?? null);
  const [lifestyle, setLifestyle] = useState<LifestyleValues>(() => initialProfile?.lifestyle ?? {});

  useEffect(() => {
    async function loadUserData() {
      // Local session read (no extra network round trip before the profile query); RLS still applies.
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        const resolvedUsername =
          (data.username && !data.username.startsWith('user_') ? data.username : '') ||
          data.display_name ||
          data.full_name ||
          'Member';
        setUsername(resolvedUsername);
        setName(data.display_name || data.full_name || resolvedUsername);
        if (data.age) setAge(data.age);
        const locStr = data.location || [data.city, data.country].filter(Boolean).join(', ');
        if (locStr) setLocation(locStr);
        if (data.location_source) setLocationSource(data.location_source);
        if (data.location_verified_at) setLocationVerifiedAt(data.location_verified_at);
        if (data.latitude) setLatitude(data.latitude);
        if (data.longitude) setLongitude(data.longitude);
        if (data.bio) setBio(data.bio);
        setRhythm(rhythmFromRow(data));
        if (data.looking_for) setLookingFor(data.looking_for);
        if (Array.isArray(data.interests)) {
          const retired = new Set(['nature walks', 'gaming', 'entrepreneurship']);
          setInterests(data.interests.filter((t: string) => !retired.has(String(t || '').trim().toLowerCase())));
        }
        if (data.occupation) setProfession(data.occupation);
        if (data.relationship_intent || data.intentions) setIntent(toIntentChipValue(data.relationship_intent || data.intentions));
        if (data.religion) setReligion(data.religion);
        if (data.marital_status) setMaritalStatus(data.marital_status);
        if (data.has_kids) setHasKids(data.has_kids);
        if (data.wants_kids) setWantsKids(data.wants_kids);
        if (data.relocation) setRelocation(data.relocation);
        if (data.languages) setUserLanguages(readLanguages(data.languages).join(', '));
        setIsPlus(isPlusProfile(data));
        setPhotoPending(
          adminRoleOf(data) !== 'super_admin' &&
            data.photo_review_status !== 'approved' &&
            (data.photo_review_status === 'pending' || data.avatar_status === 'pending_review')
        );
        if (typeof data.reputation_score === 'number') setRepScore(data.reputation_score);

        setHeightCm(readHeightCm(data.height_cm, data.height));
        const nextLifestyle = Object.fromEntries(LIFESTYLE_KEYS.map((k) => [k, readLifestyle(k, data[k])])) as LifestyleValues;
        setLifestyle(nextLifestyle);
        setVoiceIntroUrl(data.voice_intro_url ?? null);
        const nextDayOne: number | null = data.is_day_one && Number.isInteger(data.day_one_number) ? data.day_one_number : null;
        const nextTravel: TravelNotice | null =
          data.is_travel_mode_active && data.visiting_city
            ? { city: data.visiting_city, country: data.visiting_country ?? null, dates: data.visiting_dates ?? null }
            : null;
        setDayOneNumber(nextDayOne);
        setCreatedAt(data.created_at ?? null);
        setTravel(nextTravel);
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
        if (data.verification_status) {
          setVerificationStatus(data.verification_status);
        } else if (data.is_verified) {
          setVerificationStatus('verified');
        }
        if (Array.isArray(data.photos) && data.photos.length > 0) {
          setPhotos(data.photos.filter(Boolean));
        } else if (data.avatar_url) {
          setPhotos([data.avatar_url]);
        }
        // Sync to instant memory cache
        updateProfileCache({
            name: data.display_name || data.full_name || resolvedUsername,
            username: resolvedUsername,
            avatarUrl: data.avatar_url || null,
            photos: Array.isArray(data.photos) && data.photos.length > 0 ? data.photos.filter(Boolean) : (data.avatar_url ? [data.avatar_url] : []),
            age: data.age || 25,
            location: locStr,
            locationSource: data.location_source || 'self_reported',
            locationVerifiedAt: data.location_verified_at || null,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            bio: data.bio || '',
            lookingFor: data.looking_for || '',
            interests: Array.isArray(data.interests) ? data.interests : [],
            verificationStatus: data.verification_status || (data.is_verified ? 'verified' : 'unverified'),
            isPlus: isPlusProfile(data),
            repScore: typeof data.reputation_score === 'number' ? data.reputation_score : null,
            profession: data.occupation || '',
            intent: toIntentChipValue(data.relationship_intent || data.intentions),
            religion: data.religion || 'Christian',
            maritalStatus: data.marital_status || 'Never Married',
            hasKids: data.has_kids || 'No',
            wantsKids: data.wants_kids || 'Yes',
            relocation: data.relocation || 'Can Relocate',
            ...rhythmFromRow(data),
            userLanguages: readLanguages(data.languages).join(', ') || 'English',
            heightCm: readHeightCm(data.height_cm, data.height),
            lifestyle: Object.fromEntries(LIFESTYLE_KEYS.map((k) => [k, readLifestyle(k, data[k])])),
            dayOneNumber: nextDayOne,
            createdAt: data.created_at ?? null,
            travel: nextTravel,
          });
      }
      setLoading(false);
    }
    loadUserData();
  }, [router]);

  const currentLanguages = readLanguages(userLanguages);

  const toggleHobby = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Photo delete (edit mode): /api/profile/photo keeps at least one photo, promotes the next one
  // when the main photo goes, and removes the file from storage.
  const showActionToast = useActionToast();
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const handleDeletePhoto = async (url: string) => {
    const gallery = photos.length > 0 ? photos : avatarUrl ? [avatarUrl] : [];
    if (gallery.length <= 1) {
      setPhotoNotice('Profiles require at least one photo.');
      return;
    }
    setPhotoNotice(null);
    setDeletingPhoto(url);
    try {
      const res = await fetch('/api/profile/photo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not remove the photo.');
      if (Array.isArray(data.photos)) setPhotos(data.photos);
      if (typeof data.avatar_url === 'string') setAvatarUrl(data.avatar_url);
      setCurrentPhotoIdx(0);
      showActionToast('Photo deleted', 'check');
    } catch (err) {
      setPhotoNotice(err instanceof Error ? err.message : 'Could not remove the photo.');
    } finally {
      setDeletingPhoto(null);
    }
  };

  const removeVoiceIntro = async () => {
    try {
      const res = await fetch('/api/profile/voice-intro', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setVoiceIntroUrl(null);
      showActionToast('Voice intro removed', 'check');
    } catch {
      showActionToast('Could not remove your voice intro', 'info');
    }
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Contact details are masked server-side (lib/moderation/profileModerator); only payment /
    // commercial terms are refused, so there is no client-side pre-block any more.
    setBioRejected(false);

    const payload: Record<string, unknown> = {
      display_name: name || username,
      full_name: name || username,
      age: age && !isNaN(Number(age)) ? Number(age) : null,
      location,
      // The server only accepts a downgrade to self-reported; GPS verification is server-granted.
      location_source: locationSource,
      bio: bio.trim(),
      ...rhythm,
      looking_for: lookingFor.trim(),
      interests,
      occupation: profession,
      relationship_intent: intent,
      intentions: intent,
      religion,
      marital_status: maritalStatus,
      has_kids: hasKids,
      wants_kids: wantsKids,
      relocation,
      languages: currentLanguages,
      height_cm: heightCm,
      ...lifestyle,
    };

    if (latitude) payload.latitude = latitude;
    if (longitude) payload.longitude = longitude;

    setSaving(true);
    setSaveError(null);
    // One screened, whitelisted save for every field (bio, rhythm, vitals, location...).
    const result = await saveProfileFields(payload);
    setSaving(false);

    if (result.ok) {
      if (result.sanitized?.bio !== undefined) setBio(result.sanitized.bio);
      if (result.sanitized?.looking_for !== undefined) setLookingFor(result.sanitized.looking_for);
      if (result.sanitized?.occupation !== undefined) setProfession(result.sanitized.occupation);
      if (result.notice) showActionToast(result.notice, 'info');
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } else if (result.field === 'bio') {
      setBioRejected(true);
      showActionToast(result.error || BIO_REJECTION_MESSAGE, 'info');
    } else {
      setSaveError(result.error);
    }
  };

  if (loading) {
    // Same shapes as the loaded page (4:5 photo, action bar, rep card, sections) so nothing jumps.
    return (
      <div className="flex-1 w-full bg-[#F8F7FA] px-4 pt-4 space-y-5" aria-busy="true" aria-label="Loading profile">
        <div className="h-14 rounded-3xl ail-shimmer" />
        <div className="aspect-[4/5] w-full rounded-3xl ail-shimmer" />
        <div className="h-11 rounded-2xl ail-shimmer" />
        <div className="h-24 rounded-3xl ail-shimmer" />
        <div className="h-20 rounded-3xl ail-shimmer" />
        <div className="h-28 rounded-3xl ail-shimmer" />
      </div>
    );
  }

  const photoList = Array.isArray(photos) && photos.length > 0 ? photos : avatarUrl ? [avatarUrl] : [];
  const currentImg = photoList[currentPhotoIdx] || avatarUrl;
  const hasMultiple = photoList.length > 1;

  return (
    <div className="flex-1 flex flex-col w-full bg-[#F8F7FA] text-[#1C1924] font-sans">
      <main className="flex-1 w-full px-4 pt-4 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] space-y-5">
        {saveError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start justify-between gap-3">
            <span>{saveError}</span>
            <button type="button" onClick={() => setSaveError(null)} className="underline shrink-0">
              Dismiss
            </button>
          </div>
        )}
        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profile changes saved!</span>
          </div>
        )}

        {/* Framed 4:5 Portrait Card */}
        <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden bg-white border border-[#DDD7E5] flex items-center justify-center select-none shadow-xs">
          {currentImg ? (
            <div
              className="w-full h-full cursor-pointer"
              onClick={(e) => {
                if (justSwiped.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const isLeft = e.clientX - rect.left < rect.width / 2;
                setCurrentPhotoIdx((prev) =>
                  isLeft
                    ? (prev - 1 + photoList.length) % Math.max(photoList.length, 1)
                    : (prev + 1) % Math.max(photoList.length, 1)
                );
              }}
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                const startX = touchStartX.current;
                if (startX == null) return;
                const dx = e.changedTouches[0].clientX - startX;
                if (Math.abs(dx) > 40) {
                  justSwiped.current = true;
                  setTimeout(() => { justSwiped.current = false; }, 400);
                  setCurrentPhotoIdx((prev) =>
                    dx > 0
                      ? (prev - 1 + photoList.length) % Math.max(photoList.length, 1)
                      : (prev + 1) % Math.max(photoList.length, 1)
                  );
                }
                touchStartX.current = null;
              }}
            >
              <img src={currentImg} alt={username} className="w-full h-full object-cover pointer-events-none" draggable={false} />
            </div>
          ) : (
            <Link href="/profile/edit" className="flex flex-col items-center justify-center text-[#6555B8] p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F3EFFC] flex items-center justify-center mb-2">
                <Camera className="w-7 h-7" />
              </div>
              <span className="text-sm font-semibold text-[#1C1924]">Add Your Profile Photos</span>
              <span className="text-xs text-[#6C637B] mt-0.5">Upload up to 6 photos</span>
            </Link>
          )}

          <div className="absolute top-4 left-4 z-10">
            <NewMemberPill createdAt={createdAt} />
          </div>
          <div className="absolute top-4 right-4 z-10" title="Online">
            <span className="presence-dot h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white/90 shadow block" />
          </div>

          {/* Photo Manager Pill */}
          <Link
            href="/profile/edit"
            className="absolute bottom-3.5 right-3.5 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium hover:bg-black/70 transition shadow-sm"
          >
            <Camera className="w-3.5 h-3.5 text-white/90" />
            <span>{photoList.length > 0 ? photoList.length : 'Add'}</span>
          </Link>

          {hasMultiple && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
              {photoList.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentPhotoIdx(idx)}
                  className={'h-1.5 rounded-full transition-all ' + (idx === currentPhotoIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/50')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Photo gallery (edit mode): delete badges, 1-photo minimum */}
        {isEditing && photoList.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex gap-2 overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
              {photoList.map((url, idx) => (
                <div key={url} className="relative w-20 aspect-[3/4] shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-[#ECE8F4]">
                  <img src={url} alt={idx === 0 ? 'Main photo' : `Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full bg-[#6555B8]/90 text-white text-[9px] font-semibold">
                      Main
                    </span>
                  )}
                  {photoList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(url)}
                      disabled={deletingPhoto !== null}
                      aria-label={`Delete photo ${idx + 1}`}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-red-600 transition-colors z-10 disabled:opacity-60"
                    >
                      {deletingPhoto === url ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {photoList.length <= 1 && (
              <p className="text-[11px] text-[#8C849B]">Profiles require at least one photo. Add another to replace this one.</p>
            )}
            {photoNotice && <p role="alert" className="text-[11px] font-semibold text-rose-600">{photoNotice}</p>}
          </div>
        )}

        {/* Identity Bar */}
        {isEditing ? (
          <div className="p-5 rounded-3xl bg-white border border-[#DDD7E5] space-y-3.5 shadow-xs">
            <div>
              <label className="text-xs font-semibold text-[#1C1924] block mb-1">Username</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#DDD7E5] text-sm font-medium text-[#1C1924] focus:outline-none focus:border-[#6555B8] focus:ring-2 focus:ring-[#6555B8]/15"
              />
            </div>
            <div className="grid grid-cols-[96px_1fr] gap-3">
              <div>
                <label className="text-xs font-semibold text-[#1C1924] block mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#DDD7E5] text-sm font-medium text-[#1C1924] focus:outline-none focus:border-[#6555B8] focus:ring-2 focus:ring-[#6555B8]/15"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#1C1924] block mb-1">City &amp; Country</label>
                <input
                  type="text"
                  title={location}
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setLocationSource('self_reported');
                  }}
                  className="w-full min-w-0 text-ellipsis overflow-hidden px-3.5 py-2.5 rounded-2xl bg-white border border-[#DDD7E5] text-[13px] font-medium text-[#1C1924] focus:outline-none focus:border-[#6555B8] focus:ring-2 focus:ring-[#6555B8]/15"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isLocating}
              onClick={async () => {
                setIsLocating(true);
                setLocError(null);
                const res = await captureCurrentLocation();
                setIsLocating(false);
                if (res.success && res.data) {
                  setLocation(res.data.city + ', ' + res.data.country);
                  setLocationSource('self_reported');
                  setLocationVerifiedAt(null);
                  setLatitude(res.data.latitude);
                  setLongitude(res.data.longitude);
                } else if (res.error) {
                  setLocError(res.error);
                }
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-[#F3EFFC] border border-[#6555B8]/25 hover:bg-[#EAE4F7] text-xs font-semibold text-[#6555B8] flex items-center justify-center gap-1.5 transition"
            >
              {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
              <span>{isLocating ? 'Detecting GPS...' : 'Auto-Detect City with GPS'}</span>
            </button>
            {locError && <p className="text-[11px] text-rose-600 text-center">{locError}</p>}
          </div>
        ) : (
          <div className="space-y-2 px-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className="text-2xl font-black text-[#2D264B] tracking-tight truncate"
                  style={{ fontFamily: 'var(--font-brand)' }}
                >
                  {username.replace(/^@/, '')}{age ? ', ' + age : ''}
                </h2>
                {isPlus && <PlusBadge size="profile" />}
                {verificationStatus === 'verified' && (
                  <span title="Verified Member">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#6555B8] shrink-0" />
                <p className="text-xs font-medium text-[#6C637B] truncate">
                  {location || 'Location not set'}
                </p>
              </div>
            </div>

            {photoPending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAF8FD] border border-[#ECE8F4] text-[10px] font-semibold text-neutral-500 shrink-0">
                <Clock className="w-3 h-3" aria-hidden />
                Photo Pending
              </span>
            )}
          </div>

          {/* Trust row: Verified Location + Day 1 cohort */}
          {(locationSource === 'gps_verified' || dayOneNumber) && (
            <div className="flex items-center gap-2 flex-wrap">
              {locationSource === 'gps_verified' && (
                <VerifiedLocationBadge
                  title={locationVerifiedAt ? 'Location confirmed ' + formatVerifiedDate(locationVerifiedAt) : 'Location confirmed'}
                />
              )}
              <DayOneBadge number={dayOneNumber} />
            </div>
          )}

          {/* Upcoming travel notice (Plus) */}
          <VisitingBadge travel={travel} />
          </div>
        )}

        {/* Discreet Verification Status Card */}
        {verificationStatus !== 'verified' && verificationStatus !== 'pending' && (
          <Link
            href="/verify"
            className="w-full p-3.5 rounded-2xl bg-[#F3EFFC]/70 border border-[#6555B8]/20 flex items-center justify-between hover:bg-[#F3EFFC] transition shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#6555B8] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#1C1924]">Verify your profile</p>
                <p className="text-[11px] text-[#6C637B]">Free for every member. Verified profiles get more replies.</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#6555B8]">Verify &rarr;</span>
          </Link>
        )}

        {/* VOICE INTRO */}
        {isTrustedVoiceIntroUrl(voiceIntroUrl) ? (
          <VoicePlayer src={voiceIntroUrl} title="Voice Intro" subtitle="Members hear it only when they tap play">
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setVoiceModalOpen(true)}
                aria-label="Re-record voice intro"
                className="w-8 h-8 rounded-full text-neutral-400 hover:text-[#8C71F5] hover:bg-[#FAF8FD] flex items-center justify-center transition-colors"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={removeVoiceIntro}
                aria-label="Remove voice intro"
                className="w-8 h-8 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </VoicePlayer>
        ) : (
          <div className="p-5 rounded-3xl border-2 border-dashed border-[#6555B8]/30 bg-[#F3EFFC]/50 text-center space-y-2">
            <div className="w-11 h-11 mx-auto rounded-2xl bg-[#6555B8]/10 text-[#6555B8] flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#2D264B]">Add a 20-Second Voice Intro</h3>
            <p className="text-xs text-[#6C637B] leading-relaxed">
              Profiles with a voice intro receive 3x more sparks. Say hello and introduce yourself.
            </p>
            <button
              type="button"
              onClick={() => setVoiceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#6555B8] text-white text-xs font-semibold shadow-sm active:scale-95 transition"
            >
              <Mic className="w-3.5 h-3.5" /> Record Voice Intro
            </button>
          </div>
        )}
        <VoiceRecordModal open={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} onSaved={setVoiceIntroUrl} />

        {/* 2. REPUTATION */}
        <RepScoreCard score={repScore ?? 100} />

        {/* Edit / Save Action Bar */}
          <div className={`w-full flex items-stretch gap-2.5 ${isEditing ? '' : 'h-12'}`}>
            {isEditing ? (
              typeof document !== 'undefined' &&
              createPortal(
              <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[430px] bg-white/95 backdrop-blur-md border-t border-[#ECE8F4] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-stretch gap-2.5 h-[calc(4.5rem+env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="h-full flex-1 rounded-2xl bg-white border border-[#DDD7E5] text-xs font-semibold text-[#524B5E] hover:bg-[#F8F7FA] transition flex items-center justify-center shadow-xs cursor-pointer active:scale-[0.99]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-full flex-1 rounded-2xl bg-[#6555B8] border border-[#6555B8] text-white text-xs font-semibold hover:bg-[#52449e] transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>,
              document.body
              )
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="h-full w-full rounded-2xl bg-white border border-[#DDD7E5] text-xs font-semibold text-[#1C1924] hover:bg-[#F3EFFC] hover:border-[#6555B8]/40 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#6555B8]" />
                <span>Edit Profile Details</span>
              </button>
            )}
          </div>


        {/* ABOUT ME */}
        <div className="p-5 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold text-[#6555B8] uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              About Me
            </span>
            {isEditing && (
              <span className="text-[11px] font-medium text-[#8C849B]">{bio.length}/500</span>
            )}
          </div>
          {isEditing ? (
            <>
            <textarea
              value={bio}
              onChange={(e) => {
                setBio(e.target.value.slice(0, 500));
                if (bioRejected) setBioRejected(false);
              }}
              rows={4}
              aria-invalid={bioRejected}
              placeholder="Share your passions, daily life, and what makes you smile..."
              className={`w-full p-3.5 rounded-2xl bg-[#F8F7FA] border text-base sm:text-sm text-[#1C1924] leading-relaxed placeholder-[#8C849B] focus:outline-none focus:bg-white resize-none ${
                bioRejected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-[#DDD7E5] focus:border-[#6555B8]'
              }`}
            />
            {bioRejected && (
              <p className="text-[11px] font-medium text-amber-700">
                Remove links, social handles, phone numbers, emails and payment apps. You can trade contact details in chat once you have matched.
              </p>
            )}
            </>
          ) : (
            <p className="text-xs sm:text-sm text-[#1C1924] leading-relaxed">
              {bio || <span className="text-[#8C849B] italic">No bio written yet.</span>}
            </p>
          )}
        </div>

        {/* PROFILE HIGHLIGHTS */}
        <ProfileHighlightsEditorRow />

        {/* INTERESTS & HOBBIES */}
        <div className="p-5 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold text-[#6555B8] uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              Interests &amp; Hobbies
            </span>
          </div>

          {isEditing ? (
            <div className="flex flex-wrap gap-1.5">
              {HOBBY_TAGS.map((tag) => {
                const selected = interests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleHobby(tag)}
                    className={
                      'px-3 py-1.5 rounded-xl text-xs font-medium border transition ' +
                      (selected
                        ? 'bg-[#6555B8] border-[#6555B8] text-white shadow-2xs'
                        : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:bg-[#F3EFFC]')
                    }
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {interests.length > 0 ? (
                interests.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-[#F3EFFC] border border-[#6555B8]/25 text-xs font-semibold text-[#6555B8]"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#8C849B] italic">Tap Edit Profile Details to add your hobbies.</span>
              )}
            </div>
          )}
        </div>

        {/* WHAT THEY'RE LOOKING FOR */}
        <div className="p-5 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold text-[#6555B8] uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              What They&apos;re Looking For
            </span>
            {!isEditing && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F3EFFC] text-[#6555B8]">
                Goals
              </span>
            )}
          </div>
          {isEditing ? (
            <div className="relative">
              <textarea
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value.slice(0, 200))}
                rows={3}
                placeholder="Describe the partner and relationship you are looking for..."
                className="w-full px-4 pt-3 pb-7 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5] text-xs sm:text-sm text-[#1C1924] leading-relaxed placeholder-[#8C849B] focus:outline-none focus:bg-white focus:border-[#6555B8] resize-none"
              />
              <span className="absolute right-3 bottom-2 text-xs text-[#8A839E] pointer-events-none">
                {lookingFor.length}/200
              </span>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-[#1C1924] leading-relaxed">
              {lookingFor ? toIntentLabel(lookingFor) : <span className="text-[#8C849B] italic">No preferences added yet.</span>}
            </p>
          )}
        </div>

        {/* MY RHYTHM (reply pace, relocation, timeline) */}
        <div className="p-5 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-2.5">
          <h3 className="block text-xs font-bold text-[#6555B8] uppercase tracking-wider leading-normal">
            My Rhythm
          </h3>
          {isEditing ? (
            <RhythmSelectors value={rhythm} onChange={setRhythm} />
          ) : rhythm.reply_pace || rhythm.relocation_readiness || rhythm.timeline_intent ? (
            <div className="flex flex-wrap gap-1.5">
              <RhythmPill field="reply_pace" value={rhythm.reply_pace} className="text-[11px] px-2.5 py-1" />
              <RhythmPill field="relocation_readiness" value={rhythm.relocation_readiness} className="text-[11px] px-2.5 py-1" />
              <RhythmPill field="timeline_intent" value={rhythm.timeline_intent} className="text-[11px] px-2.5 py-1" />
            </div>
          ) : (
            <p className="text-xs text-[#8C849B] italic">
              Tap Edit Profile Details to show how you message, relocation plans and your timeline.
            </p>
          )}
        </div>

        {/* VITALS & LIFESTYLE */}
        <div className="p-5 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-4">
          <h3
            className="text-xs font-bold text-[#6555B8] uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-brand)' }}
          >
            Vitals &amp; Lifestyle
          </h3>

          <div className="space-y-3.5 pt-1 text-xs">
            {/* Future Plans (3-Chip Picker in Edit Mode) */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F0EDF5]">
              <span className="font-semibold text-[#6C637B]">Future Plans</span>
              {isEditing ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {INTENT_CHIP_OPTIONS.map((chip) => {
                    const selected = intent === chip.value;
                    return (
                      <button
                        key={chip.value}
                        type="button"
                        onClick={() => setIntent(chip.value)}
                        className={
                          'px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ' +
                          (selected
                            ? 'bg-[#6555B8] text-white border-[#6555B8]'
                            : 'bg-white text-[#524B5E] border-[#DDD7E5]')
                        }
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="font-semibold text-[#1C1924]">{toIntentLabel(intent) || 'Not specified'}</span>
              )}
            </div>

            {/* Height */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F0EDF5]">
              <span className="font-semibold text-[#6C637B]">Height</span>
              {isEditing ? (
                <HeightInput valueCm={heightCm} onChange={setHeightCm} />
              ) : (
                <span className="font-semibold text-[#1C1924]">{formatHeight(heightCm) || 'Not specified'}</span>
              )}
            </div>

            {/* Occupation */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F0EDF5]">
              <span className="font-semibold text-[#6C637B]">Occupation</span>
              {isEditing ? (
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. Nurse, Engineer"
                  className="px-3 py-1.5 rounded-xl bg-[#F8F7FA] border border-[#DDD7E5] text-xs font-semibold text-[#1C1924] focus:outline-none focus:border-[#6555B8]"
                />
              ) : (
                <span className="font-semibold text-[#1C1924]">{profession || 'Not specified'}</span>
              )}
            </div>

            {/* Marital Status */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F0EDF5]">
              <span className="font-semibold text-[#6C637B]">Marital Status</span>
              {isEditing ? (
                <SelectSheet
                  label="Marital Status"
                  value={maritalStatus}
                  options={MARITAL_OPTIONS}
                  onChange={setMaritalStatus}
                />
              ) : (
                <span className="font-semibold text-[#1C1924]">{maritalStatus || 'Not specified'}</span>
              )}
            </div>

            {/* Religion */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F0EDF5]">
              <span className="font-semibold text-[#6C637B]">Beliefs</span>
              {isEditing ? (
                <SelectSheet
                  label="Beliefs"
                  value={religion}
                  options={RELIGION_OPTIONS}
                  onChange={setReligion}
                />
              ) : (
                <span className="font-semibold text-[#1C1924]">{religion || 'Not specified'}</span>
              )}
            </div>

            {/* Relocation */}
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[#6C637B]">Relocation</span>
              {isEditing ? (
                <SelectSheet
                  label="Relocation"
                  value={relocation}
                  options={RELOCATION_OPTIONS}
                  onChange={setRelocation}
                />
              ) : (
                <span className="font-semibold text-[#1C1924]">{relocation || 'Not specified'}</span>
              )}
            </div>
          </div>
        </div>

        {/* LANGUAGES SPOKEN */}
        <div className="p-5 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-3">
          <h3
            className="text-xs font-bold text-[#6555B8] uppercase tracking-wider flex items-center gap-1.5"
            style={{ fontFamily: 'var(--font-brand)' }}
          >
            <Languages className="w-4 h-4 text-[#6555B8]" />
            <span>Languages Spoken</span>
          </h3>

          {isEditing ? (
            <LanguagePicker
              value={currentLanguages}
              onChange={(next) => setUserLanguages(next.join(', '))}
            />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {currentLanguages.length > 0 ? (
                currentLanguages.map((lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1 rounded-full bg-[#F8F7FA] border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                  >
                    {languageLabel(lang)}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#8C849B]">English</span>
              )}
            </div>
          )}
        </div>

        {/* LIFESTYLE */}
        <div className="p-5 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#6555B8] uppercase tracking-wider" style={{ fontFamily: 'var(--font-brand)' }}>
            Lifestyle
          </h3>
          {isEditing ? (
            <LifestylePills values={lifestyle} onChange={(field, value) => setLifestyle((prev) => ({ ...prev, [field]: value }))} />
          ) : (
            <LifestyleBadges values={lifestyle} />
          )}
          {!isEditing && !LIFESTYLE_KEYS.some((k) => lifestyle[k]) && (
            <p className="text-xs text-[#8C849B]">Add your lifestyle in Edit to help matches get to know you.</p>
          )}
        </div>

      </main>
    </div>
  );
}