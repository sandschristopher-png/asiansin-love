'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [initialHasUsername, setInitialHasUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    city: '',
    country: '',
    profession: '',
    relationship_goal: 'Meaningful Connection',
    bio: '',
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        if (data.username) {
          setInitialHasUsername(true);
          setUsername(data.username);
        }
        setFormData({
          full_name: data.full_name || '',
          age: data.age ? String(data.age) : '',
          city: data.city || '',
          country: data.country || '',
          profession: data.profession || '',
          relationship_goal: data.relationship_goal || 'Meaningful Connection',
          bio: data.bio || '',
        });
      }
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  const handleUsernameChange = async (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);

    if (clean.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    try {
      const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(clean)}`);
      const data = await res.json();
      setUsernameStatus(data.available ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!initialHasUsername && username.trim().length >= 3 && usernameStatus === 'taken') {
      setStatusMsg({ type: 'error', text: 'Please choose an available username before saving.' });
      setSaving(false);
      return;
    }

    const payload: Record<string, any> = {
      full_name: formData.full_name.trim(),
      age: formData.age ? parseInt(formData.age, 10) : null,
      city: formData.city.trim(),
      country: formData.country.trim(),
      profession: formData.profession.trim(),
      relationship_goal: formData.relationship_goal,
      bio: formData.bio.trim(),
      updated_at: new Date().toISOString(),
    };

    if (!initialHasUsername && username.trim().length >= 3) {
      payload.username = username.trim();
      payload.username_changed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id);

    if (error) {
      setStatusMsg({ type: 'error', text: error.message });
    } else {
      setStatusMsg({ type: 'success', text: 'Profile updated successfully.' });
      if (!initialHasUsername && payload.username) {
        setInitialHasUsername(true);
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#9A79BA] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Edit Profile</h1>
          <p className="text-sm text-[#B6AEC7] mt-1">Manage your public information and verification status</p>
        </div>
        <Link
          href="/profile"
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#241E2F] border border-[#7D7E92]/30 text-[#ECE8F4] hover:text-white"
        >
          View Profile
        </Link>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl mb-6 text-sm border font-medium ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Username Section */}
        <div className="p-4 rounded-2xl bg-[#241E2F]/60 border border-[#7D7E92]/25 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#B6AEC7]">
            Username
          </label>
          {initialHasUsername ? (
            <div className="flex items-center justify-between">
              <span className="font-mono text-white text-base">@{username}</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-[#17131F] border border-[#7D7E92]/30 text-[#B6AEC7]">
                Handle Locked (Anti-Scam Protection)
              </span>
            </div>
          ) : (
            <div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D7E92] font-mono">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="choose_handle"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#17131F] border border-[#7D7E92]/40 text-white font-mono text-sm focus:outline-none focus:border-[#9A79BA]"
                />
              </div>
              <p className="text-[11px] text-[#7D7E92] mt-1.5">
                {usernameStatus === 'checking' && 'Checking availability...'}
                {usernameStatus === 'available' && <span className="text-emerald-400">Username is available. Once set, changes require cooldown/verification.</span>}
                {usernameStatus === 'taken' && <span className="text-rose-400">Username is taken.</span>}
                {usernameStatus === 'idle' && 'Claim your unique handle. Once claimed, frequent handle changes are restricted.'}
              </p>
            </div>
          )}
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#B6AEC7] mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-[#241E2F] border border-[#7D7E92]/30 text-white text-sm focus:outline-none focus:border-[#9A79BA]"
          />
        </div>

        {/* Age & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#B6AEC7] mb-1.5">
              Age
            </label>
            <input
              type="number"
              min="18"
              max="99"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#241E2F] border border-[#7D7E92]/30 text-white text-sm focus:outline-none focus:border-[#9A79BA]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#B6AEC7] mb-1.5">
              City / Region
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#241E2F] border border-[#7D7E92]/30 text-white text-sm focus:outline-none focus:border-[#9A79BA]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#B6AEC7] mb-1.5">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#241E2F] border border-[#7D7E92]/30 text-white text-sm focus:outline-none focus:border-[#9A79BA]"
            />
          </div>
        </div>

        {/* Profession & Relationship Goal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#B6AEC7] mb-1.5">
              Profession / Occupation
            </label>
            <input
              type="text"
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#241E2F] border border-[#7D7E92]/30 text-white text-sm focus:outline-none focus:border-[#9A79BA]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#B6AEC7] mb-1.5">
              Relationship Goal
            </label>
            <select
              value={formData.relationship_goal}
              onChange={(e) => setFormData({ ...formData, relationship_goal: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#241E2F] border border-[#7D7E92]/30 text-white text-sm focus:outline-none focus:border-[#9A79BA]"
            >
              <option value="Meaningful Connection">Meaningful Connection</option>
              <option value="Marriage & Long-Term Partner">Marriage & Long-Term Partner</option>
              <option value="Committed Courtship">Committed Courtship</option>
            </select>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#B6AEC7] mb-1.5">
            About You
          </label>
          <textarea
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell sincere community members about your lifestyle and relationship goals..."
            className="w-full px-4 py-2.5 rounded-xl bg-[#241E2F] border border-[#7D7E92]/30 text-white text-sm focus:outline-none focus:border-[#9A79BA]"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-[#653C87] hover:bg-[#9A79BA] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
        >
          {saving ? 'Saving Changes...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
