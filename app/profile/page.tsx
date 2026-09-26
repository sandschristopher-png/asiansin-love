'use client';

import { captureCurrentLocation, formatVerifiedDate } from '@/lib/location';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ShieldCheck, MapPin, Briefcase, Flower2, Heart, Languages, Globe, User, Edit3, Settings, Save, Check, Camera, X, ChevronDown, Baby, Sparkles, HeartHandshake, Ruler, Wine, Cigarette, Loader2, Navigation, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Footer } from '@/components/Footer';


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
  const [age, setAge] = useState(30);
  const [location, setLocation] = useState('Las Vegas, NV');
  const [locationSource, setLocationSource] = useState<'gps_verified' | 'self_reported'>('self_reported');
  const [locationVerifiedAt, setLocationVerifiedAt] = useState<string | null>(null);
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
      }
      setLoading(false);
    }
    loadUserData();
  }, [router]);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        name,
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
      });
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
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181222] border border-[#9A79BA]/40 hover:border-[#9A79BA] text-xs font-medium text-white transition active:scale-95"
        >
          <Icon className="w-3.5 h-3.5 text-[#9A79BA] shrink-0" />
          <span className="text-[#D5CEE5]/70">{label}:</span>
          <span className="font-semibold text-white">{value}</span>
          <ChevronDown className={`w-3 h-3 text-[#9A79BA] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className={`absolute left-0 top-full mt-1.5 w-48 rounded-2xl bg-[#20182E] border border-[#9A79BA]/40 shadow-2xl py-1.5 z-50 overflow-y-auto backdrop-blur-md ${scrollable ? 'max-h-52' : ''}`}>
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
                    ? 'text-white font-bold bg-[#653C87]/40' 
                    : 'text-[#D5CEE5] hover:bg-[#2B203C] hover:text-white'
                }`}
              >
                <span>{opt}</span>
                {value === opt && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#130F18] flex items-center justify-center text-[#9A79BA] text-xs">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#130F18] text-[#E6D7FA]">
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4 pb-28 md:pb-12" ref={dropdownRef}>
        
        {/* Navigation & Status */}
        <div className="flex items-center justify-between">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9A79BA] hover:text-white transition"
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
          <div className="md:col-span-5 rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 shadow-xl p-4 sm:p-5 space-y-4">
            
            {/* Header Up Top */}
            {isEditing ? (
              <div className="space-y-3 pb-1 border-b border-[#9A79BA]/25">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-[#9A79BA]">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 rounded-xl bg-[#181222] border border-[#9A79BA]/40 text-xs text-white focus:outline-none focus:border-[#9A79BA]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#9A79BA]">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-1.5 rounded-xl bg-[#181222] border border-[#9A79BA]/40 text-xs text-white focus:outline-none focus:border-[#9A79BA]"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-[#9A79BA]">Location</label>
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
                        } else if (res.error) {
                          setLocError(res.error);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C9A4E8] hover:text-white transition disabled:opacity-50"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-[#C9A4E8]" />
                          <span>Detecting GPS...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3 h-3 text-[#C9A4E8]" />
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
                    className="w-full mt-1.5 px-3 py-1.5 rounded-xl bg-[#181222]/50 border border-[#9A79BA]/30 text-xs text-gray-400 cursor-not-allowed focus:outline-none"
                  />
                  {locError && <p className="text-[10px] text-red-400 mt-1">{locError}</p>}
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2 pb-1 border-b border-[#9A79BA]/25">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-1.5">
                    {name}, {age}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-xs text-[#E6D7FA] flex items-center gap-1.5">
                      <MapPin className={`w-3.5 h-3.5 ${locationSource === 'gps_verified' ? 'text-emerald-400' : 'text-[#9A79BA]'}`} />
                      <span className="font-medium text-white">{location}</span>
                    </p>
                    {locationSource === 'gps_verified' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-semibold text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        GPS Verified {locationVerifiedAt ? `ï¿½ ${formatVerifiedDate(locationVerifiedAt)}` : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#181222] border border-[#9A79BA]/25 text-[10px] font-medium text-[#A8A2AB]">
                        Self-Reported
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#181222] border border-[#9A79BA]/40 text-[11px] font-medium text-[#E6D7FA] shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C9A4E8]" />
                  <span>100% Rep</span>
                </div>
              </div>
            )}

            {/* Framed Photo Container */}
            <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#241E2F] to-[#17131F] border border-[#9A79BA]/30 flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-[#9A79BA]/60 p-6 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-[#17131F] border border-[#9A79BA]/35 flex items-center justify-center shadow-inner">
                    <User className="w-10 h-10 stroke-[1.5] text-[#9A79BA]" />
                  </div>
                  <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A4E8] hover:underline cursor-pointer">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload Profile Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={() => alert('Photo upload bucket integration next')} />
                  </label>
                </div>
              )}

              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-emerald-400 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online</span>
              </div>
            </div>

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
                className="flex-1 py-2.5 rounded-xl bg-[#653C87] hover:bg-[#7D49A8] text-xs font-bold text-white flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-[#653C87]/40"
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
                  className="px-4 py-2.5 rounded-xl bg-[#241E2F] border border-[#9A79BA]/35 hover:bg-[#3B1E42] text-xs font-medium text-[#B6AEC7] hover:text-white flex items-center gap-1 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              ) : (
                <Link
                  href="/settings"
                  className="px-4 py-2.5 rounded-xl bg-[#241E2F] border border-[#9A79BA]/35 hover:bg-[#3B1E42] text-xs font-medium text-[#B6AEC7] hover:text-white flex items-center gap-1 transition"
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
            <div className="p-4 sm:p-5 rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 shadow-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#9A79BA]" />
                  {isEditing ? 'Editing Your Profile' : 'Public Profile Preview'}
                </span>
                <span className="text-xs text-[#E6D7FA]">
                  {isEditing ? 'Remember to save changes' : 'Visible to verified members'}
                </span>
              </div>
              <p className="text-xs text-[#E6D7FA] pt-0.5">
                {isEditing 
                  ? 'Update your bio, preferences, and vitals below.' 
                  : 'This is the exact view verified singles see when viewing your profile.'}
              </p>
            </div>

            {/* ABOUT ME */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 shadow-xl space-y-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">ABOUT ME</h3>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-[#181222] border border-[#9A79BA]/40 text-xs text-white focus:outline-none focus:border-[#9A79BA]"
                />
              ) : (
                <p className="text-sm text-[#E6D7FA] leading-relaxed">
                  {bio}
                </p>
              )}
            </div>

            {/* WHAT I'M LOOKING FOR */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 shadow-xl space-y-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">WHAT I'M LOOKING FOR</h3>
              {isEditing ? (
                <textarea
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-[#181222] border border-[#9A79BA]/40 text-xs text-white focus:outline-none focus:border-[#9A79BA]"
                />
              ) : (
                <p className="text-sm text-[#E6D7FA] leading-relaxed">
                  {lookingFor}
                </p>
              )}
            </div>

            {/* SLEEK COMPACT VITALS */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">VITALS & TRAITS</h3>
                
              </div>

              {isEditing ? (
                /* Edit Mode: Compact Wrapped Pill Triggers */
                <div className="flex flex-wrap items-center gap-2">
                  {/* Profession Input */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181222] border border-[#9A79BA]/40 text-xs">
                    <Briefcase className="w-3.5 h-3.5 text-[#9A79BA] shrink-0" />
                    <span className="text-[#D5CEE5]/70">Work:</span>
                    <input
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder="Profession"
                      className="bg-transparent text-white font-semibold text-xs focus:outline-none w-28"
                    />
                  </div>

                  {renderDropdownPill('Intent', intent, INTENT_OPTIONS, setIntent, 'intent', Heart)}
                  {renderDropdownPill('Faith', religion, RELIGION_OPTIONS, setReligion, 'religion', Flower2)}
                  {renderDropdownPill('Relocation', relocation, RELOCATION_OPTIONS, setRelocation, 'relocation', Globe)}
                  {renderDropdownPill('Status', maritalStatus, MARITAL_OPTIONS, setMaritalStatus, 'maritalStatus', HeartHandshake)}
                  {renderDropdownPill('Kids', hasKids, HAS_KIDS_OPTIONS, setHasKids, 'hasKids', Baby)}
                  {renderDropdownPill('Wants Kids', wantsKids, WANTS_KIDS_OPTIONS, setWantsKids, 'wantsKids', Baby)}
                  {renderDropdownPill('Height', height, HEIGHT_OPTIONS, setHeight, 'height', Ruler, true)}
                  {renderDropdownPill('Drinks', drinking, DRINKING_OPTIONS, setDrinking, 'drinking', Wine)}
                  {renderDropdownPill('Smokes', smoking, SMOKING_OPTIONS, setSmoking, 'smoking', Cigarette)}

                  {/* Languages Input */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181222] border border-[#9A79BA]/40 text-xs">
                    <Languages className="w-3.5 h-3.5 text-[#9A79BA] shrink-0" />
                    <span className="text-[#D5CEE5]/70">Languages:</span>
                    <input
                      type="text"
                      value={userLanguages}
                      onChange={(e) => setUserLanguages(e.target.value)}
                      placeholder="e.g. English, Tagalog"
                      className="bg-transparent text-white font-semibold text-xs focus:outline-none w-32"
                    />
                  </div>
                </div>
              ) : (
                /* View Mode: Clean Badge Chips */
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1F1829] border border-[#9A79BA]/25 text-xs text-[#E6D7FA]">
                    <Briefcase className="w-3.5 h-3.5 text-[#9A79BA]" />
                    <span className="font-medium text-white">{profession}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1F1829] border border-[#9A79BA]/25 text-xs text-[#E6D7FA]">
                    <Heart className="w-3.5 h-3.5 text-[#C9A4E8]" />
                    <span className="font-medium text-white">{intent}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1F1829] border border-[#9A79BA]/25 text-xs text-[#E6D7FA]">
                    <Globe className="w-3.5 h-3.5 text-[#9A79BA]" />
                    <span className="font-medium text-white">{relocation}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1F1829] border border-[#9A79BA]/25 text-xs text-[#E6D7FA]">
                    <HeartHandshake className="w-3.5 h-3.5 text-[#9A79BA]" />
                    <span className="font-medium text-white">{maritalStatus}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1F1829] border border-[#9A79BA]/25 text-xs text-[#E6D7FA]">
                    <Baby className="w-3.5 h-3.5 text-[#9A79BA]" />
                    <span className="font-medium text-white">Has Kids: {hasKids}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1F1829] border border-[#9A79BA]/25 text-xs text-[#E6D7FA]">
                    <Baby className="w-3.5 h-3.5 text-[#9A79BA]" />
                    <span className="font-medium text-white">Wants Kids: {wantsKids}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1F1829] border border-[#9A79BA]/25 text-xs text-[#E6D7FA]">
                    <Flower2 className="w-3.5 h-3.5 text-[#9A79BA]" />
                    <span className="font-medium text-white">Faith: {religion}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1F1829] border border-[#9A79BA]/25 text-xs text-[#E6D7FA]">
                    <Ruler className="w-3.5 h-3.5 text-[#9A79BA]" />
                    <span className="font-medium text-white">{height}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1F1829] border border-[#9A79BA]/25 text-xs text-[#E6D7FA]">
                    <Wine className="w-3.5 h-3.5 text-[#9A79BA]" />
                    <span className="font-medium text-white">Drinks: {drinking}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1F1829] border border-[#9A79BA]/25 text-xs text-[#E6D7FA]">
                    <Cigarette className="w-3.5 h-3.5 text-[#9A79BA]" />
                    <span className="font-medium text-white">Smokes: {smoking}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1F1829] border border-[#9A79BA]/25 text-xs text-[#E6D7FA]">
                    <Languages className="w-3.5 h-3.5 text-[#9A79BA]" />
                    <span className="font-medium text-white">{userLanguages}</span>
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

