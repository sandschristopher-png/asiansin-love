'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Philippines');

  const [relationshipIntent, setRelationshipIntent] = useState('Marriage & Long-Term Partner');
  const [relocationIntent, setRelocationIntent] = useState('willing_to_relocate');
  
  // Dependents Transparency
  const [hasChildren, setHasChildren] = useState<boolean | null>(null);
  const [childrenCount, setChildrenCount] = useState<number>(1);
  const [livingSituation, setLivingSituation] = useState<'living_with_me' | 'not_living_with_me'>('living_with_me');
  
  // Portrait
  const [avatarUrl, setAvatarUrl] = useState('');

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
    if (!displayName.trim() || !birthdate || !city.trim()) {
      setErrorMessage('Please fill in all identity fields.');
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
          username: username.toLowerCase().trim(),
          full_name: displayName.trim(),
          city: city.trim(),
          country: country.trim(),
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
    <div className="min-h-[calc(100dvh-64px)] w-full flex items-center justify-center p-3.5 sm:p-6 bg-[#17131F]">
      <div className="w-full max-w-lg rounded-3xl bg-[#241E2F] border border-[#7D7E92]/30 p-5 sm:p-8 shadow-2xl space-y-6">
        
        {/* Progress Stepper */}
        <div className="flex items-center justify-between border-b border-[#7D7E92]/20 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A79BA]">
              Step {step} of 3
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {step === 1 && 'Claim Your Identity'}
              {step === 2 && 'Intent & Transparency'}
              {step === 3 && 'Profile Photo'}
            </h1>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? 'w-6 bg-[#653C87]' : s < step ? 'w-2 bg-[#9A79BA]' : 'w-2 bg-[#7D7E92]/30'
                }`}
              />
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: IDENTITY */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#B6AEC7] block mb-1.5">
                Username (@handle)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#7D7E92]">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  placeholder="yourname"
                  maxLength={20}
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white placeholder-[#7D7E92] focus:outline-none focus:border-[#9A79BA] text-base sm:text-sm font-semibold"
                />
              </div>

              <div className="mt-2 text-xs">
                {isCheckingUsername && (
                  <span className="text-[#B6AEC7]">Checking availability...</span>
                )}
                {!isCheckingUsername && usernameStatus?.available && (
                  <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    @{username} is available!
                  </span>
                )}
                {!isCheckingUsername && usernameStatus?.available === false && (
                  <div className="space-y-1.5">
                    <span className="text-rose-400 font-semibold">@{username} is already taken.</span>
                    {usernameStatus.suggestions && usernameStatus.suggestions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[#B6AEC7]">Suggested:</span>
                        {usernameStatus.suggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setUsername(sug)}
                            className="px-2 py-0.5 rounded-lg bg-[#17131F] border border-[#9A79BA]/40 text-[#ECE8F4] font-semibold text-[11px] hover:bg-[#653C87]"
                          >
                            @{sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#B6AEC7] block mb-1.5">
                Display Name (First Name)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Christopher"
                className="w-full px-4 py-3 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white placeholder-[#7D7E92] focus:outline-none focus:border-[#9A79BA] text-base sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#B6AEC7] block mb-1.5">
                  Birthdate
                </label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white focus:outline-none focus:border-[#9A79BA] text-base sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#B6AEC7] block mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Makati or Las Vegas"
                  className="w-full px-4 py-3 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white placeholder-[#7D7E92] focus:outline-none focus:border-[#9A79BA] text-base sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#B6AEC7] block mb-1.5">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white focus:outline-none focus:border-[#9A79BA] text-base sm:text-sm font-semibold"
              >
                <option value="Philippines">Philippines</option>
                <option value="Thailand">Thailand</option>
                <option value="Cambodia">Cambodia</option>
                <option value="Vietnam">Vietnam</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#653C87] hover:bg-[#9A79BA] text-white text-sm font-bold shadow-lg transition-all active:scale-95 mt-2"
            >
              Continue to Intent & Family
            </button>
          </form>
        )}

        {/* STEP 2: INTENT & DEPENDENTS */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#B6AEC7] block mb-2">
                Primary Courtship Goal
              </label>
              <div className="grid grid-cols-1 gap-2">
                {['Marriage & Long-Term Partner', 'Committed Courtship', 'Meaningful Connection'].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setRelationshipIntent(goal)}
                    className={`px-4 py-3 rounded-xl text-xs font-bold text-left border transition-all ${
                      relationshipIntent === goal
                        ? 'bg-[#653C87] border-[#9A79BA] text-white'
                        : 'bg-[#17131F] border-[#7D7E92]/30 text-[#ECE8F4] hover:border-[#7D7E92]'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#B6AEC7] block mb-2">
                Relocation Intent
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'willing_to_relocate', label: 'Willing to Relocate' },
                  { id: 'looking_to_relocate', label: 'Looking to Relocate' },
                  { id: 'not_relocating', label: 'Not Relocating' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRelocationIntent(item.id)}
                    className={`p-2.5 rounded-xl text-[11px] font-bold text-center border transition-all ${
                      relocationIntent === item.id
                        ? 'bg-[#653C87] border-[#9A79BA] text-white'
                        : 'bg-[#17131F] border-[#7D7E92]/30 text-[#ECE8F4] hover:border-[#7D7E92]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dependents Guardrail */}
            <div className="p-4 rounded-2xl bg-[#17131F] border border-[#7D7E92]/30 space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#9A79BA] block">
                  Family & Dependents Transparency
                </label>
                <p className="text-[11px] text-[#B6AEC7] mt-0.5">
                  Accurate parental status is required to protect platform trust.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHasChildren(false)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    hasChildren === false
                      ? 'bg-[#653C87] border-[#9A79BA] text-white'
                      : 'bg-[#241E2F] border-[#7D7E92]/30 text-[#ECE8F4]'
                  }`}
                >
                  No Children
                </button>
                <button
                  type="button"
                  onClick={() => setHasChildren(true)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    hasChildren === true
                      ? 'bg-[#653C87] border-[#9A79BA] text-white'
                      : 'bg-[#241E2F] border-[#7D7E92]/30 text-[#ECE8F4]'
                  }`}
                >
                  Has Children
                </button>
              </div>

              {hasChildren && (
                <div className="space-y-3 pt-2 border-t border-[#7D7E92]/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#ECE8F4]">Number of Dependents:</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setChildrenCount(count)}
                          className={`h-8 w-8 rounded-lg text-xs font-bold border transition-all ${
                            childrenCount === count
                              ? 'bg-[#653C87] border-[#9A79BA] text-white'
                              : 'bg-[#241E2F] border-[#7D7E92]/30 text-[#ECE8F4]'
                          }`}
                        >
                          {count === 4 ? '4+' : count}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#ECE8F4]">Living Arrangement:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLivingSituation('living_with_me')}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                          livingSituation === 'living_with_me'
                            ? 'bg-[#653C87] border-[#9A79BA] text-white'
                            : 'bg-[#241E2F] border-[#7D7E92]/30 text-[#ECE8F4]'
                        }`}
                      >
                        Living with me
                      </button>
                      <button
                        type="button"
                        onClick={() => setLivingSituation('not_living_with_me')}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                          livingSituation === 'not_living_with_me'
                            ? 'bg-[#653C87] border-[#9A79BA] text-white'
                            : 'bg-[#241E2F] border-[#7D7E92]/30 text-[#ECE8F4]'
                        }`}
                      >
                        Not living with me
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-xs font-bold text-[#ECE8F4] hover:bg-[#3B1E42]"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 rounded-xl bg-[#653C87] hover:bg-[#9A79BA] text-white text-xs font-bold shadow-lg transition-all"
              >
                Continue to Photo
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: PHOTO UPLOAD */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#B6AEC7] block mb-1.5">
                Portrait Photo URL / Headshot
              </label>
              <p className="text-xs text-[#B6AEC7] mb-3">
                Provide a clear, unfiltered portrait of yourself to complete your profile setup.
              </p>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/your-photo.jpg"
                className="w-full px-4 py-3 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white placeholder-[#7D7E92] focus:outline-none focus:border-[#9A79BA] text-base sm:text-sm"
              />
            </div>

            {avatarUrl && (
              <div className="flex justify-center py-2">
                <div className="h-28 w-28 rounded-2xl overflow-hidden border-2 border-[#9A79BA] bg-[#17131F] shadow-lg">
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={() => setErrorMessage('Invalid image URL format.')}
                  />
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-xs text-[#ECE8F4] space-y-1">
              <p className="font-bold text-white">Starting Reputation: 100% Rep</p>
              <p className="text-[11px] text-[#B6AEC7]">
                Your account begins in Standard Standing. Maintain respectful communication and complete pose selfie verification later to earn verified badges.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 py-3 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-xs font-bold text-[#ECE8F4] hover:bg-[#3B1E42]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                disabled={loading}
                className="w-2/3 py-3 rounded-xl bg-[#653C87] hover:bg-[#9A79BA] disabled:opacity-50 text-white text-xs font-bold shadow-lg transition-all"
              >
                {loading ? 'Activating Profile...' : 'Complete & Discover Matches'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
