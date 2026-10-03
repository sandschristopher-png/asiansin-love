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
import { Navbar } from '@/components/Navbar';
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
  const [username, setUsername] = useState('chris');
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
        if (data.username) setUsername(data.username); else if (data.name) setUsername(data.name.replace(/\s+/g, ''));
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
    <div className="min-h-screen flex flex-col bg-[#F8F7FA] text-[#1C1924]">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-32 space-y-6">
        {/* Uniform Page Header */}
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-[22px] font-semibold text-[#1C1924] ">My Profile</h1>
          <p className="text-xs sm:text-sm text-[#756D82]">
            Manage your courtship presence and preferences.
          </p>
        </div>{/* Main Grid: Left preview photo card & Right vitals */}
        <div className="flex flex-col gap-4 w-full" ref={dropdownRef}>
          
          {/* Left Column: Visual card & actions */}
          <div className="w-full space-y-4">
            
            {/* Header info over photo */}
            {isEditing ? (
              <div className="p-4 rounded-3xl bg-white border border-[#E5E1EC] space-y-3 shadow-xs">
                <div>
                  <label className="text-[10px] font-medium text-[#6555B8] uppercase tracking-wider">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-[#FAFAFC] border border-[#DDD7E5] text-sm font-semibold text-[#1C1924] focus:outline-none focus:border-[#6555B8]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-[#6555B8] uppercase tracking-wider">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full mt-1 p-2.5 rounded-xl bg-[#FAFAFC] border border-[#DDD7E5] text-sm font-semibold text-[#1C1924] focus:outline-none focus:border-[#6555B8]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-[#6555B8] uppercase tracking-wider">Location</label>
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
                  <h1 className="text-xl sm:text-[22px] font-semibold text-[#1C1924] ">
                    {username}, {age}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-xs font-medium text-[#756D82]">
                      {location}
                    </p>
                    {locationSource === 'gps_verified' && (
                      <span
                        title={locationVerifiedAt ? `GPS Verified ${formatVerifiedDate(locationVerifiedAt)}` : 'GPS Verified'}
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-2xs"
                      >
                        <MapPin className="w-3 h-3 text-emerald-600" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Streamlined Verification Shield */}
                {verificationStatus === 'verified' ? (
                  <div
                    title="ID & Profile Verified"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-2xs"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                  </div>
                ) : verificationStatus === 'pending' ? (
                  <div
                    title="Review Pending"
                    className="inline-flex items-center p-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 shadow-2xs"
                  >
                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  </div>
                ) : (
                  <Link
                    href="/verify"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3EFFC] border border-[#DDD7E5] hover:border-[#6555B8] text-[11px] font-medium text-[#6555B8] shrink-0 transition active:scale-95 shadow-2xs"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#6555B8]" />
                    <span>Verify</span>
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
                      alt={username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#9A8CC3]">
                      <Camera className="w-12 h-12 stroke-[1.5]" />
                      <span className="text-xs font-semibold mt-2 text-[#756D82]">No photos added</span>
                    </div>
                  )}

                  {/* Online Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-emerald-400 border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  </div>

                  {/* Photo Indicators */}
                  {hasMultiple && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                      {photoList.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentPhotoIdx(idx)}
                          className={`h-1.5 rounded-full transition-all ${idx === currentPhotoIdx ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Actions: Edit & Save Profile */}
            <div className="flex gap-2 pt-1">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2.5 rounded-2xl bg-white border border-[#DDD7E5] text-xs font-semibold text-[#756D82] hover:bg-[#F8F7FA] transition active:scale-98"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-2xl bg-[#6555B8] text-white text-xs font-semibold hover:bg-[#5243A3] transition active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2.5 rounded-2xl bg-white border border-[#DDD7E5] text-xs font-semibold text-[#1C1924] hover:bg-[#F8F7FA] transition active:scale-98 flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#6555B8]" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {/* Top Preview/Edit Status Banner */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E1EC] shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#1C1924] uppercase tracking-wider flex items-center gap-2">
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
              <h3 className="text-xs font-medium text-[#6555B8] uppercase tracking-wider">ABOUT ME</h3>
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
              <h3 className="text-xs font-medium text-[#6555B8] uppercase tracking-wider">LOOKING FOR</h3>
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
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E1EC] shadow-2xs space-y-5">
              <h3 className="text-xs font-medium text-[#6555B8] uppercase tracking-wider">
                Vitals & Intentions
              </h3>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-1">
                {/* Intent */}
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-[#8C849B] uppercase tracking-wider">Relationship Intent</p>
                  {isEditing ? (
                    <select
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                      className="w-full p-1.5 rounded-lg bg-[#F8F7FA] border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                    >
                      {INTENT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-normal text-[#1C1924]">{intent || 'Not specified'}</p>
                  )}
                </div>

                {/* Profession */}
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-[#8C849B] uppercase tracking-wider">Occupation</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full p-1.5 rounded-lg bg-[#F8F7FA] border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                    />
                  ) : (
                    <p className="text-sm font-normal text-[#1C1924]">{profession || 'Not specified'}</p>
                  )}
                </div>

                {/* Religion */}
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-[#8C849B] uppercase tracking-wider">Beliefs / Religion</p>
                  {isEditing ? (
                    <select
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                      className="w-full p-1.5 rounded-lg bg-[#F8F7FA] border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                    >
                      {RELIGION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-normal text-[#1C1924]">{religion || 'Not specified'}</p>
                  )}
                </div>

                {/* Marital Status */}
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-[#8C849B] uppercase tracking-wider">Marital Status</p>
                  {isEditing ? (
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full p-1.5 rounded-lg bg-[#F8F7FA] border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                    >
                      {MARITAL_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-normal text-[#1C1924]">{maritalStatus || 'Not specified'}</p>
                  )}
                </div>

                {/* Height */}
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-[#8C849B] uppercase tracking-wider">Height</p>
                  {isEditing ? (
                    <select
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full p-1.5 rounded-lg bg-[#F8F7FA] border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                    >
                      {HEIGHT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-normal text-[#1C1924]">{height || 'Not specified'}</p>
                  )}
                </div>

                {/* Relocation */}
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-[#8C849B] uppercase tracking-wider">Relocation</p>
                  {isEditing ? (
                    <select
                      value={relocation}
                      onChange={(e) => setRelocation(e.target.value)}
                      className="w-full p-1.5 rounded-lg bg-[#F8F7FA] border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                    >
                      {RELOCATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-normal text-[#1C1924]">{relocation || 'Not specified'}</p>
                  )}
                </div>

                {/* Children */}
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-[#8C849B] uppercase tracking-wider">Children</p>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={hasKids}
                        onChange={(e) => setHasKids(e.target.value)}
                        className="p-1 rounded bg-[#F8F7FA] border border-[#DDD7E5] text-[11px] font-semibold text-[#1C1924]"
                      >
                        {HAS_KIDS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>Has: {opt}</option>
                        ))}
                      </select>
                      <select
                        value={wantsKids}
                        onChange={(e) => setWantsKids(e.target.value)}
                        className="p-1 rounded bg-[#F8F7FA] border border-[#DDD7E5] text-[11px] font-semibold text-[#1C1924]"
                      >
                        {WANTS_KIDS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>Wants: {opt}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-sm font-normal text-[#1C1924]">
                      {hasKids?.toLowerCase().includes('yes') ? 'Has children' : 'No children'} Â· {wantsKids?.toLowerCase().includes('yes') ? 'Wants kids' : "Doesn't want"}
                    </p>
                  )}
                </div>

                {/* Habits */}
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-[#8C849B] uppercase tracking-wider">Habits</p>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={drinking}
                        onChange={(e) => setDrinking(e.target.value)}
                        className="p-1 rounded bg-[#F8F7FA] border border-[#DDD7E5] text-[11px] font-semibold text-[#1C1924]"
                      >
                        {DRINKING_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>Drink: {opt}</option>
                        ))}
                      </select>
                      <select
                        value={smoking}
                        onChange={(e) => setSmoking(e.target.value)}
                        className="p-1 rounded bg-[#F8F7FA] border border-[#DDD7E5] text-[11px] font-semibold text-[#1C1924]"
                      >
                        {SMOKING_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>Smoke: {opt}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="text-sm font-normal text-[#1C1924] space-y-0.5">
                        <p>Drink: {drinking || 'No'}</p>
                        <p>Smoke: {smoking || 'No'}</p>
                      </div>
                  )}
                </div>
              </div>
            </div>

            {/* LANGUAGES SPOKEN */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E1EC] shadow-xs space-y-3">
              <h3 className="text-xs font-medium text-[#6555B8] uppercase tracking-wider flex items-center gap-1.5">
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
                      className="px-4 py-2.5 rounded-xl bg-[#6555B8] text-white text-xs font-medium hover:bg-[#52449e] transition"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] font-medium text-[#8C849B] mr-1 uppercase">Quick Add:</span>
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
      </main>
    </div>
  );
}
