'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function UserProfileSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [relationshipIntent, setRelationshipIntent] = useState('Long-Term Relationship');
  const [bio, setBio] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          // If not logged in, populate demo data so UI works smoothly
          setFullName('Christopher');
          setAge('63');
          setCity('Las Vegas');
          setCountry('United States');
          setJobTitle('Software Developer');
          setBio('Kind-hearted, active, and sincere gentleman seeking a genuine Southeast Asian partner for lifelong marriage and companionship.');
          setLoading(false);
          return;
        }

        setUser(session.user);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setFullName(data.full_name || '');
          setAge(data.age ? data.age.toString() : '');
          setCity(data.city || '');
          setCountry(data.country || '');
          setJobTitle(data.job_title || '');
          setRelationshipIntent(data.relationship_intent || 'Long-Term Relationship');
          setBio(data.bio || '');
          setIsVerified(data.is_verified || false);
        } else {
          // Defaults from auth metadata
          setFullName(session.user.user_metadata?.full_name || '');
        }
      } catch (err: any) {
        console.warn('Profile load info:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      if (user) {
        const payload = {
          id: user.id,
          full_name: fullName,
          age: parseInt(age, 10) || 0,
          city,
          country,
          job_title: jobTitle,
          relationship_intent: relationshipIntent,
          bio,
        };

        const { error } = await supabase
          .from('profiles')
          .upsert(payload);

        if (error) throw error;
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto w-full px-4 py-16 text-center text-[#DDD8D4]">
        Loading profile settings...
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto w-full px-3 sm:px-6 py-6 flex-1 flex flex-col justify-center">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#725A7A]/25 pb-3.5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-[family-name:var(--font-nunito)]">
              My Profile
            </h1>
            {isVerified ? (
              <span className="px-2 py-0.5 rounded-md bg-[#653C87] text-white text-[10px] font-bold">
                ✓ Verified
              </span>
            ) : (
              <Link
                href="/verify"
                className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-bold hover:bg-amber-900/60"
              >
                + Get Verified
              </Link>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#DDD8D4] mt-0.5 font-normal">
            Manage your personal profile and relationship preferences.
          </p>
        </div>

        <Link
          href="/discover"
          className="px-3 py-1.5 rounded-xl bg-[#241E2F] border border-[#725A7A]/35 text-xs sm:text-sm font-bold text-[#DDD8D4] hover:text-white transition-colors"
        >
          View Discover Feed
        </Link>
      </div>

      {savedSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs text-center font-bold animate-in fade-in">
          ✓ Profile saved successfully!
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs text-center font-bold animate-in fade-in">
          {errorMsg}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-5 sm:p-7 shadow-xl space-y-4">
          
          <h2 className="text-base sm:text-lg font-bold text-white border-b border-[#725A7A]/20 pb-2">
            Basic Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#B8AAC3] block mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#B8AAC3] block mb-1">
                Age
              </label>
              <input
                type="number"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#B8AAC3] block mb-1">
                City / Region
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#B8AAC3] block mb-1">
                Country
              </label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#B8AAC3] block mb-1">
              Profession / Occupation
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#B8AAC3] block mb-1">
              Relationship Goal
            </label>
            <select
              value={relationshipIntent}
              onChange={(e) => setRelationshipIntent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8] cursor-pointer"
            >
              <option value="Long-Term Relationship">Long-Term Relationship</option>
              <option value="Committed Relationship">Committed Relationship</option>
              <option value="Meaningful Connection">Meaningful Connection</option>
              <option value="Lifelong Partnership">Lifelong Partnership</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#B8AAC3] block mb-1">
              About You & Your Values
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8] leading-relaxed resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] disabled:opacity-50 text-white font-bold text-sm sm:text-base shadow-lg shadow-[#41384E]/50 transition-all active:scale-[0.98]"
            >
              {saving ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>

        </div>
      </form>
    </main>
  );
}
