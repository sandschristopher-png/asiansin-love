'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, UserCheck, ShieldCheck } from 'lucide-react';
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
    relationship_goal: 'Marriage',
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
        setFormData({
          full_name: data.display_name || data.full_name || '',
          age: data.age ? String(data.age) : '',
          city: data.city || '',
          country: data.country || '',
          profession: data.profession || '',
          relationship_goal: data.relationship_goal || 'Marriage',
          bio: data.bio || '',
        });

        if (data.username) {
          setUsername(data.username);
          setInitialHasUsername(true);
        }
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
      const res = await fetch(`/api/users/check-username?username=${clean}`);
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates: Record<string, any> = {
        id: user.id,
        display_name: formData.full_name.trim() || 'Member',
        full_name: formData.full_name.trim(),
        age: formData.age ? parseInt(formData.age, 10) : null,
        city: formData.city.trim(),
        country: formData.country.trim(),
        profession: formData.profession.trim(),
        relationship_goal: formData.relationship_goal,
        bio: formData.bio.trim(),
        updated_at: new Date().toISOString(),
      };

      if (!initialHasUsername && username.trim().length >= 3 && usernameStatus === 'available') {
        updates.username = username.trim();
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#130F18] flex items-center justify-center text-sm font-semibold text-[#9A79BA]">
        Loading profile settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#130F18] text-[#E6D7FA]">
      <div className="max-w-xl mx-auto px-4 py-8 pb-28 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-10 w-10 rounded-2xl bg-[#261F33] border border-[#9A79BA]/35 text-[#E6D7FA] hover:text-white flex items-center justify-center text-sm active:scale-90 transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Edit Profile</h1>
              <p className="text-xs text-[#9A79BA] mt-0.5">Manage your public information and identity handle</p>
            </div>
          </div>
          <Link
            href="/profile"
            className="text-xs font-semibold text-[#9A79BA] hover:text-white px-3.5 py-2 rounded-xl bg-[#261F33] border border-[#9A79BA]/35 transition"
          >
            View Bio
          </Link>
        </div>

        {statusMsg && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Handle Claim */}
          <div className="p-4 rounded-2xl bg-[#261F33] border border-[#9A79BA]/35 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9A79BA]">
              Member Handle
            </label>
            {initialHasUsername ? (
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-white font-bold">@{username}</span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-[#181222] border border-[#9A79BA]/35 text-[#9A79BA]">
                  Handle Locked
                </span>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A79BA] font-mono">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="choose_handle"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#181222] border border-[#9A79BA]/40 text-white font-mono text-sm focus:outline-none focus:border-[#9A79BA]"
                  />
                </div>
                <p className="text-[11px] text-[#9A79BA] mt-1.5">
                  {usernameStatus === 'checking' && 'Checking availability...'}
                  {usernameStatus === 'available' && <span className="text-emerald-400">Handle is available.</span>}
                  {usernameStatus === 'taken' && <span className="text-rose-400">Handle is already taken.</span>}
                  {usernameStatus === 'idle' && 'Claim your unique handle.'}
                </p>
              </div>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9A79BA]">
              Display Name
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#181222] border border-[#9A79BA]/35 text-white text-sm focus:outline-none focus:border-[#9A79BA]"
            />
          </div>

          {/* Age & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9A79BA]">
                Age
              </label>
              <input
                type="number"
                min="18"
                max="99"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#181222] border border-[#9A79BA]/35 text-white text-sm focus:outline-none focus:border-[#9A79BA]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9A79BA]">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#181222] border border-[#9A79BA]/35 text-white text-sm focus:outline-none focus:border-[#9A79BA]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9A79BA]">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#181222] border border-[#9A79BA]/35 text-white text-sm focus:outline-none focus:border-[#9A79BA]"
              />
            </div>
          </div>

          {/* Profession & Relationship Intent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9A79BA]">
                Profession / Occupation
              </label>
              <input
                type="text"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#181222] border border-[#9A79BA]/35 text-white text-sm focus:outline-none focus:border-[#9A79BA]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9A79BA]">
                Relationship Goal
              </label>
              <select
                value={formData.relationship_goal}
                onChange={(e) => setFormData({ ...formData, relationship_goal: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#181222] border border-[#9A79BA]/35 text-white text-sm focus:outline-none focus:border-[#9A79BA]"
              >
                <option value="Marriage">Marriage</option>
                <option value="Serious Relationship">Serious Relationship</option>
                <option value="Long-Term Dating">Long-Term Dating</option>
                <option value="Casual Dating">Casual Dating</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9A79BA]">
              About You
            </label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell sincere community members about your values and relationship goals..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#181222] border border-[#9A79BA]/35 text-white text-sm focus:outline-none focus:border-[#9A79BA]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-[#653C87] hover:bg-[#7D49A8] text-white font-bold text-sm shadow-lg shadow-[#653C87]/40 transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Profile'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
