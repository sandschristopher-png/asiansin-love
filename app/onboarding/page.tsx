'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Camera, 
  Loader2, 
  Sparkles,
  ShieldCheck,
  Heart,
  Globe,
  Shield
} from 'lucide-react';
import { captureCurrentLocation } from '@/lib/location';
import { supabase } from '@/lib/supabaseClient';

export default function OnboardingPage() {
  const triggerLocationDetection = async () => {
    setIsLocating(true);
    setErrorMessage(null);
    try {
      const res = await captureCurrentLocation();
      if (res.success && res.data) {
        setCity(res.data.city);
        setCountry(res.data.country);
        setLocationSource('gps_verified');
        setLocationVerifiedAt(new Date().toISOString());
        if (res.data.latitude) setLatitude(res.data.latitude);
        if (res.data.longitude) setLongitude(res.data.longitude);
        setShowLocationModal(false);
      } else {
        setErrorMessage(res.error || 'Could not auto-detect location. Please enter manually.');
        setShowLocationModal(false);
      }
    } catch {
      setShowLocationModal(false);
    } finally {
      setIsLocating(false);
    }
  };

  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    available?: boolean;
    suggestions?: string[];
    error?: string;
  } | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState<'man' | 'woman' | 'trans_woman' | 'trans_man' | 'non_binary' | ''>('');
  const [seekingGender, setSeekingGender] = useState<'women' | 'men' | 'trans_women' | 'trans_men' | 'everyone'>('women');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Philippines');
  const [locationSource, setLocationSource] = useState<'gps_verified' | 'self_reported'>('self_reported');
  const [locationVerifiedAt, setLocationVerifiedAt] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(true);

  // Intent & Goals matching your profile schema
  const [relationshipIntent, setRelationshipIntent] = useState('Marriage & Kids');
  const [relocationIntent, setRelocationIntent] = useState('willing_to_relocate');
  const [profession, setProfession] = useState('');
  const [height, setHeight] = useState('');
  const [languages, setLanguages] = useState<string[]>(['English']);
  
  // Dependents Transparency
  const [hasChildren, setHasChildren] = useState<boolean | null>(null);
  const [childrenCount, setChildrenCount] = useState<number>(1);
  const [livingSituation, setLivingSituation] = useState<'living_with_me' | 'not_living_with_me'>('living_with_me');
  
  // Portrait
  const [avatarUrl, setAvatarUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        router.push('/discover');
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!username || username.trim().length < 3) {
      setUsernameStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const res = await fetch('/api/users/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        const data = await res.json();
        setUsernameStatus(data);
      } catch {
        setUsernameStatus({ error: 'Could not verify username' });
      } finally {
        setIsCheckingUsername(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username]);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameStatus?.available) {
      setErrorMessage('Please select an available username handle.');
      return;
    }
    if (!displayName.trim() || !birthdate || !gender || (!city.trim() && !country.trim())) {
      setErrorMessage('Please complete your name, birthday, and location to proceed.');
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasChildren === null) {
      setErrorMessage('Please select your family & children status.');
      return;
    }
    setErrorMessage(null);
    setStep(3);
  };

  const handlePhotoSelected = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please choose a valid photo (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Photo exceeds 10MB limit. Please choose a slightly smaller file.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setErrorMessage(null);

    try {
      setIsUploadingPhoto(true);
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('isPrimary', 'true');
      if (userId) formData.append('userId', userId);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      if (data.photoUrl) {
        setAvatarUrl(data.photoUrl);
      }
    } catch (err: any) {
      console.error('Photo upload error:', err);
      setErrorMessage(err.message || 'Unable to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!userId) return;
    setLoading(true);
    setErrorMessage(null);

    const calculatedChildrenStatus = !hasChildren ? 'none' : livingSituation;
    const finalChildrenCount = !hasChildren ? 0 : childrenCount;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          full_name: displayName.trim(),
          gender: gender,
          birthdate: birthdate || null,
          seeking_gender: seekingGender,
          city: city.trim(),
          country: country.trim(),
          location: city.trim() ? (country.trim() ? `${city.trim()}, ${country.trim()}` : city.trim()) : country.trim(),
          location_source: locationSource,
          location_verified_at: locationVerifiedAt,
          latitude,
          longitude,
          relationship_intent: relationshipIntent,
          relocation_intent: relocationIntent,
          children_status: calculatedChildrenStatus,
          children_count: finalChildrenCount,
          occupation: profession.trim() || null,
          height: height.trim() || null,
          languages: languages.length > 0 ? languages.join(', ') : 'English',
          avatar_url: avatarUrl.trim() || null,
          onboarding_completed: true,
          reputation_score: 100,
          reputation_tier: 'Standard',
        })
        .eq('id', userId);

      if (error) {
        setErrorMessage(error.message);
      } else {
        router.push('/discover');
        router.refresh();
      }
    } catch {
      setErrorMessage('Could not complete your profile. Please try once more.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] w-full flex items-center justify-center p-4 sm:p-6 bg-[#F8F7FA]">
      <div className="w-full max-w-xl rounded-3xl bg-white border border-[#DDD7E5] p-6 sm:p-10 shadow-xl space-y-6">
        
        {/* Step Indicator Header */}
        <div className="space-y-3 border-b border-[#F0EDF5] pb-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFC] text-[#6555b8] text-xs font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#6555b8]" />
              Step {step} of 3
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    s === step ? 'w-7 bg-[#6555b8]' : s < step ? 'w-2 bg-[#6555b8]/50' : 'w-2 bg-[#DDD7E5]'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-medium text-[#1C1924] ">
              {step === 1 && 'Welcome to Asians in Love.'}
              {step === 2 && 'What brings you across oceans?'}
              {step === 3 && 'Put a face to your story.'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6C637B] mt-1 leading-relaxed">
              {step === 1 && 'Meaningful relationships start with honest foundations. Let’s set up your profile.'}
              {step === 2 && 'Clear expectations save hearts. Sharing your outlook early helps you connect with someone walking the same direction.'}
              {step === 3 && 'Choose a natural, recent photo of yourself. Genuine smiles invite sincere replies.'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: IDENTITY */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-5">
            {/* Username Field */}
            <div>
              <label className="text-xs font-medium text-[#1C1924] block mb-1">
                Your Member Handle
              </label>
              <p className="text-[11px] text-[#6C637B] mb-2">
                Your unique handle for mentions and discovery.
              </p>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-medium text-[#8C849B]">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))}
                  placeholder="yourname"
                  maxLength={20}
                  className="w-full pl-8 pr-10 py-3 rounded-2xl bg-white border border-[#DDD7E5] text-[#1C1924] placeholder-[#8C849B] focus:outline-none focus:border-[#6555b8] focus:ring-2 focus:ring-[#6555b8]/15 text-sm font-medium transition"
                />
                <div className="absolute right-3.5 flex items-center">
                  {isCheckingUsername && (
                    <Loader2 className="w-4 h-4 text-[#6555b8] animate-spin" />
                  )}
                  {!isCheckingUsername && usernameStatus?.available && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  {!isCheckingUsername && usernameStatus?.available === false && (
                    <span className="text-rose-500 text-xs font-medium">Taken</span>
                  )}
                </div>
              </div>

              {!isCheckingUsername && usernameStatus?.available === false && (
                <div className="mt-2 text-xs space-y-1.5">
                  <span className="text-rose-600 font-semibold">@{username} is already taken.</span>
                  {usernameStatus.suggestions && usernameStatus.suggestions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[#6C637B]">Suggestions:</span>
                      {usernameStatus.suggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setUsername(sug)}
                          className="px-2.5 py-1 rounded-xl bg-[#F3EFFC] border border-[#6555b8]/30 text-[#6555b8] font-medium text-xs hover:bg-[#6555b8] hover:text-white transition"
                        >
                          @{sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label className="text-xs font-medium text-[#1C1924] block mb-1">
                First Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="What people should call you"
                className="w-full px-4 py-3 rounded-2xl bg-white border border-[#DDD7E5] text-[#1C1924] placeholder-[#8C849B] focus:outline-none focus:border-[#6555b8] focus:ring-2 focus:ring-[#6555b8]/15 text-sm font-medium transition"
              />
            </div>

            {/* Birthdate */}
            <div>
              <label className="text-xs font-medium text-[#1C1924] block mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-[#DDD7E5] text-[#1C1924] focus:outline-none focus:border-[#6555b8] focus:ring-2 focus:ring-[#6555b8]/15 text-sm transition"
              />
            </div>

            {/* Gender Selection */}
            <div>
              <label className="text-xs font-medium text-[#1C1924] block mb-1">
                I identify as
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { val: 'man', label: 'Man' },
                  { val: 'woman', label: 'Woman' },
                  { val: 'trans_woman', label: 'Trans Woman' },
                  { val: 'trans_man', label: 'Trans Man' },
                  { val: 'non_binary', label: 'Non-binary' },
                ].map((g) => (
                  <button
                    key={g.val}
                    type="button"
                    onClick={() => setGender(g.val as any)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border transition active:scale-95 ${
                      gender === g.val
                        ? 'bg-[#6555b8] border-[#6555b8] text-white shadow-xs'
                        : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:border-[#6555b8]/40 hover:bg-[#F3EFFC]'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Seeking Selection */}
            <div>
              <label className="text-xs font-medium text-[#1C1924] block mb-1">
                Interested in meeting
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { val: 'women', label: 'Women' },
                  { val: 'men', label: 'Men' },
                  { val: 'trans_women', label: 'Trans Women' },
                  { val: 'trans_men', label: 'Trans Men' },
                  { val: 'everyone', label: 'Everyone' },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => setSeekingGender(s.val as any)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border transition active:scale-95 ${
                      seekingGender === s.val
                        ? 'bg-[#6555b8] border-[#6555b8] text-white shadow-xs'
                        : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:border-[#6555b8]/40 hover:bg-[#F3EFFC]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5] space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#1C1924]">
                  <MapPin className="w-3.5 h-3.5 text-[#6555b8]" />
                  <span>Where are you based?</span>
                </div>
                {locationSource === 'gps_verified' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified City
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#DDD7E5] text-[10px] font-semibold text-[#6C637B]">
                    <Globe className="w-3 h-3 text-[#6C637B]" />
                    Self-Reported
                  </span>
                )}
              </div>

              {/* Privacy Primer Info */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/70 border border-[#E5E1EC] text-[11px] text-[#6C637B] leading-relaxed">
                <Shield className="w-3.5 h-3.5 text-[#6555b8] shrink-0 mt-0.5" />
                <span>We only ever display your general city and approximate distance to potential matches. Your exact address is never stored or shared.</span>
              </div>

              {locationSource === 'gps_verified' ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[#1C1924] text-xs font-semibold">
                        {city}{country ? `, ${country}` : ''}
                      </span>
                    </div>
                    <span className="text-emerald-700 text-[11px] font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> GPS Confirmed
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setLocationSource('self_reported');
                        setLocationVerifiedAt(null);
                      }}
                      className="text-[11px] text-[#6555b8] hover:underline font-semibold"
                    >
                      Change or enter manually instead
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={isLocating}
                    onClick={async () => {
                      setIsLocating(true);
                      setErrorMessage(null);
                      const res = await captureCurrentLocation();
                      setIsLocating(false);
                      if (res.success && res.data) {
                        setCity(res.data.city);
                        setCountry(res.data.country);
                        setLocationSource('gps_verified');
                        setLocationVerifiedAt(new Date().toISOString());
                        if (res.data.latitude) setLatitude(res.data.latitude);
                        if (res.data.longitude) setLongitude(res.data.longitude);
                      } else {
                        setErrorMessage(res.error || 'Could not verify location. You can select your country and city manually below.');
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#F3EFFC] border border-[#DDD7E5] hover:border-[#6555b8]/50 text-xs font-semibold text-[#1C1924] inline-flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 shadow-xs"
                  >
                    {isLocating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6555b8]" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5 text-[#6555b8]" />
                    )}
                    {isLocating ? 'Verifying city location...' : 'Verify current city automatically'}
                  </button>

                  <div className="pt-2 border-t border-[#E5E1EC] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-medium text-[#6C637B]">
                      <span>Or enter manually:</span>
                      <span className="text-[10px] font-normal text-[#8C849B]">Country & City</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD7E5] text-xs text-[#1C1924] focus:outline-none focus:border-[#6555b8]"
                      >
                        <option value="Philippines">Philippines</option>
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="Thailand">Thailand</option>
                        <option value="Vietnam">Vietnam</option>
                        <option value="Japan">Japan</option>
                        <option value="South Korea">South Korea</option>
                        <option value="Taiwan">Taiwan</option>
                        <option value="Hong Kong">Hong Kong</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Malaysia">Malaysia</option>
                        <option value="Indonesia">Indonesia</option>
                        <option value="Australia">Australia</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Other">Other</option>
                      </select>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City (e.g. Cebu, Manila, Seattle)"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD7E5] text-xs text-[#1C1924] focus:outline-none focus:border-[#6555b8] placeholder-[#8C849B]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!usernameStatus?.available || !displayName.trim() || !birthdate || !gender || (!city.trim() && !country.trim())}
              className="w-full py-3.5 rounded-2xl bg-[#6555b8] hover:bg-[#52449e] text-white text-sm font-medium shadow-md transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed mt-3"
            >
              Continue to Goals & Values
            </button>
          </form>
        )}

        {/* STEP 2: INTENT & DEPENDENTS */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-6">
            <div>
              <label className="text-xs font-medium text-[#1C1924] block mb-1">
                Your Primary Courtship Goal
              </label>
              <p className="text-[11px] text-[#6C637B] mb-2.5">
                What kind of relationship are you hoping to build?
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { id: 'Marriage & Kids', desc: 'Seeking marriage and ready to raise or grow a family.' },
                  { id: 'Marriage (No Kids)', desc: 'Devoted lifelong marriage focusing on partnership as a couple.' },
                  { id: 'Committed Courtship', desc: 'Intentional dating with the goal of long-term commitment.' },
                  { id: 'Life Partner', desc: 'Deep companionship and dedicated cross-border partnership.' },
                ].map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setRelationshipIntent(goal.id)}
                    className={`px-4 py-3 rounded-2xl text-left border transition-all active:scale-[0.99] ${
                      relationshipIntent === goal.id
                        ? 'bg-[#F3EFFC] border-[#6555b8] text-[#1C1924] shadow-xs'
                        : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:border-[#6555b8]/40 hover:bg-[#F8F7FA]'
                    }`}
                  >
                    <div className="text-xs font-medium text-[#1C1924] flex items-center justify-between">
                      <span>{goal.id}</span>
                      {relationshipIntent === goal.id && <CheckCircle2 className="w-4 h-4 text-[#6555b8]" />}
                    </div>
                    <div className="text-[11px] text-[#6C637B] font-normal mt-0.5">{goal.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#1C1924] block mb-1">
                Cross-Border Relocation
              </label>
              <p className="text-[11px] text-[#6C637B] mb-2.5">
                Cross-border dating involves real geography. Where do you stand?
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: 'willing_to_relocate',
                    label: 'Open to Moving Abroad',
                    desc: 'Willing to relocate overseas for the right life partner.'
                  },
                  {
                    id: 'looking_to_relocate',
                    label: 'Actively Planning to Move',
                    desc: 'Already preparing an international move to Asia or abroad.'
                  },
                  {
                    id: 'not_relocating',
                    label: 'Rooted Locally (Welcoming a Partner)',
                    desc: 'Established where I live; excited to welcome a partner into my country.'
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRelocationIntent(item.id)}
                    className={`px-4 py-3 rounded-2xl text-left border transition-all active:scale-[0.99] ${
                      relocationIntent === item.id
                        ? 'bg-[#F3EFFC] border-[#6555b8] text-[#1C1924] shadow-xs'
                        : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:border-[#6555b8]/40 hover:bg-[#F8F7FA]'
                    }`}
                  >
                    <div className="text-xs font-medium text-[#1C1924] flex items-center justify-between">
                      <span>{item.label}</span>
                      {relocationIntent === item.id && <CheckCircle2 className="w-4 h-4 text-[#6555b8]" />}
                    </div>
                    <div className="text-[11px] text-[#6C637B] mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Family & Children */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5] space-y-3">
              <div>
                <label className="text-xs font-medium text-[#1C1924] block">
                  Family & Children
                </label>
                <p className="text-[11px] text-[#6C637B] mt-0.5">
                  Being candid about your family circumstances helps you connect with genuine understanding.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setHasChildren(false)}
                  className={`py-2.5 rounded-2xl text-xs font-medium border transition-all active:scale-95 ${
                    hasChildren === false
                      ? 'bg-[#6555b8] border-[#6555b8] text-white shadow-xs'
                      : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:bg-[#F3EFFC]'
                  }`}
                >
                  I don’t have children
                </button>
                <button
                  type="button"
                  onClick={() => setHasChildren(true)}
                  className={`py-2.5 rounded-2xl text-xs font-medium border transition-all active:scale-95 ${
                    hasChildren === true
                      ? 'bg-[#6555b8] border-[#6555b8] text-white shadow-xs'
                      : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:bg-[#F3EFFC]'
                  }`}
                >
                  I have children
                </button>
              </div>

              {hasChildren && (
                <div className="space-y-3 pt-3 border-t border-[#DDD7E5]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1C1924]">Number of children:</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setChildrenCount(count)}
                          className={`h-9 w-9 rounded-xl text-xs font-medium border transition-all ${
                            childrenCount === count
                              ? 'bg-[#6555b8] border-[#6555b8] text-white shadow-xs'
                              : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:bg-[#F3EFFC]'
                          }`}
                        >
                          {count === 4 ? '4+' : count}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1C1924]">Current arrangement:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLivingSituation('living_with_me')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          livingSituation === 'living_with_me'
                            ? 'bg-[#6555b8] border-[#6555b8] text-white shadow-xs'
                            : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:bg-[#F3EFFC]'
                        }`}
                      >
                        Living with me
                      </button>
                      <button
                        type="button"
                        onClick={() => setLivingSituation('not_living_with_me')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          livingSituation === 'not_living_with_me'
                            ? 'bg-[#6555b8] border-[#6555b8] text-white shadow-xs'
                            : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:bg-[#F3EFFC]'
                        }`}
                      >
                        Not living with me
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            
                {/* Vitals: Occupation, Height & Languages */}
                <div className="pt-2 border-t border-[#DDD7E5]/60 space-y-4">
                  <h4 className="text-xs font-medium text-[#1C1924] uppercase tracking-wider">Profile Vitals</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-[#524B5E] block mb-1">Occupation / Profession</label>
                      <input
                        type="text"
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        placeholder="e.g. Software Developer, Nurse"
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#DDD7E5] text-[#1C1924] focus:outline-none focus:border-[#6555b8]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[#524B5E] block mb-1">Height</label>
                      <input
                        type="text"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="e.g. 5ft 10in (178 cm)"
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#DDD7E5] text-[#1C1924] focus:outline-none focus:border-[#6555b8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#524B5E] block mb-1.5">Languages Spoken</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {['English', 'Tagalog', 'Cebuano', 'Ilocano', 'Vietnamese', 'Thai', 'Japanese', 'Spanish', 'Mandarin'].map((lang) => {
                        const active = languages.includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => {
                              if (active) {
                                setLanguages(languages.filter((l) => l !== lang));
                              } else {
                                setLanguages([...languages, lang]);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                              active
                                ? 'bg-[#6555b8] border-[#6555b8] text-white'
                                : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:bg-[#F3EFFC]'
                            }`}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-2xl bg-white border border-[#DDD7E5] text-xs font-medium text-[#524B5E] hover:bg-[#F8F7FA] transition active:scale-95"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={hasChildren === null}
                className="w-2/3 py-3 rounded-2xl bg-[#6555b8] hover:bg-[#52449e] text-white text-xs font-medium shadow-md transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Portrait
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: PHOTO UPLOAD */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-medium text-[#1C1924] block mb-1">
                Your Main Profile Photo
              </label>
              <p className="text-xs text-[#6C637B] mb-3 leading-relaxed">
                Clear lighting and a welcoming expression build immediate confidence and higher response rates across the platform.
              </p>

              <div className="relative">
                <input
                  type="file"
                  id="onboarding-photo-input"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handlePhotoSelected(e.target.files[0]);
                    }
                  }}
                />

                {photoPreview || avatarUrl ? (
                  <div className="relative group rounded-3xl overflow-hidden border-2 border-[#6555b8] bg-[#F8F7FA] aspect-[3/4] max-h-[300px] mx-auto shadow-md">
                    <img
                      src={photoPreview || avatarUrl}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                        <span className="text-xs font-semibold text-white">Saving your photo...</span>
                      </div>
                    )}
                    {!isUploadingPhoto && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/90 text-[10px] font-medium text-white shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                        </span>
                        <label
                          htmlFor="onboarding-photo-input"
                          className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#1C1924] text-xs font-semibold cursor-pointer transition active:scale-95 shadow-xs"
                        >
                          Change Photo
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <label
                    htmlFor="onboarding-photo-input"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handlePhotoSelected(e.dataTransfer.files[0]);
                      }
                    }}
                    className="border-2 border-dashed border-[#DDD7E5] hover:border-[#6555b8] bg-[#F8F7FA] hover:bg-[#F3EFFC]/40 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#F3EFFC] border border-[#6555b8]/20 flex items-center justify-center text-[#6555b8] group-hover:scale-105 transition mb-3">
                      <Camera className="w-7 h-7 text-[#6555b8]" />
                    </div>
                    <span className="text-sm font-medium text-[#1C1924] mb-1">
                      Tap to choose a photo or take a portrait
                    </span>
                    <span className="text-xs text-[#6C637B]">
                      Front-facing portrait · JPG, PNG, or WebP up to 10MB
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Community Standard Card */}
            <div className="p-4 rounded-2xl bg-[#F3EFFC]/70 border border-[#6555b8]/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#1C1924] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#6555b8]" />
                  A Trusted Community
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-medium">
                  Good Standing
                </span>
              </div>
              <p className="text-xs text-[#524B5E] leading-relaxed">
                Asians in Love is dedicated to genuine courtship and mutual respect. Profiles showing authenticity receive priority attention across the feed.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 py-3.5 rounded-2xl bg-white border border-[#DDD7E5] text-xs font-medium text-[#524B5E] hover:bg-[#F8F7FA] transition active:scale-95"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                disabled={loading || isUploadingPhoto || (!photoPreview && !avatarUrl) || !gender || !birthdate}
                className="w-2/3 py-3.5 rounded-2xl bg-[#6555b8] hover:bg-[#52449e] active:scale-[0.98] text-white text-xs font-medium shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing your profile...</span>
                  </>
                ) : (
                  <span>Complete Profile & Discover Matches</span>
                )}
              </button>
            </div>
          </div>
        )}
        {/* Soft Location Detection Modal */}
        {showLocationModal && step === 1 && !city && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#DDD7E5] text-center space-y-4">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
              >
                ?
              </button>

              <div className="w-14 h-14 rounded-2xl bg-[#6555b8]/10 text-[#6555b8] flex items-center justify-center mx-auto">
                <MapPin className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-medium text-[#1C1924]">Auto-Detect Your City?</h3>
                <p className="text-xs text-[#6C637B] mt-1 leading-relaxed">
                  Automatically set your location to receive the <strong className="text-emerald-700">Verified City</strong> badge and see matches nearby. Your exact address is never stored or shared.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isLocating}
                  onClick={triggerLocationDetection}
                  className="w-full py-3 rounded-2xl bg-[#6555b8] hover:bg-[#52449e] active:scale-95 text-white text-xs font-medium shadow-md transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Detecting GPS...</span>
                    </>
                  ) : (
                    <span>Use My Current Location</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="w-full py-2.5 rounded-2xl bg-transparent hover:bg-gray-50 text-xs font-semibold text-[#6C637B] transition"
                >
                  Enter Manually Instead
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

