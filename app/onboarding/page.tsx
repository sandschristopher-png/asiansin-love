'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, CheckCircle2, Camera, Upload, Trash2, Loader2 } from 'lucide-react';
import { captureCurrentLocation } from '@/lib/location';
import { supabase } from '@/lib/supabaseClient';

export default function OnboardingPage() {
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
  const [locationSource, setLocationSource] = useState<'gps_verified' | 'self_reported'>('self_reported');
  const [locationVerifiedAt, setLocationVerifiedAt] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locSuccessMsg, setLocSuccessMsg] = useState<string | null>(null);
  const [country, setCountry] = useState('Philippines');

  const [relationshipIntent, setRelationshipIntent] = useState('Marriage & Long-Term Partner');
  const [relocationIntent, setRelocationIntent] = useState('willing_to_relocate');
  
  // Dependents Transparency
  const [hasChildren, setHasChildren] = useState<boolean | null>(null);
  const [childrenCount, setChildrenCount] = useState<number>(1);
  const [livingSituation, setLivingSituation] = useState<'living_with_me' | 'not_living_with_me'>('living_with_me');
  
  // Portrait
  const [avatarUrl, setAvatarUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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
      setErrorMessage('Please choose an available username.');
      return;
    }
    if (!displayName.trim() || !birthdate || !gender || (!city.trim() && !country.trim())) {
      setErrorMessage('Please fill in your name, birthdate, gender, and location.');
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasChildren === null) {
      setErrorMessage('Please specify your family & dependent status.');
      return;
    }
    setErrorMessage(null);
    setStep(3);
  };

  
  const handlePhotoSelected = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Photo exceeds 10MB limit. Please choose a smaller photo.');
      return;
    }

    setPhotoFile(file);
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
      setErrorMessage(err.message || 'Error uploading photo. Please try again.');
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
      setErrorMessage('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] w-full flex items-center justify-center p-3.5 sm:p-6 bg-[#F8F7FA]">
      <div className="w-full max-w-lg rounded-3xl bg-[#FFFFFF] border border-[#9A8CC3]/35 p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Progress Stepper */}
        <div className="flex items-center justify-between border-b border-[#9A8CC3]/25 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A8CC3]">
              Step {step} of 3
            </span>
            <h1 className="text-xl font-bold text-[#1C1924] tracking-tight">
              {step === 1 && "Let's start with you"}
              {step === 2 && 'Intent & Transparency'}
              {step === 3 && 'Profile Photo'}
            </h1>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? 'w-6 bg-[#6555B8]' : s < step ? 'w-2 bg-[#9A8CC3]' : 'w-2 bg-[#9A8CC3]/20'
                }`}
              />
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-4">
              {/* Username Field */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3] block mb-1">
                  Username (@handle)
                </label>
                <p className="text-[11px] text-[#B2A4D7] mb-1.5">
                  This is how potential matches will identify and remember you.
                </p>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-bold text-[#E6E1EC]">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))}
                    placeholder="yourname"
                    maxLength={20}
                    className="w-full pl-8 pr-10 py-3 rounded-2xl bg-[#FFFFFF] border border-[#9A8CC3]/40 text-[#1C1924] placeholder-[#756D82]/60 focus:outline-none focus:border-[#9A8CC3] text-base sm:text-sm font-semibold transition"
                  />
                  {/* In-field live status indicator */}
                  <div className="absolute right-3.5 flex items-center">
                    {isCheckingUsername && (
                      <Loader2 className="w-4 h-4 text-[#B2A4D7] animate-spin" />
                    )}
                    {!isCheckingUsername && usernameStatus?.available && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    {!isCheckingUsername && usernameStatus?.available === false && (
                      <span className="text-rose-400 text-xs font-bold">?</span>
                    )}
                  </div>
                </div>

                {/* Suggestions if handle taken */}
                {!isCheckingUsername && usernameStatus?.available === false && (
                  <div className="mt-2 text-xs space-y-1.5">
                    <span className="text-rose-400 font-semibold">@{username} is already taken.</span>
                    {usernameStatus.suggestions && usernameStatus.suggestions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[#B2A4D7]">Try:</span>
                        {usernameStatus.suggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setUsername(sug)}
                            className="px-2 py-0.5 rounded-lg bg-[#FFFFFF] border border-[#9A8CC3]/40 text-[#ECE8F4] font-semibold text-[11px] hover:bg-[#6555B8]"
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
                <label className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3] block mb-1.5">
                  Display Name (First Name)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Christopher"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFFFFF] border border-[#9A8CC3]/40 text-[#1C1924] placeholder-[#756D82]/60 focus:outline-none focus:border-[#9A8CC3] text-base sm:text-sm font-medium transition"
                />
              </div>

              {/* Birthdate */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3] block mb-1.5">
                  Birthdate
                </label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFFFFF] border border-[#9A8CC3]/40 text-[#1C1924] focus:outline-none focus:border-[#9A8CC3] text-base sm:text-sm transition [color-scheme:dark]"
                />
              </div>

              {/* Gender & Seeking */}
              <div className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3] block mb-1">
                    I am a
                  </label>
                  <p className="text-[11px] text-[#B2A4D7] mb-2">
                    Honest identification ensures transparent, ambush-free discovery for everyone.
                  </p>
                  <div className="flex flex-wrap gap-2">
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
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                          gender === g.val
                            ? 'bg-[#6555B8] border-[#9A8CC3] text-white shadow-md shadow-[#6555B8]/40 scale-[1.02]'
                            : 'bg-[#FFFFFF] border-[#9A8CC3]/30 text-[#B2A4D7] hover:text-white hover:border-[#9A8CC3]/60'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3] block mb-1">
                    Seeking
                  </label>
                  <p className="text-[11px] text-[#B2A4D7] mb-2">
                    Who would you like to see in your discovery feed?
                  </p>
                  <div className="flex flex-wrap gap-2">
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
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                          seekingGender === s.val
                            ? 'bg-[#6555B8] border-[#9A8CC3] text-white shadow-md shadow-[#6555B8]/40 scale-[1.02]'
                            : 'bg-[#FFFFFF] border-[#9A8CC3]/30 text-[#B2A4D7] hover:text-white hover:border-[#9A8CC3]/60'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location: Exclusive State UI */}
              <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#9A8CC3]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9A8CC3]">
                    <MapPin className="w-3.5 h-3.5 text-[#1C1924]" />
                    <span>Location</span>
                  </div>
                  {locationSource === 'gps_verified' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-semibold text-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      GPS Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#9A8CC3]/20 text-[10px] font-medium text-[#B2A4D7]">
                      Unverified
                    </span>
                  )}
                </div>

                {locationSource === 'gps_verified' ? (
                  /* STATE A: GPS Verified - Locked down view */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-emerald-500/30">
                      <span className="text-[#1C1924] text-xs font-semibold">
                        {city}{country ? `, ${country}` : ''}
                      </span>
                      <span className="text-emerald-400 text-[11px] font-medium inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setLocationSource('self_reported');
                          setLocationVerifiedAt(null);
                        }}
                        className="text-[11px] text-[#B2A4D7] hover:text-[#1C1924] underline transition"
                      >
                        Change location or use manual entry
                      </button>
                    </div>
                  </div>
                ) : (
                  /* STATE B: Unverified - Detect GPS primary, manual fallback clearly marked */
                  <div className="space-y-3">
                    <button
                      type="button"
                      disabled={isLocating}
                      onClick={async () => {
                        setIsLocating(true);
                        setLocSuccessMsg(null);
                        const res = await captureCurrentLocation();
                        setIsLocating(false);
                        if (res.success && res.data) {
                          setCity(res.data.city);
                          setCountry(res.data.country);
                          setLocationSource('gps_verified');
                          setLocationVerifiedAt(new Date().toISOString());
                          if (res.data.latitude) setLatitude(res.data.latitude);
                          if (res.data.longitude) setLongitude(res.data.longitude);
                          setLocSuccessMsg('Location verified with GPS');
                        } else {
                          setErrorMessage(res.error || 'Could not detect location. Please check browser permissions.');
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-200 text-xs font-semibold inline-flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                    >
                      {isLocating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Navigation className="w-3.5 h-3.5" />
                      )}
                      {isLocating ? 'Detecting via GPS...' : 'Verify Location with GPS'}
                    </button>

                    <div className="pt-2 border-t border-[#9A8CC3]/15 space-y-2">
                      <div className="space-y-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#A8A2AB]">GPS denied or desktop?</span>
                        <span className="text-[10px] text-[#7A6B8A]">Manual entry</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                        <div className="min-w-0">
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="City"
                            className="w-full px-3 py-2 rounded-xl bg-[#20172C] border border-[#9A79BA]/30 text-xs text-[#1C1924] focus:outline-none focus:border-[#9A79BA] placeholder-[#7A6B8A]"
                          />
                        </div>
                        <div className="min-w-0">
                          <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="Country"
                            className="w-full px-3 py-2 rounded-xl bg-[#20172C] border border-[#9A79BA]/30 text-xs text-[#1C1924] focus:outline-none focus:border-[#9A79BA] placeholder-[#7A6B8A]"
                          />
                        </div>
                      </div>
                    </div>
                      <p className="text-[10px] text-[#B2A4D7]">
                        Self-reported locations remain Unverified. You can enable GPS later to boost profile visibility.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit with Form Guardrail */}
              <button
                type="submit"
                disabled={!usernameStatus?.available || !displayName.trim() || !birthdate || !gender || (!city.trim() && !country.trim())}
                className="w-full py-3.5 rounded-2xl bg-[#6555B8] hover:bg-[#7D4B9F] text-white text-sm font-bold shadow-lg shadow-[#6555B8]/40 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                Continue to Intent & Family
              </button>
            </form>
          )}

          {/* STEP 2: INTENT & DEPENDENTS */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3] block mb-1">
                  Primary Courtship Goal
                </label>
                <p className="text-[11px] text-[#B2A4D7] mb-2">
                  Clear intentions prevent misalignment from day one.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'Marriage & Long-Term Partner', desc: 'Seeking marriage and lifelong commitment.' },
                    { id: 'Committed Courtship', desc: 'Intentional dating leading towards marriage.' },
                    { id: 'Meaningful Connection', desc: 'Sincere long-term partnership.' },
                  ].map((goal) => (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setRelationshipIntent(goal.id)}
                      className={`px-4 py-3 rounded-2xl text-left border transition-all ${
                        relationshipIntent === goal.id
                          ? 'bg-[#6555B8] border-[#9A8CC3] text-white shadow-md shadow-[#6555B8]/40 scale-[1.01]'
                          : 'bg-[#FFFFFF] border-[#9A8CC3]/30 text-[#ECE8F4] hover:border-[#9A8CC3]/60'
                      }`}
                    >
                      <div className="text-xs font-bold">{goal.id}</div>
                      <div className="text-[11px] text-[#B2A4D7] font-normal">{goal.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3] block mb-1">
                  Relocation Intent
                </label>
                <p className="text-[11px] text-[#B2A4D7] mb-2">
                  How do you envision the physical future with an international partner?
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      id: 'willing_to_relocate',
                      label: 'Open to Relocating',
                      desc: 'Willing to move abroad for the right partner.'
                    },
                    {
                      id: 'looking_to_relocate',
                      label: 'Actively Relocating',
                      desc: 'Already planning or preparing an international move.'
                    },
                    {
                      id: 'not_relocating',
                      label: 'Staying Put (Partner Relocates)',
                      desc: 'Established locally; open to a partner moving to me.'
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRelocationIntent(item.id)}
                      className={`px-4 py-2.5 rounded-2xl text-left border transition-all ${
                        relocationIntent === item.id
                          ? 'bg-[#6555B8] border-[#9A8CC3] text-white shadow-md shadow-[#6555B8]/40'
                          : 'bg-[#FFFFFF] border-[#9A8CC3]/30 text-[#ECE8F4] hover:border-[#9A8CC3]/60'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[11px] text-[#B2A4D7]">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dependents Guardrail */}
              <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#9A8CC3]/35 space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3] block">
                    Family & Dependents Transparency
                  </label>
                  <p className="text-xs text-[#1C1924] mt-0.5">
                    Accurate parental status is required to protect platform trust.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHasChildren(false)}
                    className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                      hasChildren === false
                        ? 'bg-[#6555B8] border-[#9A8CC3] text-white shadow-md shadow-[#6555B8]/40'
                        : 'bg-[#FFFFFF] border-[#9A8CC3]/30 text-white hover:border-[#9A8CC3]/60'
                    }`}
                  >
                    No Children
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasChildren(true)}
                    className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                      hasChildren === true
                        ? 'bg-[#6555B8] border-[#9A8CC3] text-white shadow-md shadow-[#6555B8]/40'
                        : 'bg-[#FFFFFF] border-[#9A8CC3]/30 text-white hover:border-[#9A8CC3]/60'
                    }`}
                  >
                    Has Children
                  </button>
                </div>

                {hasChildren && (
                  <div className="space-y-3 pt-2 border-t border-[#9A8CC3]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#ECE8F4]">Number of children:</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setChildrenCount(count)}
                            className={`h-10 w-10 rounded-xl text-xs font-bold border transition-all touch-manipulation ${
                              childrenCount === count
                                ? 'bg-[#6555B8] border-[#9A8CC3] text-white'
                                : 'bg-[#FFFFFF] border-[#9A8CC3]/30 text-[#B2A4D7]'
                            }`}
                          >
                            {count === 4 ? '4+' : count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#ECE8F4]">Living arrangement:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setLivingSituation('living_with_me')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            livingSituation === 'living_with_me'
                              ? 'bg-[#6555B8] border-[#9A8CC3] text-white'
                              : 'bg-[#FFFFFF] border-[#9A8CC3]/30 text-[#B2A4D7]'
                          }`}
                        >
                          Living with me
                        </button>
                        <button
                          type="button"
                          onClick={() => setLivingSituation('not_living_with_me')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            livingSituation === 'not_living_with_me'
                              ? 'bg-[#6555B8] border-[#9A8CC3] text-white'
                              : 'bg-[#FFFFFF] border-[#9A8CC3]/30 text-[#B2A4D7]'
                          }`}
                        >
                          Not living with me
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 rounded-2xl bg-[#FFFFFF] border border-[#E2DCE8] text-xs font-bold text-[#ECE8F4] hover:bg-[#3B1E42] transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={hasChildren === null}
                  className="w-2/3 py-3 rounded-2xl bg-[#6555B8] hover:bg-[#7D4B9F] text-white text-xs font-bold shadow-lg shadow-[#6555B8]/40 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue to Photo
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PHOTO UPLOAD */}
          {step === 3 && (
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3] block mb-1">
                  Primary Profile Photo
                </label>
                <p className="text-[11px] sm:text-xs text-[#B2A4D7] mb-3 leading-relaxed">
                  Upload an unfiltered portrait of yourself. Profiles showing a genuine face earn instant trust and significantly higher response rates.
                </p>

                {/* Touch & Desktop Dropzone */}
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
                    <div className="relative group rounded-3xl overflow-hidden border-2 border-[#6555B8] bg-[#FFFFFF] aspect-[4/5] max-h-[290px] mx-auto shadow-2xl">
                      <img
                        src={photoPreview || avatarUrl}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 text-[#B2A4D7] animate-spin" />
                          <span className="text-xs font-semibold text-[#1C1924]">Saving portrait...</span>
                        </div>
                      )}
                      {!isUploadingPhoto && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end justify-between p-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                          <label
                            htmlFor="onboarding-photo-input"
                            className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 text-[#1C1924] text-[11px] font-semibold cursor-pointer transition active:scale-95 touch-manipulation"
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
                      className="border-2 border-dashed border-[#9A8CC3]/40 active:border-[#9A8CC3] bg-[#FFFFFF]/80 active:bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all touch-manipulation group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-[#6555B8]/20 border border-[#9A8CC3]/30 flex items-center justify-center text-[#B2A4D7] group-hover:scale-105 transition mb-3">
                        <Camera className="w-7 h-7 text-[#B2A4D7]" />
                      </div>
                      <span className="text-sm font-bold text-[#1C1924] mb-1">
                        Take a photo or choose from library
                      </span>
                      <span className="text-[11px] text-[#B2A4D7]">
                        JPG, PNG, or WebP up to 10MB
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Starting Reputation & Trust Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#F8F7FA] border border-[#9A8CC3]/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9A8CC3]">
                    Starting Reputation
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[11px] font-extrabold text-emerald-300">
                    100% Rep
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#ECE8F4]/90 leading-relaxed">
                  Your account begins in Standard Standing. Maintain respectful communication and complete pose selfie verification later in your profile to earn Verified Badges.
                </p>
              </div>

              {/* Step 3 Form Actions */}
              <div className="flex gap-2.5 sm:gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E2DCE8] text-xs font-bold text-[#ECE8F4] hover:bg-[#3B1E42] active:bg-[#3B1E42] transition touch-manipulation"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  disabled={loading || isUploadingPhoto || (!photoPreview && !avatarUrl) || !gender || !birthdate}
                  className="w-2/3 py-3.5 rounded-2xl bg-[#6555B8] hover:bg-[#7D4B9F] active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-[#6555B8]/40 transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 touch-manipulation"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating Profile...</span>
                    </>
                  ) : (
                    <span>Complete & Discover Matches</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
}