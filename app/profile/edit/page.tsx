'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Philippines');
  const [jobTitle, setJobTitle] = useState('');
  const [relationshipIntent, setRelationshipIntent] = useState('Marriage & Long-Term Partner');
  const [relocationIntent, setRelocationIntent] = useState('willing_to_relocate');
  
  // Dependents
  const [childrenStatus, setChildrenStatus] = useState('none');
  const [childrenCount, setChildrenCount] = useState(0);

  // Extended Traits
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [bodyType, setBodyType] = useState('average');
  const [aboutMe, setAboutMe] = useState('');
  const [lookingFor, setLookingFor] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setFullName(data.full_name || '');
        setUsername(data.username || '');
        setCity(data.city || '');
        setCountry(data.country || 'Philippines');
        setJobTitle(data.job_title || '');
        setRelationshipIntent(data.relationship_intent || 'Marriage & Long-Term Partner');
        setRelocationIntent(data.relocation_intent || 'willing_to_relocate');
        setChildrenStatus(data.children_status || 'none');
        setChildrenCount(data.children_count || 0);
        setHeightCm(data.height_cm || '');
        setBodyType(data.body_type || 'average');
        setAboutMe(data.bio || '');
        setLookingFor(data.looking_for || '');
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          city: city.trim(),
          country: country.trim(),
          job_title: jobTitle.trim(),
          relationship_intent: relationshipIntent,
          relocation_intent: relocationIntent,
          children_status: childrenStatus,
          children_count: childrenStatus === 'none' ? 0 : Number(childrenCount),
          height_cm: heightCm ? Number(heightCm) : null,
          body_type: bodyType,
          bio: aboutMe.trim(),
          looking_for: lookingFor.trim(),
        })
        .eq('id', user.id);

      if (error) {
        setStatusMessage({ text: error.message, error: true });
      } else {
        setStatusMessage({ text: 'Profile details updated successfully.' });
      }
    } catch {
      setStatusMessage({ text: 'An unexpected save error occurred.', error: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center text-sm font-semibold text-[#B6AEC7]">
        Loading your profile...
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#7D7E92]/25 pb-4">
        <div>
          <Link
            href="/profile"
            className="text-xs font-semibold text-[#B6AEC7] hover:text-white inline-flex items-center gap-1 mb-1"
          >
            &larr; Back to Profile
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Edit Your Profile</h1>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-xl bg-[#653C87] hover:bg-[#9A79BA] text-white text-xs font-bold transition-all shadow-lg disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${
          statusMessage.error 
            ? 'bg-rose-950/80 border border-rose-500/80 text-rose-200' 
            : 'bg-emerald-950/80 border border-emerald-500/80 text-emerald-200'
        }`}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Core Identity */}
        <div className="p-5 rounded-2xl bg-[#241E2F] border border-[#7D7E92]/30 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9A79BA]">
            Basic Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#B6AEC7] block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white text-sm focus:border-[#9A79BA] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#B6AEC7] block mb-1">
                Username
              </label>
              <input
                type="text"
                disabled
                value={username ? `@${username}` : '@member'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17131F]/50 border border-[#7D7E92]/20 text-[#7D7E92] text-sm cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#B6AEC7] block mb-1">
                City / Region
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white text-sm focus:border-[#9A79BA] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#B6AEC7] block mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white text-sm focus:border-[#9A79BA] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#B6AEC7] block mb-1">
                Occupation
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white text-sm focus:border-[#9A79BA] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Physical Attributes */}
        <div className="p-5 rounded-2xl bg-[#241E2F] border border-[#7D7E92]/30 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9A79BA]">
            Physical Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#B6AEC7] block mb-1">
                Height (in cm)
              </label>
              <input
                type="number"
                min={120}
                max={230}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 175"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white text-sm focus:border-[#9A79BA] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#B6AEC7] block mb-1">
                Body Type
              </label>
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white text-sm focus:border-[#9A79BA] outline-none"
              >
                <option value="petite">Petite</option>
                <option value="slim">Slim</option>
                <option value="athletic">Athletic</option>
                <option value="average">Average</option>
                <option value="curvy">Curvy</option>
                <option value="muscular">Muscular</option>
                <option value="full_figured">Full Figured</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Family Transparency */}
        <div className="p-5 rounded-2xl bg-[#241E2F] border border-[#7D7E92]/30 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9A79BA]">
            Family & Dependents Transparency
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#B6AEC7] block mb-1">
                Children Status
              </label>
              <select
                value={childrenStatus}
                onChange={(e) => setChildrenStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white text-sm focus:border-[#9A79BA] outline-none"
              >
                <option value="none">No Children</option>
                <option value="living_with_me">Has Children (Living with me)</option>
                <option value="not_living_with_me">Has Children (Not living with me)</option>
              </select>
            </div>

            {childrenStatus !== 'none' && (
              <div>
                <label className="text-xs font-semibold text-[#B6AEC7] block mb-1">
                  Number of Dependents
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white text-sm focus:border-[#9A79BA] outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Written Prompts */}
        <div className="p-5 rounded-2xl bg-[#241E2F] border border-[#7D7E92]/30 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9A79BA]">
            About You & What You're Seeking
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#B6AEC7] block mb-1">
                About Me (Values, lifestyle, daily routine)
              </label>
              <textarea
                rows={3}
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                placeholder="Share a sincere snapshot of your personality and character..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white text-sm focus:border-[#9A79BA] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#B6AEC7] block mb-1">
                What I'm Looking For
              </label>
              <textarea
                rows={3}
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                placeholder="What qualities do you cherish in a potential partner?..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/30 text-white text-sm focus:border-[#9A79BA] outline-none"
              />
            </div>
          </div>
        </div>

      </form>

    </div>
  );
}
