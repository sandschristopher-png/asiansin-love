'use client';

import { captureCurrentLocation, formatVerifiedDate } from '@/lib/location';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ShieldCheck, MapPin, Briefcase, Flower2, Heart, Languages, 
  Globe, User, Edit3, Settings, Save, Check, Camera, X, ChevronDown, 
  Baby, Sparkles, HeartHandshake, Ruler, Wine, Cigarette, Loader2, 
  Navigation, CheckCircle2, Clock, ShieldAlert 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Footer } from '@/components/Footer';

export const QUICK_LANGUAGES = ['English', 'Tagalog', 'Thai', 'Japanese', 'Vietnamese', 'Mandarin', 'Spanish', 'Korean'];

export const NATIONALITY_OPTIONS = [
  'Philippines',
  'Vietnam',
  'Thailand',
  'Cambodia',
  'Indonesia',
  'Malaysia',
  'Singapore',
  'Laos',
  'Myanmar (Burma)',
  'Timor-Leste',
  'Brunei',
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Japan',
  'South Korea',
  'Taiwan',
  'Other'
];

const INTENT_OPTIONS = ['Marriage & Kids', 'Marriage', 'Marriage (No Kids)', 'Life Partner'];
const RELIGION_OPTIONS = ['Catholic', 'Christian', 'Buddhist', 'Muslim', 'Spiritual', 'None', 'Other'];
const MARITAL_OPTIONS = ['Never Married', 'Divorced', 'Widowed', 'Separated'];
const HAS_KIDS_OPTIONS = ['No', 'Yes (Lives with me)', 'Yes (Lives away)'];
const WANTS_KIDS_OPTIONS = ['Yes', 'Open', 'No'];
const RELOCATION_OPTIONS = ['Can Relocate', 'Open to Either', 'Cannot Relocate', 'Other'];
const DRINKING_OPTIONS = ['No', 'Socially', 'Yes'];
const SMOKING_OPTIONS = ['No', 'Occasionally', 'Yes'];

const HEIGHT_OPTIONS = [
  `4'10" (147 cm)`, `4'11" (150 cm)`,
  `5'0" (152 cm)`, `5'1" (155 cm)`, `5'2" (157 cm)`, `5'3" (160 cm)`,
  `5'4" (163 cm)`, `5'5" (165 cm)`, `5'6" (168 cm)`, `5'7" (170 cm)`,
  `5'8" (173 cm)`, `5'9" (175 cm)`, `5'10" (178 cm)`, `5'11" (180 cm)`,
  `6'0" (183 cm)`, `6'1" (185 cm)`, `6'2" (188 cm)`, `6'3" (191 cm)`,
  `6'4" (193 cm)`, `6'5" (196 cm)`, `6'6" (198 cm)`, `6'7" (201 cm)`
];

export default function MyProfilePage() {
  const router = useRouter();

  // Basic Information State
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [name, setName] = useState('Christopher');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [age, setAge] = useState(30);
  const [location, setLocation] = useState('Las Vegas, NV');
  const [locationSource, setLocationSource] = useState<'gps_verified' | 'self_reported'>('self_reported');
  const [locationVerifiedAt, setLocationVerifiedAt] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [bio, setBio] = useState('Down-to-earth tech professional with a passion for creative projects, travel, and honest conversations. Looking for someone grounded who values intentional courtship and a genuine future.');
  const [lookingFor, setLookingFor] = useState('A sincere, patient, and grounded partner who values family, communicates openly, and is ready for an intentional cross-border commitment.');
  
  // Verification State
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');

  // Vitals
  const [profession, setProfession] = useState('Software Developer');
  const [intent, setIntent] = useState('Marriage & Kids');
  const [religion, setReligion] = useState('Christian');
  const [maritalStatus, setMaritalStatus] = useState('Never Married');
  const [hasKids, setHasKids] = useState('No');
  const [wantsKids, setWantsKids] = useState('Yes');
  const [relocation, setRelocation] = useState('Can Relocate');
  const [userLanguages, setUserLanguages] = useState('English');
  const [height, setHeight] = useState(`5'10" (178 cm)`);
  const [drinking, setDrinking] = useState('Socially');
  const [smoking, setSmoking] = useState('No');
  
  // Dropdown States
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        if (data.name) setName(data.name);
        if (data.age) setAge(data.age);
        if (data.location) setLocation(data.location);
        if (data.location_source) setLocationSource(data.location_source);
        if (data.location_verified_at) setLocationVerifiedAt(data.location_verified_at);
        if (data.latitude) setLatitude(data.latitude);
        if (data.longitude) setLongitude(data.longitude);
        if (data.bio) setBio(data.bio);
        if (data.looking_for) setLookingFor(data.looking_for);
        if (data.occupation) setProfession(data.occupation);
        if (data.intentions) setIntent(data.intentions);
        if (data.religion) setReligion(data.religion);
        if (data.marital_status) setMaritalStatus(data.marital_status);
        if (data.has_kids) setHasKids(data.has_kids);
        if (data.wants_kids) setWantsKids(data.wants_kids);
        if (data.relocation) setRelocation(data.relocation);
        if (data.languages) setUserLanguages(data.languages);
        if (data.height) setHeight(data.height);
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
      }
      setLoading(false);
    }
    loadUserData();
  }, [router]);

  const [langInput, setLangInput] = useState('');

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

  const handleLangKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddLanguage(langInput);
    }
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const payload: any = {
        id: user.id,
        name, display_name: name,
        age: Number(age),
        location,
        location_source: locationSource,
        location_verified_at: locationVerifiedAt,
        bio,
        looking_for: lookingFor,
        occupation: profession,
        intentions: intent,
        religion,
        marital_status: maritalStatus,
        has_kids: hasKids,
        wants_kids: wantsKids,
        relocation,
        languages: userLanguages,
        height,
        drinking,
        smoking,
        updated_at: new Date().toISOString()
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
        alert('Could not update profile: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6555B8]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F7FA] text-[#1C1924] flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 pb-28 space-y-6">

        {/* Top Navbar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DDD7E5]">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-2xl bg-white border border-[#DDD7E5] text-[#1C1924] hover:bg-[#F3EFFC] flex items-center justify-center text-sm active:scale-95 transition shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 text-[#1C1924]" />
          </button>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#6555b8]" />
            <h1 className="text-xl font-bold text-[#1C1924] tracking-tight">
              My Profile
            </h1>
          </div>
          <Link
            href="/settings"
            className="h-10 w-10 rounded-2xl bg-white border border-[#DDD7E5] text-[#1C1924] hover:bg-[#F3EFFC] flex items-center justify-center text-sm active:scale-95 transition shadow-xs"
          >
            <Settings className="w-5 h-5 text-[#1C1924]" />
          </Link>
        </div>

        {/* Main Grid: Left preview photo card & Right vitals */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start" ref={dropdownRef}>
          
          {/* Left Column: Visual card & actions */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Header info over photo */}
            {isEditing ? (
              <div className="p-4 rounded-3xl bg-white border border-[#E5E1EC] space-y-3 shadow-xs">
                <div>
                  <label className="text-[10px] font-bold text-[#6555B8] uppercase tracking-wider">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-[#FAFAFC] border border-[#DDD7E5] text-sm font-semibold text-[#1C1924] focus:outline-none focus:border-[#6555B8]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#6555B8] uppercase tracking-wider">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full mt-1 p-2.5 rounded-xl bg-[#FAFAFC] border border-[#DDD7E5] text-sm font-semibold text-[#1C1924] focus:outline-none focus:border-[#6555B8]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6555B8] uppercase tracking-wider">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setLocationSource('self_reported');
                      }}
                      className="w-full mt-1 p-2.5 rounded-xl bg-[#FAFAFC] border border-[#DDD7E5] text-sm font-semibold text-[#1C1924] focus:outline-none focus:border-[#6555B8]"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    disabled={isLocating}
                    onClick={async () => {
                      setIsLocating(true);
                      setLocError(null);
                      const res = await captureCurrentLocation();
                      setIsLocating(false);
                      if (res.success && res.data) {
                        const formatted = `${res.data.city}, ${res.data.country}`;
                        setLocation(formatted);
                        setLocationSource('gps_verified');
                        setLocationVerifiedAt(new Date().toISOString());
                        if (res.data.latitude) setLatitude(res.data.latitude);
                        if (res.data.longitude) setLongitude(res.data.longitude);
                      } else if (res.error) {
                        setLocError(res.error);
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#F3EFFC] border border-[#DDD7E5] hover:bg-[#EAE4F7] text-xs font-semibold text-[#6555B8] flex items-center justify-center gap-1.5 transition active:scale-98"
                  >
                    {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                    <span>{isLocating ? 'Detecting Location...' : 'Detect & Verify with GPS'}</span>
                  </button>
                  {locError && <p className="text-[11px] text-rose-600 mt-1 text-center">{locError}</p>}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-1">
                <div>
                  <h1 className="text-xl sm:text-[22px] font-semibold text-[#1C1924] tracking-tight">
                    {name}, {age}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-xs font-medium text-[#1C1924]">
                      {location}
                    </p>
                    {locationSource === 'gps_verified' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3EFFC] border border-[#DDD7E5] text-[11px] font-medium text-[#6555B8]">
                        <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>Verified {locationVerifiedAt ? formatVerifiedDate(locationVerifiedAt) : ''}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F3EFFC] border border-[#9A8CC3]/25 text-[10px] font-medium text-[#8C849B]">
                        Self-Reported
                      </span>
                    )}
                  </div>
                </div>

                {/* Verification Status Pill */}
                {verificationStatus === 'verified' ? (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 shrink-0 shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified</span>
                  </div>
                ) : verificationStatus === 'pending' ? (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700 shrink-0 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>Review Pending</span>
                  </div>
                ) : (
                  <Link
                    href="/verify"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3EFFC] border border-[#DDD7E5] hover:border-[#6555B8] text-[11px] font-bold text-[#6555B8] shrink-0 transition active:scale-95 shadow-xs"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#6555B8]" />
                    <span>Get Verified</span>
                  </Link>
                )}
              </div>
            )}

            {/* Framed Photo Container */}
            {(() => {
              const photoList = (typeof photos !== 'undefined' && Array.isArray(photos) && photos.length > 0)
                ? photos
                : (avatarUrl ? [avatarUrl] : []);
              const currentImg = photoList[currentPhotoIdx] || avatarUrl;
              const hasMultiple = photoList.length > 1;

              return (
                <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden bg-white border border-[#DDD7E5] flex items-center justify-center select-none shadow-xs group">
                  {currentImg ? (
                    <img
                      src={currentImg}
                      alt={name}
                      className="w-full h-full object-cover transition-opacity duration-200"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-[#8C849B] p-6 text-center">
                      <div className="w-20 h-20 rounded-3xl bg-[#F8F7FA] border border-[#DDD7E5] flex items-center justify-center shadow-inner">
                        <User className="w-10 h-10 stroke-[1.5] text-[#8C849B]" />
                      </div>
                      <Link
                        href="/profile/edit"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6555B8] hover:underline"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Upload Profile Photo</span>
                      </Link>
                    </div>
                  )}

                  {/* Story Dashes */}
                  {hasMultiple && (
                    <div className="absolute top-3 left-3 right-3 flex items-center gap-1.5 z-20 pointer-events-none">
                      {photoList.map((_, idx) => (
                        <div
                          key={idx}
                          className={'h-1 flex-1 rounded-full transition-all duration-300 ' + (
                            idx === currentPhotoIdx
                              ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]'
                              : 'bg-white/40 backdrop-blur-sm'
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {/* Touch / Click zones for cycling photos */}
                  {hasMultiple && (
                    <>
                      <button
                        type="button"
                        aria-label="Previous photo"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPhotoIdx((prev) => (prev > 0 ? prev - 1 : photoList.length - 1));
                        }}
                        className="absolute inset-y-0 left-0 w-1/2 z-10 cursor-pointer focus:outline-none"
                      />
                      <button
                        type="button"
                        aria-label="Next photo"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPhotoIdx((prev) => (prev < photoList.length - 1 ? prev + 1 : 0));
                        }}
                        className="absolute inset-y-0 right-0 w-1/2 z-10 cursor-pointer focus:outline-none"
                      />
                    </>
                  )}

                  {/* Online Presence Badge */}
                  <div className={'absolute left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-emerald-400 border border-white/10 pointer-events-none ' + (
                    hasMultiple ? 'top-6' : 'top-3'
                  )}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online</span>
                  </div>
                </div>
              );
            })()}

            {/* Actions at Base */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#6555B8] hover:bg-[#52449e] text-xs font-bold text-white flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-[#6555B8]/20"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isEditing ? (
                  <Save className="w-3.5 h-3.5" />
                ) : (
                  <Edit3 className="w-3.5 h-3.5" />
                )}
                <span>{saving ? 'Saving...' : isEditing ? 'Save All Changes' : 'Edit Profile'}</span>
              </button>

              {isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setOpenDropdown(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#DDD7E5] hover:bg-[#F8F7FA] text-xs font-medium text-[#6C637B] flex items-center gap-1 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              ) : (
                <Link
                  href="/settings"
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#DDD7E5] hover:bg-[#F8F7FA] text-xs font-medium text-[#6C637B] flex items-center gap-1 transition"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </Link>
              )}
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 flex items-center justify-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Profile updated successfully!</span>
              </div>
            )}

          </div>

          {/* Right Column: Verification CTA, About Me & Vitals */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Identity Verification Prompt Card */}
            {verificationStatus === 'unverified' && (
              <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-[#F3EFFC] border border-[#DDD7E5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#6555B8]" />
                    <h2 className="text-sm font-bold text-[#1C1924]">Get Profile Verified</h2>
                  </div>
                  <p className="text-xs text-[#6C637B] leading-relaxed">
                    Complete a quick 5-second gesture selfie to verify your profile and earn the verified trust badge.
                  </p>
                </div>
                <Link
                  href="/verify"
                  className="px-4 py-2.5 rounded-xl bg-[#6555B8] hover:bg-[#52449e] text-xs font-bold text-white text-center whitespace-nowrap transition active:scale-95 shadow-md shadow-[#6555B8]/20"
                >
                  Start Verification
                </Link>
              </div>
            )}

            {verificationStatus === 'pending' && (
              <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200/80 shadow-xs flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-amber-900 block">Verification In Review</span>
                  <span className="text-amber-800/80">Our moderation team is reviewing your gesture photo. You will be notified once approved.</span>
                </div>
              </div>
            )}

            {/* Top Preview/Edit Status Banner */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E1EC] shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1C1924] uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#6555B8]" />
                  {isEditing ? 'Editing Your Profile' : 'Public Profile Preview'}
                </span>
                <span className="text-xs text-[#6C637B]">
                  {isEditing ? 'Remember to save changes' : 'Visible to verified members'}
                </span>
              </div>
              <p className="text-xs text-[#6C637B] pt-0.5">
                {isEditing 
                  ? 'Update your bio, preferences, and vitals below.' 
                  : 'This is the exact view verified singles see when viewing your profile.'}
              </p>
            </div>

            {/* ABOUT ME */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E1EC] shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-[#6555B8] uppercase tracking-wider">ABOUT ME</h3>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-[#FAFAFC] border border-[#E5E1EC] text-xs text-[#1C1924] focus:outline-none focus:border-[#6555B8] focus:bg-white transition-colors"
                />
              ) : (
                <p className="text-sm text-[#1C1924] leading-relaxed">
                  {bio}
                </p>
              )}
            </div>

            {/* WHAT I'M LOOKING FOR */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E1EC] shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-[#6555B8] uppercase tracking-wider">LOOKING FOR</h3>
              {isEditing ? (
                <textarea
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-[#FAFAFC] border border-[#E5E1EC] text-xs text-[#1C1924] focus:outline-none focus:border-[#6555B8] focus:bg-white transition-colors"
                />
              ) : (
                <p className="text-sm text-[#1C1924] leading-relaxed">
                  {lookingFor}
                </p>
              )}
            </div>

            {/* VITALS & VALUES GRID */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E1EC] shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-[#6555B8] uppercase tracking-wider">VITALS & INTENTIONS</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Intentions */}
                <div className="p-3 rounded-2xl bg-[#FAFAFC] border border-[#E5E1EC]">
                  <span className="text-[10px] font-bold text-[#8C849B] uppercase tracking-wider flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-[#6555B8]" />
                    Relationship Intent
                  </span>
                  {isEditing ? (
                    <select
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                      className="w-full mt-1.5 p-2 rounded-xl bg-white border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                    >
                      {INTENT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs font-semibold text-[#1C1924] mt-1">{intent}</p>
                  )}
                </div>

                {/* Profession */}
                <div className="p-3 rounded-2xl bg-[#FAFAFC] border border-[#E5E1EC]">
                  <span className="text-[10px] font-bold text-[#8C849B] uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#6555B8]" />
                    Occupation
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full mt-1.5 p-2 rounded-xl bg-white border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-[#1C1924] mt-1">{profession}</p>
                  )}
                </div>

                {/* Religion */}
                <div className="p-3 rounded-2xl bg-[#FAFAFC] border border-[#E5E1EC]">
                  <span className="text-[10px] font-bold text-[#8C849B] uppercase tracking-wider flex items-center gap-1.5">
                    <Flower2 className="w-3.5 h-3.5 text-[#6555B8]" />
                    Beliefs / Religion
                  </span>
                  {isEditing ? (
                    <select
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                      className="w-full mt-1.5 p-2 rounded-xl bg-white border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                    >
                      {RELIGION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs font-semibold text-[#1C1924] mt-1">{religion}</p>
                  )}
                </div>

                {/* Marital Status */}
                <div className="p-3 rounded-2xl bg-[#FAFAFC] border border-[#E5E1EC]">
                  <span className="text-[10px] font-bold text-[#8C849B] uppercase tracking-wider flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-[#6555B8]" />
                    Marital Status
                  </span>
                  {isEditing ? (
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full mt-1.5 p-2 rounded-xl bg-white border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                    >
                      {MARITAL_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs font-semibold text-[#1C1924] mt-1">{maritalStatus}</p>
                  )}
                </div>

                {/* Kids Status */}
                <div className="p-3 rounded-2xl bg-[#FAFAFC] border border-[#E5E1EC]">
                  <span className="text-[10px] font-bold text-[#8C849B] uppercase tracking-wider flex items-center gap-1.5">
                    <Baby className="w-3.5 h-3.5 text-[#6555B8]" />
                    Children
                  </span>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      <select
                        value={hasKids}
                        onChange={(e) => setHasKids(e.target.value)}
                        className="p-1.5 rounded-lg bg-white border border-[#DDD7E5] text-[11px] font-semibold text-[#1C1924]"
                      >
                        {HAS_KIDS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>Has: {opt}</option>
                        ))}
                      </select>
                      <select
                        value={wantsKids}
                        onChange={(e) => setWantsKids(e.target.value)}
                        className="p-1.5 rounded-lg bg-white border border-[#DDD7E5] text-[11px] font-semibold text-[#1C1924]"
                      >
                        {WANTS_KIDS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>Wants: {opt}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-[#1C1924] mt-1">Has {hasKids} • Wants {wantsKids}</p>
                  )}
                </div>

                {/* Relocation */}
                <div className="p-3 rounded-2xl bg-[#FAFAFC] border border-[#E5E1EC]">
                  <span className="text-[10px] font-bold text-[#8C849B] uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#6555B8]" />
                    Relocation Willingness
                  </span>
                  {isEditing ? (
                    <select
                      value={relocation}
                      onChange={(e) => setRelocation(e.target.value)}
                      className="w-full mt-1.5 p-2 rounded-xl bg-white border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                    >
                      {RELOCATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs font-semibold text-[#1C1924] mt-1">{relocation}</p>
                  )}
                </div>

                {/* Height */}
                <div className="p-3 rounded-2xl bg-[#FAFAFC] border border-[#E5E1EC]">
                  <span className="text-[10px] font-bold text-[#8C849B] uppercase tracking-wider flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-[#6555B8]" />
                    Height
                  </span>
                  {isEditing ? (
                    <select
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full mt-1.5 p-2 rounded-xl bg-white border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                    >
                      {HEIGHT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs font-semibold text-[#1C1924] mt-1">{height}</p>
                  )}
                </div>

                {/* Habits: Drinking & Smoking */}
                <div className="p-3 rounded-2xl bg-[#FAFAFC] border border-[#E5E1EC]">
                  <span className="text-[10px] font-bold text-[#8C849B] uppercase tracking-wider flex items-center gap-1.5">
                    <Wine className="w-3.5 h-3.5 text-[#6555B8]" />
                    Habits (Drink / Smoke)
                  </span>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      <select
                        value={drinking}
                        onChange={(e) => setDrinking(e.target.value)}
                        className="p-1.5 rounded-lg bg-white border border-[#DDD7E5] text-[11px] font-semibold text-[#1C1924]"
                      >
                        {DRINKING_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>Drink: {opt}</option>
                        ))}
                      </select>
                      <select
                        value={smoking}
                        onChange={(e) => setSmoking(e.target.value)}
                        className="p-1.5 rounded-lg bg-white border border-[#DDD7E5] text-[11px] font-semibold text-[#1C1924]"
                      >
                        {SMOKING_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>Smoke: {opt}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-[#1C1924] mt-1">Drink: {drinking} • Smoke: {smoking}</p>
                  )}
                </div>

              </div>
            </div>

            {/* LANGUAGES SPOKEN */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E1EC] shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-[#6555B8] uppercase tracking-wider flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-[#6555B8]" />
                Languages Spoken
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
                      placeholder="Add language (press Enter)"
                      value={langInput}
                      onChange={(e) => setLangInput(e.target.value)}
                      onKeyDown={handleLangKeyDown}
                      className="flex-1 p-2.5 rounded-xl bg-[#FAFAFC] border border-[#DDD7E5] text-xs font-semibold text-[#1C1924] focus:outline-none focus:border-[#6555B8]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddLanguage(langInput)}
                      className="px-4 py-2.5 rounded-xl bg-[#6555B8] text-white text-xs font-bold hover:bg-[#52449e] transition"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] font-bold text-[#8C849B] mr-1 uppercase">Quick Add:</span>
                    {QUICK_LANGUAGES.map((ql) => (
                      <button
                        key={ql}
                        type="button"
                        onClick={() => handleAddLanguage(ql)}
                        className="px-2 py-0.5 rounded-lg bg-[#FAFAFC] border border-[#DDD7E5] text-[11px] font-medium text-[#6C637B] hover:border-[#6555B8] hover:text-[#6555B8] transition"
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
                    <span className="text-xs text-[#8C849B]">No languages specified</span>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      <Footer />
    </main>
  );
}