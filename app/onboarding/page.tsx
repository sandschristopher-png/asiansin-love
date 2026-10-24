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
  Trash2,
  Plus,
  Check,
  Shield
} from 'lucide-react';
import { captureCurrentLocation } from '@/lib/location';
import { supabase } from '@/lib/supabase/client';
import { INTENT_OPTIONS } from '@/lib/intents';

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
  const [weight, setWeight] = useState('');
  const [bio, setBio] = useState('');
  
  const [interests, setInterests] = useState<string[]>([]);

  // Step 5: Photos (1-6 photos uploaded to user_photos bucket)
  const [photos, setPhotos] = useState<string[]>([]);
  const [primaryIdx, setPrimaryIdx] = useState<number>(0);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

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
        if (profile.username && !profile.username.startsWith('user_')) {
          setUsername(profile.username);
        }
        if (profile.gender) setGender(profile.gender);
        if (Array.isArray(profile.interested_in) && profile.interested_in.length > 0) {
          setInterestedIn(profile.interested_in);
        }
        if (profile.birthdate) setBirthdate(profile.birthdate);
        if (profile.city) setCity(profile.city);
        if (profile.country) setCountry(profile.country);
        if (profile.height) setHeight(profile.height);
        if (profile.weight) setWeight(profile.weight);
        if (profile.bio) setBio(profile.bio);
        
    if (profile.intent) setIntent(profile.intent);
        if (Array.isArray(profile.interests)) setInterests(profile.interests);
        if (Array.isArray(profile.photos) && profile.photos.length > 0) {
          setPhotos(profile.photos.filter(Boolean));
        } else if (profile.avatar_url) {
          setPhotos([profile.avatar_url]);
        }
      }
    }
    checkAuth();
  }, [router]);

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
        let query = supabase
          .from('profiles')
          .select('id, username')
          .ilike('username', clean);

        if (userId) {
          query = query.neq('id', userId);
        }

        const { data: existing, error } = await query.maybeSingle();
        if (error) {
          setUsernameStatus({ available: false, error: error.message });
          return;
        }

        if (!existing) {
          setUsernameStatus({ available: true });
        } else {
          const base = clean.slice(0, 15);
          const candidates = [
            base + '_lv',
            base + '_' + Math.floor(Math.random() * 89 + 10),
            ('real_' + base).slice(0, 20),
            base + '_ph',
          ];
          const { data: takenRows } = await supabase
            .from('profiles')
            .select('username')
            .in('username', candidates);
          const takenSet = new Set((takenRows || []).map((r: any) => String(r.username || '').toLowerCase()));
          const suggestions = candidates.filter((c) => !takenSet.has(c.toLowerCase())).slice(0, 3);
          setUsernameStatus({
            available: false,
            suggestions,
          });
        }
      } catch {
        setUsernameStatus({ available: false, error: 'Could not verify username availability.' });
      } finally {
        setIsCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, userId]);

  const toggleInterestedIn = (val: string) => {
    setInterestedIn((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

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
    if (!weight) {
      setErrorMessage('Please select your weight.');
      return;
    }
    if (bio.trim().length < 20) {
      setErrorMessage('Please write at least 20 characters in your About Me bio.');
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
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Photo exceeds the 10MB limit.');
      return;
    }

    setUploadingSlot(slotIdx);
    setErrorMessage(null);

    try {
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
      const formattedLocation = city.trim() + ', ' + country.trim();

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: cleanHandle,
          display_name: cleanHandle,
          full_name: cleanHandle,
          gender,
          interested_in: interestedIn,
          seeking_gender: interestedIn[0] === 'male' ? 'male' : interestedIn[0] === 'male' ? 'female' : 'female',
          birthdate: birthdate || null,
          age: computedAge,
          city: city.trim(),
          country: country.trim(),
          location: formattedLocation,
          location_source: 'self_reported',
          location_verified_at: null,
          latitude,
          longitude,
          height,
          weight,
          bio: bio.trim(),
          
          intent,
          interests,
          avatar_url: primaryPhoto,
          photos: orderedPhotos,
          onboarding_completed: true,
          reputation_score: 100,
          reputation_tier: 'Standard',
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(error.message);
      }

      router.push('/profile');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not save your profile. Please try again.');
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
              <span>Step {step} of 5</span>
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={
                    'h-2 rounded-full transition-all duration-300 ' +
                    (s === step ? 'w-7 bg-[#6555b8]' : s < step ? 'w-2 bg-[#6555b8]/50' : 'w-2 bg-[#DDD7E5]')
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-medium text-[#1C1924]">
              {step === 1 && 'Choose your username'}
              {step === 2 && 'Identity & Preferences'}
              {step === 3 && 'Where are you located?'}
              {step === 4 && 'Profile Details & Interests'}
              {step === 5 && 'Add your profile photos'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6C637B] mt-1 leading-relaxed">
              {step === 1 && 'Claim your unique username on Asians in Love (3 to 20 characters, letters, numbers, and underscores).'}
              {step === 2 && 'Select how you identify and who you are interested in meeting.'}
              {step === 3 && 'Use GPS or enter your city and country manually.'}
              {step === 4 && 'Share your height, weight, bio, what you are looking for, and your hobbies.'}
              {step === 5 && 'Upload 1 to 6 photos and choose your primary portrait.'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: USERNAME SELECTION */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-[#1C1924] block mb-1">
                Username
              </label>
              <p className="text-[11px] text-[#6C637B] mb-2">
                3 to 20 characters, alphanumeric and underscores only.
              </p>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-medium text-[#8C849B]"></span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                  placeholder="your_username"
                  maxLength={20}
                  autoFocus
                  className="w-full pl-8 pr-24 py-3 rounded-2xl bg-white border border-[#DDD7E5] text-[#1C1924] placeholder-[#8C849B] focus:outline-none focus:border-[#6555b8] focus:ring-2 focus:ring-[#6555b8]/15 text-sm font-medium transition"
                />
                <div className="absolute right-3.5 flex items-center">
                  {isCheckingUsername && (
                    <Loader2 className="w-4 h-4 text-[#6555b8] animate-spin" />
                  )}
                  {!isCheckingUsername && usernameStatus?.available && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Available
                    </span>
                  )}
                  {!isCheckingUsername && usernameStatus?.available === false && (
                    <span className="text-rose-500 text-xs font-semibold">Taken</span>
                  )}
                </div>
              </div>

              {!isCheckingUsername && usernameStatus?.error && (
                <p className="mt-2 text-xs text-rose-600 font-medium">{usernameStatus.error}</p>
              )}

              {!isCheckingUsername && usernameStatus?.available === false && !usernameStatus?.error && (
                <div className="mt-2.5 text-xs space-y-1.5">
                  <span className="text-rose-600 font-semibold">{username} is already taken.</span>
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
              className="w-full py-3.5 rounded-2xl bg-[#6555b8] hover:bg-[#52449e] text-white text-sm font-semibold shadow-md transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </form>
        )}

        {/* STEP 2: IDENTITY & PREFERENCES */}
        {step === 2 && (
          <form onSubmit={handleStep2Next} className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-[#1C1924] block mb-2">
                I am a:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g.val}
                    type="button"
                    onClick={() => setGender(g.val)}
                    className={
                      'py-2.5 px-3 rounded-2xl text-xs font-semibold border transition active:scale-95 flex items-center justify-center gap-1.5 ' +
                      (gender === g.val
                        ? 'bg-[#6555b8] border-[#6555b8] text-white shadow-xs'
                        : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:border-[#6555b8]/40 hover:bg-[#F3EFFC]')
                    }
                  >
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1C1924] block mb-1">
                I am interested in: <span className="text-[#6C637B] font-normal">(Select all that apply)</span>
              </label>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {INTERESTED_IN_OPTIONS.map((opt) => {
                  const checked = interestedIn.includes(opt.val);
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => toggleInterestedIn(opt.val)}
                      className={
                        'py-2.5 px-3 rounded-2xl text-xs font-semibold border transition active:scale-95 flex items-center justify-between ' +
                        (checked
                          ? 'bg-[#F3EFFC] border-[#6555b8] text-[#6555b8] shadow-xs'
                          : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:border-[#6555b8]/40')
                      }
                    >
                      <span>{opt.label}</span>
                      <span
                        className={
                          'w-4 h-4 rounded-md flex items-center justify-center border ' +
                          (checked ? 'bg-[#6555b8] border-[#6555b8] text-white' : 'border-[#CFC8DC] bg-white')
                        }
                      >
                        {checked && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1C1924] block mb-1">
                I am here for: <span className="text-[#6C637B] font-normal">(Select one)</span>
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
                        ? 'bg-[#6555b8] border-[#6555b8] text-white shadow-xs'
                        : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:border-[#6555b8]/40')
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1C1924] block mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={birthdate}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-[#DDD7E5] text-[#1C1924] focus:outline-none focus:border-[#6555b8] focus:ring-2 focus:ring-[#6555b8]/15 text-sm transition"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-2xl bg-white border border-[#DDD7E5] text-xs font-semibold text-[#524B5E] hover:bg-[#F8F7FA] transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!gender || interestedIn.length === 0 || !intent || !birthdate}
                className="w-2/3 py-3 rounded-2xl bg-[#6555b8] hover:bg-[#52449e] text-white text-xs font-semibold shadow-md transition disabled:opacity-40"
              >
                Continue to Location
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: LOCATION */}
        {step === 3 && (
          <form onSubmit={handleStep3Next} className="space-y-5">
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1924]">
                  <MapPin className="w-4 h-4 text-[#6555b8]" />
                  <span>Your Location</span>
                </div>
                {gpsCaptured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3EFFC] border border-[#6555b8]/25 text-[11px] font-medium text-[#6555b8]">
                    <CheckCircle2 className="w-3 h-3 text-[#6555b8]" />
                    Coordinates Captured
                  </span>
                )}
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-[#E5E1EC] text-[11px] text-[#6C637B] leading-relaxed">
                <Shield className="w-3.5 h-3.5 text-[#6555b8] shrink-0 mt-0.5" />
                <span>We only display your city and country. Full location verification is optional and can be completed later from your profile.</span>
              </div>

              <button
                type="button"
                disabled={isLocating}
                onClick={triggerLocationDetection}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#F3EFFC] border border-[#DDD7E5] hover:border-[#6555b8]/50 text-xs font-semibold text-[#1C1924] inline-flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6555b8]" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 text-[#6555b8]" />
                )}
                <span>{isLocating ? 'Detecting GPS location...' : 'Auto-Detect with GPS'}</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5E1EC]">
                <div>
                  <label className="text-[11px] font-semibold text-[#524B5E] block mb-1">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD7E5] text-xs font-medium text-[#1C1924] focus:outline-none focus:border-[#6555b8]"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#524B5E] block mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Cebu City, Las Vegas, Bangkok"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD7E5] text-xs font-medium text-[#1C1924] focus:outline-none focus:border-[#6555b8] placeholder-[#8C849B]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 py-3 rounded-2xl bg-white border border-[#DDD7E5] text-xs font-semibold text-[#524B5E] hover:bg-[#F8F7FA] transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!city.trim() || !country.trim()}
                className="w-2/3 py-3 rounded-2xl bg-[#6555b8] hover:bg-[#52449e] text-white text-xs font-semibold shadow-md transition disabled:opacity-40"
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
                <label className="text-xs font-semibold text-[#1C1924] block mb-1.5">
                  Height
                </label>
                <select
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-[#DDD7E5] text-xs sm:text-sm text-[#1C1924] focus:outline-none focus:border-[#6555b8]"
                >
                  <option value="">Select height</option>
                  {HEIGHT_OPTIONS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1C1924] block mb-1.5">
                  Weight
                </label>
                <select
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-[#DDD7E5] text-xs sm:text-sm text-[#1C1924] focus:outline-none focus:border-[#6555b8]"
                >
                  <option value="">Select weight</option>
                  {WEIGHT_OPTIONS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#1C1924]">About Me (Bio)</label>
                <span className={"text-[11px] " + (bio.trim().length < 20 ? "text-rose-600 font-semibold" : "text-[#8C849B]")}>{bio.trim().length}/500</span>
              </div>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 500))}
                placeholder="Share a bit about your personality, daily life, and values..."
                className="w-full p-3.5 rounded-2xl bg-white border border-[#DDD7E5] text-xs sm:text-sm text-[#1C1924] placeholder-[#8C849B] focus:outline-none focus:border-[#6555b8] resize-none"
              />
            </div>



            <div>
              <label className="text-xs font-semibold text-[#1C1924] block mb-2">
                Interests & Hobbies <span className="text-[#6C637B] font-normal">(Select all that apply)</span>
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
                          ? 'bg-[#6555b8] border-[#6555b8] text-white shadow-2xs'
                          : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:bg-[#F3EFFC]')
                      }
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-1/3 py-3 rounded-2xl bg-white border border-[#DDD7E5] text-xs font-semibold text-[#524B5E] hover:bg-[#F8F7FA] transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 rounded-2xl bg-[#6555b8] hover:bg-[#52449e] text-white text-xs font-semibold shadow-md transition disabled:opacity-40"
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
                <label className="text-xs font-semibold text-[#1C1924] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#6555b8]" />
                  <span>Upload Your Photos ({photos.length}/6)</span>
                </label>
                <span className="text-[11px] text-[#6C637B]">Tap a photo to set as Primary</span>
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
                          (isPrimary ? 'border-[#6555b8] ring-2 ring-[#6555b8]/25' : 'border-[#DDD7E5]')
                        }
                      >
                        <img src={photoUrl} alt={'Upload ' + (idx + 1)} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-2 flex items-center justify-between">
                          <span
                            className={
                              'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ' +
                              (isPrimary ? 'bg-[#6555b8] text-white' : 'bg-white/80 text-[#1C1924]')
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
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition"
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
                      className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-[#DDD7E5] hover:border-[#6555b8] bg-[#F8F7FA] hover:bg-[#F3EFFC]/40 flex flex-col items-center justify-center cursor-pointer transition p-2 text-center"
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
                        <Loader2 className="w-5 h-5 text-[#6555b8] animate-spin" />
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-white border border-[#DDD7E5] flex items-center justify-center text-[#6555b8] mb-1.5 shadow-2xs">
                            <Plus className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-semibold text-[#524B5E]">
                            {idx === 0 ? 'Main Photo' : 'Add Photo'}
                          </span>
                        </>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F3EFFC]/70 border border-[#6555b8]/20 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#6555b8] shrink-0 mt-0.5" />
              <p className="text-xs text-[#524B5E] leading-relaxed">
                Clear, front-facing photos help build high trust across the community. You can manage or add more photos anytime from your profile.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-1/3 py-3.5 rounded-2xl bg-white border border-[#DDD7E5] text-xs font-semibold text-[#524B5E] hover:bg-[#F8F7FA] transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                disabled={loading || uploadingSlot !== null || photos.length === 0}
                className="w-2/3 py-3.5 rounded-2xl bg-[#6555b8] hover:bg-[#52449e] text-white text-xs font-semibold shadow-md transition disabled:opacity-40 inline-flex items-center justify-center gap-2"
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
