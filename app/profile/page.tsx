'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [profession, setProfession] = useState('');
  const [relationshipGoal, setRelationshipGoal] = useState('Meaningful Connection');
  const [bio, setBio] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setStatusMessage({ type: 'error', text: 'Please sign in to edit your profile.' });
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setDisplayName(data.full_name || '');
          setAge(data.age || '');
          setCity(data.city || '');
          setCountry(data.country || '');
          setProfession(data.profession || '');
          setRelationshipGoal(data.relationship_goal || 'Meaningful Connection');
          setBio(data.bio || '');
          setIsVerified(Boolean(data.is_verified));
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication session not found. Please log in.');

      const updates = {
        id: user.id,
        full_name: displayName.trim(),
        age: age ? Number(age) : null,
        city: city.trim(),
        country: country.trim(),
        profession: profession.trim(),
        relationship_goal: relationshipGoal,
        bio: bio.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      setStatusMessage({ type: 'success', text: 'Profile saved successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Unable to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-lg mx-auto w-full px-4 py-16 text-center text-[#B8AAC3]">
        <div className="h-8 w-8 border-2 border-[#653C87] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Loading your details...</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto w-full px-4 py-8 pb-20">
      
      {/* Verification Status Card */}
      {!isVerified ? (
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-[#241E2F] to-[#2F243B] border border-[#653C87]/60 p-5 shadow-xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black uppercase tracking-wider">
              <span>🛡️</span> Profile Unverified
            </div>
            <p className="text-xs text-[#DDD8D4] leading-relaxed">
              Complete gesture selfie verification to earn the <strong className="text-white">✓ Verified</strong> badge and build sincere trust.
            </p>
          </div>
          <Link
            href="/verify"
            className="px-3.5 py-2.5 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-xs font-black flex-shrink-0 shadow-md active:scale-95 transition-all"
          >
            Get Verified
          </Link>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 p-3.5 flex items-center gap-2 text-xs font-bold text-emerald-300">
          <span>✓</span> Your identity is verified and active across the community.
        </div>
      )}

      {/* Page Heading */}
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white tracking-tight">
          Your Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#DDD8D4] mt-1">
          Tell sincere community members about your lifestyle and relationship goals.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl mb-5 text-xs font-bold transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-5 sm:p-7 shadow-xl space-y-4">
        
        <div>
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#B8AAC3] block mb-1">
            Display Name
          </label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8]"
          />
        </div>

        <div>
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#B8AAC3] block mb-1">
            Age
          </label>
          <input
            type="number"
            min={18}
            max={99}
            value={age}
            onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#B8AAC3] block mb-1">
              City / Region
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8]"
            />
          </div>
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#B8AAC3] block mb-1">
              Country
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8]"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#B8AAC3] block mb-1">
            Profession / Occupation
          </label>
          <input
            type="text"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8]"
          />
        </div>

        <div>
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#B8AAC3] block mb-1">
            Relationship Goal
          </label>
          <select
            value={relationshipGoal}
            onChange={(e) => setRelationshipGoal(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8]"
          >
            <option value="Meaningful Connection">Meaningful Connection</option>
            <option value="Marriage & Long-Term Partner">Marriage & Long-Term Partner</option>
            <option value="Committed Relationship">Committed Relationship</option>
            <option value="Cultural Exchange & Friendship">Cultural Exchange & Friendship</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#B8AAC3] block mb-1">
            About You & Your Values
          </label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share your values, passions, and what you are looking for..."
            className="w-full px-4 py-3 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8] placeholder-[#725A7A]"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-[#653C87] hover:bg-[#7A49A2] disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-[#653C87]/40 active:scale-[0.98] transition-all pt-3"
        >
          {saving ? 'Saving Changes...' : 'Save Profile'}
        </button>

      </form>
    </main>
  );
}