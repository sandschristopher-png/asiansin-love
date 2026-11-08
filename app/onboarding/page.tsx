'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Camera,
  Loader2,
  Heart,
  ShieldCheck,
  Trash2,
  Plus,
  Check,
  Shield
} from 'lucide-react';
import { captureCurrentLocation } from '@/lib/location';
import { supabase } from '@/lib/supabase/client';
import { INTENT_OPTIONS } from '@/lib/intents';
import { resolveCountry } from '@/lib/countries';
import { evaluateBioModeration } from '@/lib/moderation';
import { saveBioAndRhythm } from '@/lib/profileApi';
import { compressPhoto } from '@/lib/utils/imageCompressor';
import { EMPTY_RHYTHM, RhythmSelectors, type RhythmValues } from '@/components/profile/RhythmBadges';
import { readHeightCm } from '@/lib/lifestyle';

/** In-progress answers survive a refresh or accidental navigation (cleared on completion). */
const DRAFT_KEY = 'ail_onboarding_draft_v1';

const GENDER_OPTIONS = [
  { val: 'male', label: 'Man' },
  { val: 'female', label: 'Woman' },
] as const;

const INTERESTED_IN_OPTIONS = [
  { val: 'male', label: 'Men' },
  { val: 'female', label: 'Women' },
] as const;

const HEIGHT_OPTIONS = [
  '4\'8" (142 cm)', '4\'9" (145 cm)', '4\'10" (147 cm)', '4\'11" (150 cm)',
  '5\'0" (152 cm)', '5\'1" (155 cm)', '5\'2" (157 cm)', '5\'3" (160 cm)',
  '5\'4" (163 cm)', '5\'5" (165 cm)', '5\'6" (168 cm)', '5\'7" (170 cm)',
  '5\'8" (173 cm)', '5\'9" (175 cm)', '5\'10" (178 cm)', '5\'11" (180 cm)',
  '6\'0" (183 cm)', '6\'1" (185 cm)', '6\'2" (188 cm)', '6\'3" (191 cm)',
  '6\'4" (193 cm)', '6\'5" (196 cm)', '6\'6" (198 cm)', '6\'7" (201 cm)'
];

const HOBBY_TAGS = [
  'Cooking & Food', 'Beach & Ocean', 'Family First', 'Travel', 'Movies & Cinema',
  'Music & Karaoke', 'Fitness & Gym', 'Coffee & Cafes', 'Nature Walks', 'Faith & Church',
  'Homebody', 'Photography', 'Pets & Animals', 'Gaming', 'Art & Design', 'Entrepreneurship'
];

const COUNTRIES = [
  'Philippines', 'Thailand', 'Vietnam', 'Indonesia', 'Cambodia', 'Malaysia',
  'Singapore', 'Laos', 'United States', 'Canada', 'Australia', 'United Kingdom',
  'Japan', 'South Korea', 'Taiwan', 'Hong Kong', 'United Arab Emirates', 'New Zealand', 'Other'
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  // Location integrity: VPN / proxy / datacenter connections can't finish onboarding.
  const [vpnBlocked, setVpnBlocked] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Username Selection
  const [username, setUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    available?: boolean;
    suggestions?: string[];
    error?: string;
  } | null>(null);

  // Step 2: Identity & Preferences
  const [gender, setGender] = useState<string>('');
  const [interestedIn, setInterestedIn] = useState<string[]>([]);
  // Intent (canonical values from lib/intents.ts)
  const [intent, setIntent] = useState('');
  const [birthdate, setBirthdate] = useState('');

  // Step 3: Location (GPS first, manual fallback, NOT location-verified)
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Philippines');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsCaptured, setGpsCaptured] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Step 4: Profile Details
  const [height, setHeight] = useState('');
  const [bio, setBio] = useState('');
  const [rhythm, setRhythm] = useState<RhythmValues>(EMPTY_RHYTHM);
  
  const [interests, setInterests] = useState<string[]>([]);

  // Step 5: Photos (1-6 photos uploaded to user_photos bucket)
  const [photos, setPhotos] = useState<string[]>([]);
  const [primaryIdx, setPrimaryIdx] = useState<number>(0);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [photoPlaceholders, setPhotoPlaceholders] = useState<Record<string, string>>({});

  // Strict binary matching (Pairs / with.is): men meet women, women meet men.
  const selectGender = (val: string) => {
    setGender(val);
    setInterestedIn([val === 'male' ? 'female' : 'male']);
  };

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
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        router.push('/profile');
        return;
      }

      if (profile) {
        // Google sign-ups get a handle derived from their real name; ask for a fresh one instead.
        const googleName = String(user.user_metadata?.full_name || user.user_metadata?.name || '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
        const handle = String(profile.username || '');
        const fromRealName =
          googleName.length >= 3 && handle.toLowerCase().replace(/[^a-z0-9]/g, '').includes(googleName.slice(0, 6));
        if (handle && !handle.startsWith('user_') && !fromRealName) {
          setUsername(handle);
        }
        if (profile.gender === 'male' || profile.gender === 'female') selectGender(profile.gender);
        if (profile.birthdate) setBirthdate(profile.birthdate);
        if (profile.city) setCity(profile.city);
        if (profile.country) setCountry(profile.country);
        if (profile.height) setHeight(profile.height);
        if (profile.bio) setBio(profile.bio);
        
    if (profile.intent) setIntent(profile.intent);
        if (Array.isArray(profile.interests)) setInterests(profile.interests);
        if (Array.isArray(profile.photos) && profile.photos.length > 0) {
          setPhotos(profile.photos.filter(Boolean));
        } else if (profile.avatar_url) {
          setPhotos([profile.avatar_url]);
        }
      }

      try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        const d = raw ? JSON.parse(raw) : null;
        if (d && d.userId === user.id) {
          if (d.username) setUsername(d.username);
          if (d.gender === 'male' || d.gender === 'female') selectGender(d.gender);
          if (d.intent) setIntent(d.intent);
          if (d.birthdate) setBirthdate(d.birthdate);
          if (d.city) setCity(d.city);
          if (d.country) setCountry(d.country);
          if (d.height) setHeight(d.height);
          if (typeof d.bio === 'string' && d.bio) setBio(d.bio);
          if (Array.isArray(d.interests)) setInterests(d.interests);
          if (d.rhythm) setRhythm({ ...EMPTY_RHYTHM, ...d.rhythm });
          if (Number.isInteger(d.step) && d.step >= 1 && d.step <= 5) setStep(d.step);
        }
      } catch {}
      setDraftRestored(true);

      // Early heads-up; the real gate runs again on POST /api/onboarding.
      fetch('/api/onboarding')
        .then((r) => r.json())
        .then((d) => setVpnBlocked(Boolean(d?.blocked)))
        .catch(() => {});
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!draftRestored || !userId) return;
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ userId, step, username, gender, intent, birthdate, city, country, height, bio, interests, rhythm })
      );
    } catch {}
  }, [draftRestored, userId, step, username, gender, intent, birthdate, city, country, height, bio, interests, rhythm]);

  // Step 1: Debounced case-insensitive check against profiles.username
  useEffect(() => {
    const clean = username.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!clean) {
      setUsernameStatus(null);
      return;
    }
    if (clean.length < 3) {
      setUsernameStatus({ available: false, error: 'Username must be at least 3 characters.' });
      return;
    }
    if (clean.length > 20) {
      setUsernameStatus({ available: false, error: 'Username must be 20 characters or fewer.' });
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        // Exact, case-insensitive check on the server (ILIKE "_" wildcards escaped there).
        const res = await fetch('/api/profile/check-username?username=' + encodeURIComponent(clean));
        const data = await res.json().catch(() => ({}));
        if (data.available) {
          setUsernameStatus({ available: true });
        } else if (Array.isArray(data.suggestions)) {
          setUsernameStatus({ available: false, suggestions: data.suggestions });
        } else {
          setUsernameStatus({ available: false, error: data.error || 'Could not verify username availability.' });
        }
      } catch {
        setUsernameStatus({ available: false, error: 'Could not verify username availability.' });
      } finally {
        setIsCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, userId]);


  const toggleHobby = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const triggerLocationDetection = async () => {
    setIsLocating(true);
    setErrorMessage(null);
    try {
      const res = await captureCurrentLocation();
      if (res.success && res.data) {
        setCity(res.data.city);
        setCountry(res.data.country);
        setLatitude(res.data.latitude);
        setLongitude(res.data.longitude);
        setGpsCaptured(true);
      } else {
        setErrorMessage(res.error || 'GPS detection unavailable. Please enter your city and country manually.');
      }
    } catch {
      setErrorMessage('Could not auto-detect location. Please enter manually below.');
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (step === 3 && !city && !gpsCaptured) {
      triggerLocationDetection();
    }
  }, [step]);

  const calculateAge = (dobStr: string): number => {
    if (!dobStr) return 25;
    const dob = new Date(dobStr);
    const diff = Date.now() - dob.getTime();
    return Math.max(18, Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(clean)) {
      setErrorMessage('Username must be 3 to 20 characters (letters, numbers, and underscores only).');
      return;
    }
    if (!usernameStatus?.available) {
      setErrorMessage('Please choose an available username.');
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gender) {
      setErrorMessage('Please select your gender identity.');
      return;
    }
    if (interestedIn.length === 0) {
      setErrorMessage('Please select at least one preference for who you are interested in.');
      return;
    }
    if (!intent) {
      setErrorMessage('Please select what you are looking for.');
      return;
    }
    if (!birthdate) {
      setErrorMessage('Please enter your date of birth.');
      return;
    }
    const ageVal = calculateAge(birthdate);
    if (ageVal < 18) {
      setErrorMessage('You must be at least 18 years old to join.');
      return;
    }
    setErrorMessage(null);
    setStep(3);
  };

  const handleStep3Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !country.trim()) {
      setErrorMessage('Please provide both your city and country.');
      return;
    }
    setErrorMessage(null);
    setStep(4);
  };

  const handleStep4Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!height) {
      setErrorMessage('Please select your height.');
      return;
    }
    if (bio.trim().length < 20) {
      setErrorMessage('Please write at least 20 characters in your About Me bio.');
      return;
    }
    // Instant feedback; /api/profile repeats this check server-side when saving.
    const bioCheck = evaluateBioModeration(bio);
    if (!bioCheck.ok) {
      setErrorMessage(bioCheck.reason || 'Please revise your bio.');
      return;
    }
    if (interests.length === 0) {
      setErrorMessage('Please select at least one interest or hobby.');
      return;
    }
    setErrorMessage(null);
    setStep(5);
  };

  const handlePhotoUpload = async (file: File, slotIdx: number) => {
    if (!file || !userId) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image (JPEG, PNG, or WebP).');
      return;
    }
    // Raw camera files are downsampled in the browser before upload.
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Photo exceeds the 25MB limit.');
      return;
    }

    setUploadingSlot(slotIdx);
    setErrorMessage(null);

    try {
      // 1440px WebP @ 83% + blurred preview, before it leaves the phone.
      const compressed = await compressPhoto(file);
      file = compressed.file;
      const mimeExtMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      };
      const ext = mimeExtMap[file.type] || 'jpg';
      const filePath = userId + '/photo-' + Date.now() + '-' + slotIdx + '.' + ext;

      const { error: uploadError } = await supabase.storage
        .from('user_photos')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from('user_photos')
        .getPublicUrl(filePath);

      const photoUrl = publicUrlData?.publicUrl;
      if (!photoUrl) {
        throw new Error('Failed to resolve public URL for uploaded photo.');
      }

      if (compressed.placeholder) {
        const ph = compressed.placeholder;
        setPhotoPlaceholders((prev) => ({ ...prev, [photoUrl]: ph }));
      }
      setPhotos((prev) => {
        const next = [...prev];
        if (slotIdx < next.length) {
          next[slotIdx] = photoUrl;
        } else {
          next.push(photoUrl);
        }
        return next.slice(0, 6);
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Photo upload failed. Please try again.');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (primaryIdx >= next.length) {
        setPrimaryIdx(0);
      }
      return next;
    });
  };

  const handleCompleteOnboarding = async () => {
    if (!userId) return;
    if (photos.length === 0) {
      setErrorMessage('Please upload at least 1 photo to complete your profile.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const primaryPhoto = photos[primaryIdx] || photos[0];
      const orderedPhotos = [
        primaryPhoto,
        ...photos.filter((_, i) => i !== primaryIdx),
      ];

      const cleanHandle = username.trim().replace(/[^a-zA-Z0-9_]/g, '');
      const computedAge = calculateAge(birthdate);
      const resolvedCountry = resolveCountry(city, country);
      const formattedLocation = city.trim() + ', ' + resolvedCountry;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: cleanHandle,
          display_name: cleanHandle,
          full_name: cleanHandle,
          gender,
          interested_in: interestedIn,
        seeking_gender: interestedIn[0] === 'female' ? 'female' : 'male',
          target_gender: interestedIn[0] === 'female' ? 'female' : 'male',
          birthdate: birthdate || null,
          age: computedAge,
          city: city.trim(),
          country: resolvedCountry,
          location: formattedLocation,
          location_source: 'self_reported',
          location_verified_at: null,
          latitude,
          longitude,
          height,
          height_cm: readHeightCm(null, height),
          intent,
          interests,
          avatar_url: primaryPhoto,
          photos: orderedPhotos,
          reputation_score: 100,
          reputation_tier: 'Standard',
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(error.message);
      }

      // Blur previews (20261108_release_features.sql); optional, never blocks onboarding.
      const placeholders = Object.fromEntries(orderedPhotos.filter((u) => photoPlaceholders[u]).map((u) => [u, photoPlaceholders[u]]));
      if (Object.keys(placeholders).length > 0) {
        await supabase.from('profiles').update({ photo_placeholders: placeholders }).eq('id', userId);
      }

      // Bio + rhythm badges go through the screened server route; onboarding only completes once
      // the bio is accepted.
      const extras = await saveBioAndRhythm({ bio: bio.trim(), ...rhythm });
      if (!extras.ok) {
        setStep(4);
        throw new Error(extras.error);
      }
      const done = await fetch('/api/onboarding', { method: 'POST' });
      const doneData = await done.json().catch(() => ({}));
      if (done.status === 403 && doneData.error === 'vpn_detected') {
        setVpnBlocked(true);
        throw new Error(doneData.message || 'Please disable your VPN or proxy to complete onboarding.');
      }
      if (!done.ok) {
        throw new Error(doneData.error || 'Could not complete onboarding. Please try again.');
      }
      try { sessionStorage.removeItem(DRAFT_KEY); } catch {}

      router.push('/profile');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#8574B7] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] w-full flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl rounded-3xl bg-white border border-[#D0CDE1] p-6 sm:p-10 shadow-xl space-y-6">
        
        {/* Step Indicator Header */}
        <div className="space-y-3 border-b border-[#D0CDE1] pb-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8E6F1]/60 text-[#8574B7] text-xs font-medium tracking-wide">
              <Heart className="w-3.5 h-3.5 text-[#8574B7]" />
              <span>Step {step} of 5</span>
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={
                    'h-2 rounded-full transition-all duration-300 ' +
                    (s === step ? 'w-7 bg-[#8574B7]' : s < step ? 'w-2 bg-[#8574B7]/50' : 'w-2 bg-[#E8E6F1]/60')
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-medium text-[#413B5E]">
              {step === 1 && 'Choose your username'}
              {step === 2 && 'Identity & Preferences'}
              {step === 3 && 'Where are you located?'}
              {step === 4 && 'Profile Details & Interests'}
              {step === 5 && 'Add your profile photos'}
            </h1>
            <p className="text-xs sm:text-sm text-[#413B5E]/75 mt-1 leading-relaxed">
              {step === 1 && 'Claim your unique username on Asians in Love (3 to 20 characters, letters, numbers, and underscores).'}
              {step === 2 && 'Select how you identify and who you are interested in meeting.'}
              {step === 3 && 'Use GPS or enter your city and country manually.'}
              {step === 4 && 'Share your height, bio, what you are looking for, and your hobbies.'}
              {step === 5 && 'Upload 1 to 6 photos and choose your primary portrait.'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: USERNAME SELECTION */}
        {vpnBlocked && (
          <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5 space-y-1">
            <p className="text-sm font-bold text-amber-900">VPN or Proxy Detected</p>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Please turn off your VPN/Private Relay connection to verify your location and continue.
            </p>
            <button
              type="button"
              onClick={() => {
                fetch('/api/onboarding')
                  .then((r) => r.json())
                  .then((d) => setVpnBlocked(Boolean(d?.blocked)))
                  .catch(() => {});
              }}
              className="text-xs font-semibold text-amber-900 underline"
            >
              I turned it off, check again
            </button>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-[#413B5E] block mb-1">
                Username
              </label>
              <p className="text-[11px] text-[#413B5E]/75 mb-2">
                3 to 20 characters, alphanumeric and underscores only.
              </p>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-medium text-[#413B5E]/55"></span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                  placeholder="your_username"
                  maxLength={20}
                  autoFocus
                  className="w-full pl-8 pr-24 py-3 rounded-2xl bg-white border border-[#D0CDE1] text-[#413B5E] placeholder-[#413B5E]/55 focus:outline-none focus:border-[#8574B7] focus:ring-2 focus:ring-[#8574B7]/15 text-sm font-medium transition"
                />
                <div className="absolute right-3.5 flex items-center">
                  {isCheckingUsername && (
                    <Loader2 className="w-4 h-4 text-[#8574B7] animate-spin" />
                  )}
                  {!isCheckingUsername && usernameStatus?.available && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Available
                    </span>
                  )}
                  {!isCheckingUsername && usernameStatus?.available === false && (
                    <span className="text-red-500 text-xs font-semibold">Taken</span>
                  )}
                </div>
              </div>

              {!isCheckingUsername && usernameStatus?.error && (
                <p className="mt-2 text-xs text-red-600 font-medium">{usernameStatus.error}</p>
              )}

              {!isCheckingUsername && usernameStatus?.available === false && !usernameStatus?.error && (
                <div className="mt-2.5 text-xs space-y-1.5">
                  <span className="text-red-600 font-semibold">{username} is already taken.</span>
                  {usernameStatus.suggestions && usernameStatus.suggestions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[#413B5E]/75">Suggestions:</span>
                      {usernameStatus.suggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setUsername(sug)}
                          className="px-2.5 py-1 rounded-xl bg-[#E8E6F1]/60 border border-[#8574B7]/30 text-[#8574B7] font-medium text-xs hover:bg-[#8574B7] hover:text-white transition"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isCheckingUsername || !usernameStatus?.available}
              className="w-full py-3.5 rounded-2xl bg-[#8574B7] hover:bg-[#413B5E] text-white text-sm font-semibold shadow-md transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </form>
        )}

        {/* STEP 2: IDENTITY & PREFERENCES */}
        {step === 2 && (
          <form onSubmit={handleStep2Next} className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-[#413B5E] block mb-2">
                I am a:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g.val}
                    type="button"
                    onClick={() => selectGender(g.val)}
                    className={
                      'py-2.5 px-3 rounded-2xl text-xs font-semibold border transition active:scale-95 flex items-center justify-center gap-1.5 ' +
                      (gender === g.val
                        ? 'bg-[#8574B7] border-[#8574B7] text-white shadow-xs'
                        : 'bg-white border-[#D0CDE1] text-[#413B5E]/85 hover:border-[#8574B7]/40 hover:bg-[#E8E6F1]/70')
                    }
                  >
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {gender && (
              <p className="-mt-3 text-[11px] text-[#413B5E]/75">
                You&apos;ll meet {gender === 'male' ? 'women' : 'men'} on Asians in Love.
              </p>
            )}

            <div>
              <label className="text-xs font-semibold text-[#413B5E] block mb-1">
                I am here for: <span className="text-[#413B5E]/75 font-normal">(Select one)</span>
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {INTENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setIntent(opt.value)}
                    className={
                      'py-2.5 px-4 rounded-full text-xs font-semibold border transition active:scale-95 ' +
                      (intent === opt.value
                        ? 'bg-[#8574B7] border-[#8574B7] text-white shadow-xs'
                        : 'bg-white border-[#D0CDE1] text-[#413B5E]/85 hover:border-[#8574B7]/40')
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#413B5E] block mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={birthdate}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-[#D0CDE1] text-[#413B5E] focus:outline-none focus:border-[#8574B7] focus:ring-2 focus:ring-[#8574B7]/15 text-sm transition"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-2xl bg-white border border-[#D0CDE1] text-xs font-semibold text-[#413B5E]/85 hover:bg-[#E8E6F1]/40 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!gender || interestedIn.length === 0 || !intent || !birthdate}
                className="w-2/3 py-3 rounded-2xl bg-[#8574B7] hover:bg-[#413B5E] text-white text-xs font-semibold shadow-md transition disabled:opacity-40"
              >
                Continue to Location
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: LOCATION */}
        {step === 3 && (
          <form onSubmit={handleStep3Next} className="space-y-5">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D0CDE1] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#413B5E]">
                  <MapPin className="w-4 h-4 text-[#8574B7]" />
                  <span>Your Location</span>
                </div>
                {gpsCaptured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8E6F1]/60 border border-[#8574B7]/25 text-[11px] font-medium text-[#8574B7]">
                    <CheckCircle2 className="w-3 h-3 text-[#8574B7]" />
                    Coordinates Captured
                  </span>
                )}
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-[#D0CDE1] text-[11px] text-[#413B5E]/75 leading-relaxed">
                <Shield className="w-3.5 h-3.5 text-[#8574B7] shrink-0 mt-0.5" />
                <span>We only display your city and country. Full location verification is optional and can be completed later from your profile.</span>
              </div>

              <button
                type="button"
                disabled={isLocating}
                onClick={triggerLocationDetection}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#E8E6F1]/70 border border-[#D0CDE1] hover:border-[#8574B7]/50 text-xs font-semibold text-[#413B5E] inline-flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8574B7]" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 text-[#8574B7]" />
                )}
                <span>{isLocating ? 'Detecting GPS location...' : 'Auto-Detect with GPS'}</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#D0CDE1]">
                <div>
                  <label className="text-[11px] font-semibold text-[#413B5E]/85 block mb-1">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D0CDE1] text-xs font-medium text-[#413B5E] focus:outline-none focus:border-[#8574B7]"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#413B5E]/85 block mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Cebu City, Las Vegas, Bangkok"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D0CDE1] text-xs font-medium text-[#413B5E] focus:outline-none focus:border-[#8574B7] placeholder-[#413B5E]/55"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 py-3 rounded-2xl bg-white border border-[#D0CDE1] text-xs font-semibold text-[#413B5E]/85 hover:bg-[#E8E6F1]/40 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!city.trim() || !country.trim()}
                className="w-2/3 py-3 rounded-2xl bg-[#8574B7] hover:bg-[#413B5E] text-white text-xs font-semibold shadow-md transition disabled:opacity-40"
              >
                Continue to Details
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: PROFILE DETAILS */}
        {step === 4 && (
          <form onSubmit={handleStep4Next} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#413B5E] block mb-1.5">
                  Height
                </label>
                <select
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-[#D0CDE1] text-xs sm:text-sm text-[#413B5E] focus:outline-none focus:border-[#8574B7]"
                >
                  <option value="">Select height</option>
                  {HEIGHT_OPTIONS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#413B5E]">About Me (Bio)</label>
                <span className={"text-[11px] " + (bio.trim().length < 20 ? "text-red-600 font-semibold" : "text-[#413B5E]/55")}>{bio.trim().length}/500</span>
              </div>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 500))}
                placeholder="Share a bit about your personality, daily life, and values..."
                className="w-full p-3.5 rounded-2xl bg-white border border-[#D0CDE1] text-xs sm:text-sm text-[#413B5E] placeholder-[#413B5E]/55 focus:outline-none focus:border-[#8574B7] resize-none"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#D0CDE1] space-y-1">
              <p className="text-[11px] text-[#413B5E]/75">Optional: shown as badges on your profile.</p>
              <RhythmSelectors value={rhythm} onChange={setRhythm} />
            </div>



            <div>
              <label className="text-xs font-semibold text-[#413B5E] block mb-2">
                Interests & Hobbies <span className="text-[#413B5E]/75 font-normal">(Select all that apply)</span>
              </label>
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
                          ? 'bg-[#8574B7] border-[#8574B7] text-white shadow-2xs'
                          : 'bg-white border-[#D0CDE1] text-[#413B5E]/85 hover:bg-[#E8E6F1]/70')
                      }
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-2xl px-4 py-3">
                {errorMessage}
              </div>
            )}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-1/3 py-3 rounded-2xl bg-white border border-[#D0CDE1] text-xs font-semibold text-[#413B5E]/85 hover:bg-[#E8E6F1]/40 transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 rounded-2xl bg-[#8574B7] hover:bg-[#413B5E] text-white text-xs font-semibold shadow-md transition disabled:opacity-40"
                disabled={!height || bio.trim().length < 20 || interests.length === 0}
              >
                Continue to Photos
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: PHOTOS (1-6 PHOTOS, PRIMARY SELECTION) */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#413B5E] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#8574B7]" />
                  <span>Upload Your Photos ({photos.length}/6)</span>
                </label>
                <span className="text-[11px] text-[#413B5E]/75">Tap a photo to set as Primary</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {Array.from({ length: 6 }).map((_, idx) => {
                  const photoUrl = photos[idx];
                  const isPrimary = idx === primaryIdx && Boolean(photoUrl);
                  const isUploading = uploadingSlot === idx;

                  if (photoUrl) {
                    return (
                      <div
                        key={idx}
                        onClick={() => setPrimaryIdx(idx)}
                        className={
                          'relative aspect-[3/4] rounded-2xl overflow-hidden border-2 cursor-pointer transition group ' +
                          (isPrimary ? 'border-[#8574B7] ring-2 ring-[#8574B7]/25' : 'border-[#D0CDE1]')
                        }
                      >
                        <img src={photoUrl} alt={'Upload ' + (idx + 1)} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-2 flex items-center justify-between">
                          <span
                            className={
                              'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ' +
                              (isPrimary ? 'bg-[#8574B7] text-white' : 'bg-white/80 text-[#413B5E]')
                            }
                          >
                            {isPrimary ? 'Primary' : 'Set Primary'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(idx);
                          }}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-red-600 transition"
                          aria-label="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <label
                      key={idx}
                      className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-[#D0CDE1] hover:border-[#8574B7] bg-white hover:bg-[#E8E6F1]/40 flex flex-col items-center justify-center cursor-pointer transition p-2 text-center"
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingSlot !== null}
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handlePhotoUpload(e.target.files[0], idx);
                            e.target.value = '';
                          }
                        }}
                      />
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 text-[#8574B7] animate-spin" />
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-white border border-[#D0CDE1] flex items-center justify-center text-[#8574B7] mb-1.5 shadow-2xs">
                            <Plus className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-semibold text-[#413B5E]/85">
                            {idx === 0 ? 'Main Photo' : 'Add Photo'}
                          </span>
                        </>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#E8E6F1]/50 border border-[#8574B7]/20 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#8574B7] shrink-0 mt-0.5" />
              <p className="text-xs text-[#413B5E]/85 leading-relaxed">
                Clear, front-facing photos help build high trust across the community. You can manage or add more photos anytime from your profile.
              </p>
            </div>

            <p className="text-[11px] leading-relaxed text-[#413B5E]/55 text-center">
              By finishing you agree to our{' '}
              <Link href="/terms" className="font-semibold text-[#8574B7] hover:underline">Terms</Link>,{' '}
              <Link href="/privacy" className="font-semibold text-[#8574B7] hover:underline">Privacy Policy</Link> and{' '}
              <Link href="/safety" className="font-semibold text-[#8574B7] hover:underline">Safety Guide</Link>.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-1/3 py-3.5 rounded-2xl bg-white border border-[#D0CDE1] text-xs font-semibold text-[#413B5E]/85 hover:bg-[#E8E6F1]/40 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                disabled={loading || uploadingSlot !== null || photos.length === 0}
                className="w-2/3 py-3.5 rounded-2xl bg-[#8574B7] hover:bg-[#413B5E] text-white text-xs font-semibold shadow-md transition disabled:opacity-40 inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <span>Finish & View My Profile</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

