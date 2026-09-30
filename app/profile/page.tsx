'use client';

import { captureCurrentLocation, formatVerifiedDate } from '@/lib/location';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ShieldCheck, MapPin, Briefcase, Flower2, Heart, Languages, Globe, User, Edit3, Settings, Save, Check, Camera, X, ChevronDown, Baby, Sparkles, HeartHandshake, Ruler, Wine, Cigarette, Loader2, Navigation, CheckCircle2 } from 'lucide-react';
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
const RELIGION_OPTIONS = ['Catholic', 'Christian', 'Buddhist', 'Muslim', 'Spiritual', 'None',
  'Other'
];
const MARITAL_OPTIONS = ['Never Married', 'Divorced', 'Widowed', 'Separated'];
const HAS_KIDS_OPTIONS = ['No', 'Yes (Lives with me)', 'Yes (Lives away)'];
const WANTS_KIDS_OPTIONS = ['Yes', 'Open', 'No'];
const RELOCATION_OPTIONS = ['Can Relocate', 'Open to Either', 'Cannot Relocate',
  'Other'
];
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
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Profile data
  const [name, setName] = useState('Christopher');
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
  
  const [avatarUrl, setAvatarUrl] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

      if (latitude !== null) payload.latitude = latitude;
      if (longitude !== null) payload.longitude = longitude;

      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) {
        console.error('Supabase profile save error:', error);
        alert('Failed to save profile: ' + error.message);
        return;
      }
    }
    setSaveSuccess(true);
    setIsEditing(false);
    setOpenDropdown(null);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const renderDropdownPill = (
    label: string,
    value: string, 
    options: string[], 
    setter: (val: string) => void, 
    dropdownKey: string,
    Icon: any,
    scrollable: boolean = false
  ) => {
    const isOpen = openDropdown === dropdownKey;
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3EFFC] border border-[#E2DAEF] hover:border-[#9A8CC3] text-xs font-medium text-[#1C1924] transition active:scale-95"
        >
          <Icon className="w-3.5 h-3.5 text-[#9A8CC3] shrink-0" />
          <span className="text-[#D5CEE5]/70">{label}:</span>
          <span className="font-semibold text-[#1C1924]">{value}</span>
          <ChevronDown className={`w-3 h-3 text-[#9A8CC3] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className={`absolute left-0 top-full mt-1.5 w-48 rounded-2xl bg-[#F3EFFC] border border-[#E2DAEF] shadow-2xl py-1.5 z-50 overflow-y-auto backdrop-blur-md ${scrollable ? 'max-h-52' : ''}`}>
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setter(opt);
                  setOpenDropdown(null);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs transition flex items-center justify-between ${
                  value === opt 
                    ? 'text-[#1C1924] font-bold bg-[#6555B8]/40' 
                    : 'text-[#D5CEE5] hover:bg-[#F3EFFC] hover:text-white'
                }`}
              >
                <span>{opt}</span>
                {value === opt && <Check className="w-3.5 h-3.5 text-[#1C1924]" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FA] flex items-center justify-center text-[#9A8CC3] text-xs">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FA] text-[#1C1924]">
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4 pb-28 md:pb-32" ref={dropdownRef}>
        
        {/* Navigation & Status */}
        <div className="flex items-center justify-between">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9A8CC3] hover:text-[#1C1924] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Discover</span>
          </Link>

          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30">
              <Check className="w-3.5 h-3.5" />
              Changes Saved
            </span>
          )}
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Top Masthead with Framed Photo */}
          <div className="md:col-span-5 rounded-3xl bg-[#F3EFFC] border border-[#E2DAEF] shadow-sm p-4 sm:p-5 space-y-4">
            
            {/* Header Up Top */}
            {isEditing ? (
              <div className="space-y-3 pb-1 border-b border-[#9A8CC3]/25">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-[#9A8CC3]">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 rounded-xl bg-[#F3EFFC] border border-[#E2DAEF] text-xs text-[#1C1924] focus:outline-none focus:border-[#9A8CC3] [appearance:text-field] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#9A8CC3]">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-1.5 rounded-xl bg-[#F3EFFC] border border-[#E2DAEF] text-xs text-[#1C1924] focus:outline-none focus:border-[#9A8CC3] [appearance:text-field] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-[#9A8CC3]">Location</label>
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
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B2A4D7] hover:text-[#1C1924] transition disabled:opacity-50"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-[#B2A4D7]" />
                          <span>Detecting GPS...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3 h-3 text-[#B2A4D7]" />
                          <span>Detect Current Location</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={location}
                    placeholder="GPS location will appear here"
                    className="w-full mt-1.5 px-3 py-1.5 rounded-xl bg-[#F3EFFC]/50 border border-[#9A8CC3]/30 text-xs text-[#756D82] cursor-not-allowed focus:outline-none"
                  />
                  {locError && <p className="text-[10px] text-red-400 mt-1">{locError}</p>}
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2 pb-1">
                <div>
                  <h1 className="text-2xl font-bold text-[#1C1924] tracking-tight flex items-center gap-1.5">
                    {name}, {age}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-xs font-medium text-[#1C1924]">
                        {location}
                      </p>
                      {locationSource === 'gps_verified' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[11px] font-medium text-emerald-300">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Verified {locationVerifiedAt ? formatVerifiedDate(locationVerifiedAt) : ''}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F3EFFC] border border-[#9A8CC3]/25 text-[10px] font-medium text-[#B2A4D7]">
                          Self-Reported
                        </span>
                      )}
                    </div>
                  </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3EFFC] border border-[#E2DAEF] text-[11px] font-medium text-[#1C1924] shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B2A4D7]" />
                  <span>100% Rep</span>
                </div>
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
                <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#FFFFFF] to-[#FFFFFF] border border-[#9A8CC3]/30 flex items-center justify-center select-none group">
                  {currentImg ? (
                    <img
                      src={currentImg}
                      alt={name}
                      className="w-full h-full object-cover transition-opacity duration-200"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-[#9A8CC3]/60 p-6 text-center">
                      <div className="w-20 h-20 rounded-3xl bg-[#F3EFFC] border border-[#9A8CC3]/35 flex items-center justify-center shadow-inner">
                        <User className="w-10 h-10 stroke-[1.5] text-[#9A8CC3]" />
                      </div>
                      <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B2A4D7] hover:underline cursor-pointer">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Upload Profile Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={() => alert('Photo upload bucket integration next')} />
                      </label>
                    </div>
                  )}

                  {/* Story Dashes - only visible when more than 1 photo exists */}
                  {hasMultiple && (
                    <div className="absolute top-2.5 left-3 right-3 flex items-center gap-1.5 z-20 pointer-events-none">
                      {photoList.map((_, idx) => (
                        <div
                          key={idx}
                          className={'h-1 flex-1 rounded-full transition-all duration-300 ' + (
                            idx === currentPhotoIdx
                              ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]'
                              : 'bg-white/30 backdrop-blur-sm'
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
                className="flex-1 py-2.5 rounded-xl bg-[#6555B8] hover:bg-[#7D4B9F] text-xs font-bold text-white flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-[#6555B8]/40"
              >
                {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditing ? 'Save All Changes' : 'Edit Profile'}</span>
              </button>

              {isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setOpenDropdown(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#F3EFFC] border border-[#9A8CC3]/35 hover:bg-[#3B1E42] text-xs font-medium text-[#B2A4D7] hover:text-[#1C1924] flex items-center gap-1 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              ) : (
                <Link
                  href="/settings"
                  className="px-4 py-2.5 rounded-xl bg-[#F3EFFC] border border-[#9A8CC3]/35 hover:bg-[#3B1E42] text-xs font-medium text-[#B2A4D7] hover:text-[#1C1924] flex items-center gap-1 transition"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </Link>
              )}
            </div>

          </div>

          {/* Right Column */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Top Preview/Edit Status Banner */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#F3EFFC] border border-[#E2DAEF] shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1C1924] uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#9A8CC3]" />
                  {isEditing ? 'Editing Your Profile' : 'Public Profile Preview'}
                </span>
                <span className="text-xs text-[#6B627A]">
                  {isEditing ? 'Remember to save changes' : 'Visible to verified members'}
                </span>
              </div>
              <p className="text-xs text-[#6B627A] pt-0.5">
                {isEditing 
                  ? 'Update your bio, preferences, and vitals below.' 
                  : 'This is the exact view verified singles see when viewing your profile.'}
              </p>
            </div>

            {/* ABOUT ME */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#F3EFFC] border border-[#E2DAEF] shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-[#6555B8] uppercase tracking-wider font-bold">ABOUT ME</h3>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-[#F3EFFC] border border-[#E2DAEF] text-xs text-[#1C1924] focus:outline-none focus:border-[#9A8CC3]"
                />
              ) : (
                <p className="text-sm text-[#1C1924] leading-relaxed">
                  {bio}
                </p>
              )}
            </div>

            {/* WHAT I'M LOOKING FOR */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#F3EFFC] border border-[#E2DAEF] shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-[#6555B8] uppercase tracking-wider font-bold">WHAT I'M LOOKING FOR</h3>
              {isEditing ? (
                <textarea
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-[#F3EFFC] border border-[#E2DAEF] text-xs text-[#1C1924] focus:outline-none focus:border-[#9A8CC3]"
                />
              ) : (
                <p className="text-sm text-[#1C1924] leading-relaxed">
                  {lookingFor}
                </p>
              )}
            </div>

{/* SLEEK COMPACT VITALS */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#F3EFFC] border border-[#E2DAEF] shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[#9A8CC3]/20 pb-3">
                  <h3 className="text-xs font-bold text-[#6555B8] uppercase tracking-wider font-bold">VITALS & TRAITS</h3>
                  
                </div>

                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#B2A4D7] mb-2">Basics</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3EFFC] border border-[#E2DAEF] text-xs">
                          <Briefcase className="w-3.5 h-3.5 text-[#9A8CC3] shrink-0" />
                          <span className="text-[#9A8CC3] font-medium">Work:</span>
                          <input
                            type="text"
                            value={profession}
                            onChange={(e) => setProfession(e.target.value)}
                            placeholder="Profession"
                            className="bg-transparent text-[#1C1924] font-semibold text-xs focus:outline-none w-28"
                          />
                        </div>
                        {renderDropdownPill('Height', height, HEIGHT_OPTIONS, setHeight, 'height', Ruler, true)}
                        <div className="w-full space-y-2 pt-1">
                        <div className="flex items-center gap-1.5 text-xs text-[#9A8CC3]">
                          <Languages className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-semibold text-[#1C1924]">Languages Spoken</span>
                          <span className="text-[10px] text-[#B2A4D7]">(Type & press Enter or tap suggestions)</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-2xl bg-[#F3EFFC] border border-[#9A8CC3]/35 min-h-[42px]">
                          {currentLanguages.map((lang: string) => (
                            <span
                              key={lang}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#6555B8]/40 border border-[#9A8CC3]/50 text-xs font-medium text-white shadow-sm"
                            >
                              {lang}
                              <button
                                type="button"
                                onClick={() => handleRemoveLanguage(lang)}
                                className="text-[#B2A4D7] hover:text-[#1C1924] transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            value={langInput}
                            onChange={(e) => setLangInput(e.target.value)}
                            onKeyDown={handleLangKeyDown}
                            placeholder={currentLanguages.length === 0 ? "e.g. English, Tagalog..." : "Add more..."}
                            className="bg-transparent text-xs text-[#1C1924] placeholder-[#756D82] focus:outline-none flex-1 min-w-[110px] px-1 py-0.5"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-[#9A8CC3] font-semibold uppercase">Popular:</span>
                          {QUICK_LANGUAGES.filter((ql: string) => !currentLanguages.some((cl: string) => cl.toLowerCase() === ql.toLowerCase())).slice(0, 5).map((ql: string) => (
                            <button
                              key={ql}
                              type="button"
                              onClick={() => handleAddLanguage(ql)}
                              className="text-[11px] px-2 py-0.5 rounded-full bg-[#F3EFFC] hover:bg-[#EAE6F2] border border-[#9A8CC3]/25 text-[#B2A4D7] transition"
                            >
                              + {ql}
                            </button>
                          ))}
                        </div>
                      </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#B2A4D7] mb-2">Relationship Goals</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {renderDropdownPill('Intent', intent, INTENT_OPTIONS, setIntent, 'intent', Heart)}
                        {renderDropdownPill('Relocation', relocation, RELOCATION_OPTIONS, setRelocation, 'relocation', Globe)}
                        {renderDropdownPill('Status', maritalStatus, MARITAL_OPTIONS, setMaritalStatus, 'maritalStatus', HeartHandshake)}
                        {renderDropdownPill('Has Kids', hasKids, HAS_KIDS_OPTIONS, setHasKids, 'hasKids', Baby)}
                        {renderDropdownPill('Wants Kids', wantsKids, WANTS_KIDS_OPTIONS, setWantsKids, 'wantsKids', Baby)}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#B2A4D7] mb-2">Lifestyle</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {renderDropdownPill('Faith', religion, RELIGION_OPTIONS, setReligion, 'religion', Flower2)}
                        {renderDropdownPill('Drinks', drinking, DRINKING_OPTIONS, setDrinking, 'drinking', Wine)}
                        {renderDropdownPill('Smokes', smoking, SMOKING_OPTIONS, setSmoking, 'smoking', Cigarette)}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* View Mode: Clean inline items without pill borders */
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#B2A4D7] mb-2.5">Basics</p>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-[#9A8CC3] shrink-0" />
                          <span className="text-[#9A8CC3] font-medium">Work:</span>
                          <span className="text-[#1C1924] font-medium">{profession || 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5 text-[#9A8CC3] shrink-0" />
                          <span className="text-[#9A8CC3] font-medium">Height:</span>
                          <span className="text-[#1C1924] font-medium">{height || 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-[#9A8CC3] font-medium">
                            <Languages className="w-3.5 h-3.5 shrink-0" />
                            <span>Languages:</span>
                          </div>
                          {currentLanguages.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {currentLanguages.map((l: string) => (
                                <span key={l} className="px-2.5 py-0.5 rounded-md bg-white/[0.05] border border-[#E2DAEF] text-xs font-normal text-[#1C1924]">
                                  {l}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#9A8CC3]">Not set</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#B2A4D7] mb-2.5">Relationship Goals</p>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-[#B2A4D7] shrink-0" />
                          <span className="text-[#9A8CC3] font-medium">Intent:</span>
                          <span className="text-[#1C1924] font-medium">{intent || 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-[#9A8CC3] shrink-0" />
                          <span className="text-[#9A8CC3] font-medium">Relocation:</span>
                          <span className="text-[#1C1924] font-medium">{relocation || 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <HeartHandshake className="w-3.5 h-3.5 text-[#9A8CC3] shrink-0" />
                          <span className="text-[#9A8CC3] font-medium">Status:</span>
                          <span className="text-[#1C1924] font-medium">{maritalStatus || 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Baby className="w-3.5 h-3.5 text-[#9A8CC3] shrink-0" />
                          <span className="text-[#9A8CC3] font-medium">Has Kids:</span>
                          <span className="text-[#1C1924] font-medium">{hasKids || 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Baby className="w-3.5 h-3.5 text-[#9A8CC3] shrink-0" />
                          <span className="text-[#9A8CC3] font-medium">Wants Kids:</span>
                          <span className="text-[#1C1924] font-medium">{wantsKids || 'Not set'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#B2A4D7] mb-2.5">Lifestyle</p>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Flower2 className="w-3.5 h-3.5 text-[#9A8CC3] shrink-0" />
                          <span className="text-[#9A8CC3] font-medium">Faith:</span>
                          <span className="text-[#1C1924] font-medium">{religion || 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Wine className="w-3.5 h-3.5 text-[#9A8CC3] shrink-0" />
                          <span className="text-[#9A8CC3] font-medium">Drinks:</span>
                          <span className="text-[#1C1924] font-medium">{drinking || 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Cigarette className="w-3.5 h-3.5 text-[#9A8CC3] shrink-0" />
                          <span className="text-[#9A8CC3] font-medium">Smokes:</span>
                          <span className="text-[#1C1924] font-medium">{smoking || 'Not set'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
      </main>

      <Footer />
    </div>
  );
}
