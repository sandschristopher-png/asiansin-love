'use client';

import { captureCurrentLocation, formatVerifiedDate } from '@/lib/location';
import { notifyUser } from '@/components/InAppToast';
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
  ChevronDown,
  Loader2,
  Navigation,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { hardSignOut } from '@/lib/hardSignOut';
import { INTENT_OPTIONS, normalizeIntent, intentLabel } from '@/lib/intents';
import RepScoreCard from '@/components/RepScoreCard';
import { ProfileHighlightsEditorRow } from '@/components/ProfileHighlightsEditorRow';

const QUICK_LANGUAGES = ['English', 'Tagalog', 'Thai', 'Japanese', 'Vietnamese', 'Mandarin', 'Spanish', 'Korean'];

const INTENT_CHIP_OPTIONS = INTENT_OPTIONS;

const toIntentLabel = (v: unknown) => intentLabel(v) || String(v || '').trim();

const toIntentChipValue = (v: unknown): string => normalizeIntent(v) || 'serious_relationship';

const RELIGION_OPTIONS = ['Catholic', 'Christian', 'Buddhist', 'Muslim', 'Spiritual', 'None', 'Other'];
const MARITAL_OPTIONS = ['Never Married', 'Divorced', 'Widowed', 'Separated'];
const RELOCATION_OPTIONS = ['Can Relocate', 'Open to Either', 'Cannot Relocate', 'Other'];

const HEIGHT_OPTIONS = [
  '4\'8" (142 cm)', '4\'9" (145 cm)', '4\'10" (147 cm)', '4\'11" (150 cm)',
  '5\'0" (152 cm)', '5\'1" (155 cm)', '5\'2" (157 cm)', '5\'3" (160 cm)',
  '5\'4" (163 cm)', '5\'5" (165 cm)', '5\'6" (168 cm)', '5\'7" (170 cm)',
  '5\'8" (173 cm)', '5\'9" (175 cm)', '5\'10" (178 cm)', '5\'11" (180 cm)',
  '6\'0" (183 cm)', '6\'1" (185 cm)', '6\'2" (188 cm)', '6\'3" (191 cm)',
  '6\'4" (193 cm)', '6\'5" (196 cm)', '6\'6" (198 cm)', '6\'7" (201 cm)'
];

const WEIGHT_OPTIONS = [
  '40 kg (88 lbs)', '42 kg (93 lbs)', '45 kg (99 lbs)', '48 kg (106 lbs)',
  '50 kg (110 lbs)', '52 kg (115 lbs)', '55 kg (121 lbs)', '58 kg (128 lbs)',
  '60 kg (132 lbs)', '63 kg (139 lbs)', '65 kg (143 lbs)', '68 kg (150 lbs)',
  '70 kg (154 lbs)', '73 kg (161 lbs)', '75 kg (165 lbs)', '78 kg (172 lbs)',
  '80 kg (176 lbs)', '85 kg (187 lbs)', '90 kg (198 lbs)', '95 kg (209 lbs)',
  '100 kg (220 lbs)', '105 kg (231 lbs)', '110 kg (243 lbs)', '115 kg (254 lbs)',
  '120 kg (265 lbs)'
];

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
  const [height, setHeight] = useState<string>(() => initialProfile?.height ?? '');
  const [weight, setWeight] = useState<string>(() => initialProfile?.weight ?? '');
  const [drinking, setDrinking] = useState<string>(() => initialProfile?.drinking ?? 'No');
  const [smoking, setSmoking] = useState<string>(() => initialProfile?.smoking ?? 'No');
  const [langInput, setLangInput] = useState('');

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
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
        if (data.languages) {
          setUserLanguages(Array.isArray(data.languages) ? data.languages.join(', ') : data.languages);
        }
        if (data.is_plus) setIsPlus(true);
        if (typeof data.reputation_score === 'number') setRepScore(data.reputation_score);

        if (data.height) {
          const raw = String(data.height).trim();
          const cmMatch = raw.match(/(\d+)\s*cm/i);
          if (cmMatch) {
            const matchedOption = HEIGHT_OPTIONS.find((opt) => opt.includes('(' + cmMatch[1] + ' cm)'));
            setHeight(matchedOption || raw);
          } else {
            setHeight(raw);
          }
        }
        if (data.weight) setWeight(data.weight);
        if (data.drinking) setDrinking(data.drinking);
        if (data.smoking) setSmoking(data.smoking);
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
            isPlus: Boolean(data.is_plus),
            repScore: typeof data.reputation_score === 'number' ? data.reputation_score : null,
            profession: data.occupation || '',
            intent: toIntentChipValue(data.relationship_intent || data.intentions),
            religion: data.religion || 'Christian',
            maritalStatus: data.marital_status || 'Never Married',
            hasKids: data.has_kids || 'No',
            wantsKids: data.wants_kids || 'Yes',
            relocation: data.relocation || 'Can Relocate',
            userLanguages: data.languages ? (Array.isArray(data.languages) ? data.languages.join(', ') : data.languages) : 'English',
            height: data.height || '',
            weight: data.weight || '',
            drinking: data.drinking || 'No',
            smoking: data.smoking || 'No',
          });
      }
      setLoading(false);
    }
    loadUserData();
  }, [router]);

  const currentLanguages = userLanguages
    ? userLanguages.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  const handleAddLanguage = (lang: string) => {
    const trimmed = lang.trim();
    if (!trimmed) return;
    if (!currentLanguages.some((l: string) => l.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...currentLanguages, trimmed].join(', ');
      setUserLanguages(updated);
    }
    setLangInput('');
  };

  const handleRemoveLanguage = (langToRemove: string) => {
    const updated = currentLanguages.filter((l: string) => l.toLowerCase() !== langToRemove.toLowerCase()).join(', ');
    setUserLanguages(updated);
  };

  const extractUnit = (label: string, unit: string): string | null => {
    const m = String(label).match(new RegExp('\\((\\d+) ' + unit + '\\)'));
    return m ? m[1] : null;
  };

  const toggleHobby = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload: Record<string, any> = {
      id: user.id,
      display_name: name || username,
      full_name: name || username,
      age: age && !isNaN(Number(age)) ? Number(age) : null,
      location,
      location_source: locationSource,
      location_verified_at: locationVerifiedAt,
      bio: bio.trim(),
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
      languages: userLanguages,
      height: (() => { const cm = extractUnit(height, 'cm') || (/^\\d+$/.test(String(height)) ? String(height) : null); return cm ? cm + ' cm' : null; })(),
weight: (() => { const kg = extractUnit(weight, 'kg') || (/^\\d+$/.test(String(weight)) ? String(weight) : null); return kg ? kg + ' kg' : null; })(),
      drinking,
      smoking,
      updated_at: new Date().toISOString(),
    };

    if (latitude) payload.latitude = latitude;
    if (longitude) payload.longitude = longitude;

    setSaving(true);
    const { error } = await supabase.from('profiles').upsert(payload);
    setSaving(false);

    if (!error) {
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } else {
      notifyUser({ senderName: 'Profile', avatarUrl: '', message: 'Could not update profile: ' + error.message, chatUrl: '/profile' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6555B8]" />
      </div>
    );
  }

  const photoList = Array.isArray(photos) && photos.length > 0 ? photos : avatarUrl ? [avatarUrl] : [];
  const currentImg = photoList[currentPhotoIdx] || avatarUrl;
  const hasMultiple = photoList.length > 1;

  return (
    <div className="flex-1 flex flex-col w-full bg-[#F8F7FA] text-[#1C1924] font-sans">
      <main className="flex-1 w-full px-4 pt-4 pb-24 space-y-5">
        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profile changes saved!</span>
          </div>
        )}

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-end gap-2">
          <Link
            href="/profile/edit"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#DDD7E5] bg-white hover:bg-[#F3EFFC] text-xs font-semibold text-[#6555B8] transition shadow-2xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photos</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#DDD7E5] bg-white hover:bg-[#F8F7FA] text-xs font-semibold text-[#524B5E] hover:text-[#1C1924] transition shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5 text-[#6555B8]" />
            <span>Settings</span>
          </Link>
        </div>

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
            <div className="grid grid-cols-2 gap-3">
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
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setLocationSource('self_reported');
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#DDD7E5] text-sm font-medium text-[#1C1924] focus:outline-none focus:border-[#6555B8] focus:ring-2 focus:ring-[#6555B8]/15"
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
                  setLocationSource('gps_verified');
                  setLocationVerifiedAt(new Date().toISOString());
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
          <div className="flex items-center justify-between gap-2 px-1">
            <div>
              <div className="flex items-center gap-2">
                <h2
                className="text-xl sm:text-[22px] font-bold text-[#1C1924] tracking-tight"
                style={{ fontFamily: 'var(--font-brand)' }}
              >
                {username.replace(/^@/, '')}{age ? ', ' + age : ''}
              </h2>
                {isPlus && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider shadow-2xs">
                    PLUS
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#6555B8]" />
                <p className="text-xs font-medium text-[#6C637B]">
                  {location || 'Location not set'}
                </p>
                {locationSource === 'gps_verified' && (
                  <span
                    title={locationVerifiedAt ? 'GPS Verified ' + formatVerifiedDate(locationVerifiedAt) : 'GPS Verified'}
                    className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700"
                  >
                    GPS
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              
              {verificationStatus === 'verified' ? (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified</span>
                </div>
              ) : verificationStatus === 'pending' ? (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Pending</span>
                </div>
              ) : (
                <Link
                  href="/verify"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F3EFFC] border border-[#DDD7E5] hover:border-[#6555B8] text-xs font-semibold text-[#6555B8] transition shadow-2xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-[#6555B8]" />
                  <span>Verify</span>
                </Link>
              )}
            </div>
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
            <span className="presence-dot h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white/90 shadow block" />
          </div>

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

        {/* Edit / Save Action Bar */}
          <div className="h-12 w-full flex items-stretch gap-2.5">
            {isEditing ? (
              <>
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
              </>
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

        <RepScoreCard score={repScore ?? 100} />

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
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="Share your passions, daily life, and what makes you smile..."
              className="w-full p-3.5 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5] text-xs sm:text-sm text-[#1C1924] leading-relaxed placeholder-[#8C849B] focus:outline-none focus:bg-white focus:border-[#6555B8] resize-none"
            />
          ) : (
            <p className="text-xs sm:text-sm text-[#1C1924] leading-relaxed">
              {bio || <span className="text-[#8C849B] italic">No bio written yet.</span>}
            </p>
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
            {isEditing ? (
              <span className="text-[11px] font-medium text-[#8C849B]">{lookingFor.length}/200</span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F3EFFC] text-[#6555B8]">
                Goals
              </span>
            )}
          </div>
          {isEditing ? (
            <input
              type="text"
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value.slice(0, 200))}
              placeholder="Describe the partner and relationship you are looking for..."
              className="w-full px-4 py-3 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5] text-xs sm:text-sm text-[#1C1924] placeholder-[#8C849B] focus:outline-none focus:bg-white focus:border-[#6555B8]"
            />
          ) : (
            <p className="text-xs sm:text-sm text-[#1C1924] leading-relaxed">
              {lookingFor ? toIntentLabel(lookingFor) : <span className="text-[#8C849B] italic">No preferences added yet.</span>}
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
                <div className="relative">
                  <select
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="appearance-none pr-8 pl-3 py-1.5 rounded-xl bg-[#F3EFFC] border border-[#6555B8]/20 text-xs font-semibold text-[#6555B8] focus:outline-none"
                  >
                    <option value="">Select height</option>
                    {HEIGHT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6555B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <span className="font-semibold text-[#1C1924]">{height || 'Not specified'}</span>
              )}
            </div>

            {/* Weight */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F0EDF5]">
              <span className="font-semibold text-[#6C637B]">Weight</span>
              {isEditing ? (
                <div className="relative">
                  <select
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="appearance-none pr-8 pl-3 py-1.5 rounded-xl bg-[#F3EFFC] border border-[#6555B8]/20 text-xs font-semibold text-[#6555B8] focus:outline-none"
                  >
                    <option value="">Select weight</option>
                    {WEIGHT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6555B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <span className="font-semibold text-[#1C1924]">{weight || 'Not specified'}</span>
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
                <div className="relative">
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="appearance-none pr-8 pl-3 py-1.5 rounded-xl bg-[#F3EFFC] border border-[#6555B8]/20 text-xs font-semibold text-[#6555B8] focus:outline-none"
                  >
                    {MARITAL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6555B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <span className="font-semibold text-[#1C1924]">{maritalStatus || 'Not specified'}</span>
              )}
            </div>

            {/* Religion */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F0EDF5]">
              <span className="font-semibold text-[#6C637B]">Beliefs</span>
              {isEditing ? (
                <div className="relative">
                  <select
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    className="appearance-none pr-8 pl-3 py-1.5 rounded-xl bg-[#F3EFFC] border border-[#6555B8]/20 text-xs font-semibold text-[#6555B8] focus:outline-none"
                  >
                    {RELIGION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6555B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <span className="font-semibold text-[#1C1924]">{religion || 'Not specified'}</span>
              )}
            </div>

            {/* Relocation */}
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[#6C637B]">Relocation</span>
              {isEditing ? (
                <div className="relative">
                  <select
                    value={relocation}
                    onChange={(e) => setRelocation(e.target.value)}
                    className="appearance-none pr-8 pl-3 py-1.5 rounded-xl bg-[#F3EFFC] border border-[#6555B8]/20 text-xs font-semibold text-[#6555B8] focus:outline-none"
                  >
                    {RELOCATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6555B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
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
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {currentLanguages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F3EFFC] border border-[#DDD7E5] text-xs font-semibold text-[#6555B8]"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(lang)}
                      className="hover:text-rose-600 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add language"
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5] text-xs font-semibold text-[#1C1924] focus:outline-none focus:border-[#6555B8]"
                />
                <button
                  type="button"
                  onClick={() => handleAddLanguage(langInput)}
                  className="px-4 py-2 rounded-2xl bg-[#6555B8] text-white text-xs font-semibold hover:bg-[#52449e] transition"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {QUICK_LANGUAGES.map((ql) => (
                  <button
                    key={ql}
                    type="button"
                    onClick={() => handleAddLanguage(ql)}
                    className="px-2.5 py-1 rounded-xl bg-[#F8F7FA] border border-[#DDD7E5] text-[11px] font-medium text-[#524B5E] hover:border-[#6555B8] hover:text-[#6555B8] transition"
                  >
                    + {ql}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {currentLanguages.length > 0 ? (
                currentLanguages.map((lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1 rounded-full bg-[#F8F7FA] border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                  >
                    {lang}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#8C849B]">English</span>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}