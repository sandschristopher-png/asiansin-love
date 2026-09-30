'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, UserCheck, ShieldCheck, Camera, Trash2, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

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

        const loadedPhotos: string[] = Array.isArray(data.photos) && data.photos.length > 0
          ? data.photos.filter(Boolean)
          : (data.avatar_url ? [data.avatar_url] : []);
        setPhotos(loadedPhotos);
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

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>, slotIdx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= 6 && slotIdx >= photos.length) {
      setStatusMsg({ type: 'error', text: 'Maximum limit of 6 photos reached.' });
      return;
    }

    setUploadingIdx(slotIdx);
    setStatusMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const isPrimary = slotIdx === 0;
      formData.append('isPrimaryAvatar', isPrimary ? 'true' : 'false');

      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');

      if (result.photos && Array.isArray(result.photos)) {
        setPhotos(result.photos);
      } else if (result.photoUrl) {
        if (isPrimary) {
          setPhotos((prev) => [result.photoUrl, ...prev.filter((p) => p !== result.photoUrl)]);
        } else {
          setPhotos((prev) => [...prev, result.photoUrl]);
        }
      }
      setStatusMsg({ type: 'success', text: 'Photo uploaded successfully!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Photo upload failed.' });
    } finally {
      setUploadingIdx(null);
      e.target.value = '';
    }
  };

  const handleSetPrimary = async (targetIdx: number) => {
    if (targetIdx === 0 || targetIdx >= photos.length) return;
    const targetUrl = photos[targetIdx];
    const previousPhotos = [...photos];
    const newPhotos = [targetUrl, ...photos.filter((_, idx) => idx !== targetIdx)];

    setPhotos(newPhotos);
    setStatusMsg(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: targetUrl,
          photos: newPhotos,
        })
        .eq('id', user.id);

      if (error) throw error;
      setStatusMsg({ type: 'success', text: 'Primary avatar updated!' });
    } catch (err: any) {
      setPhotos(previousPhotos);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to set avatar.' });
    }
  };

  const handleDeletePhoto = async (targetIdx: number) => {
    const previousPhotos = [...photos];
    const newPhotos = photos.filter((_, idx) => idx !== targetIdx);

    setPhotos(newPhotos);
    setStatusMsg(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates: Record<string, any> = {
        photos: newPhotos,
      };

      if (targetIdx === 0) {
        updates.avatar_url = newPhotos[0] || null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      setStatusMsg({ type: 'success', text: 'Photo removed.' });
    } catch (err: any) {
      setPhotos(previousPhotos);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to remove photo.' });
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
      <div className="min-h-screen bg-[#F8F7FA] flex items-center justify-center text-sm font-semibold text-[#9A8CC3]">
        Loading profile settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FA] text-[#1C1924]">
      <div className="max-w-xl mx-auto px-4 py-8 pb-28 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-10 w-10 rounded-2xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] hover:text-[#1C1924] flex items-center justify-center text-sm active:scale-90 transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#1C1924] tracking-tight">Edit Profile</h1>
              <p className="text-xs text-[#9A8CC3] mt-0.5">Manage your public information and identity handle</p>
            </div>
          </div>
          <Link
            href="/profile"
            className="text-xs font-semibold text-[#9A8CC3] hover:text-[#1C1924] px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 transition"
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

        {/* Photo Management Section */}
        <div className="bg-[#FFFFFF] border border-[#DDD7E5]/25 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1C1924] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#B2A4D7]" />
                Profile Photos ({photos.length}/6)
              </h2>
              <p className="text-[11px] text-[#D5CEE5]">
                Upload up to 6 photos. Slot 1 is your primary avatar shown across the app.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-1">
            {Array.from({ length: 6 }).map((_, slotIdx) => {
              const photo = photos[slotIdx];
              const isPrimary = slotIdx === 0 && Boolean(photo);
              const isUploading = uploadingIdx === slotIdx;

              if (photo) {
                return (
                  <div
                    key={slotIdx}
                    className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#FFFFFF] border border-[#E2DCE8] group"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${slotIdx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {isPrimary ? (
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#6555B8]/90 text-white text-[9px] font-bold shadow-sm">
                        Primary
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(slotIdx)}
                        className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/60 text-[#1C1924] hover:text-[#1C1924] hover:bg-[#6555B8] text-[9px] font-semibold transition"
                      >
                        Make Primary
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(slotIdx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-rose-300 hover:text-rose-100 hover:bg-rose-950/80 transition"
                      aria-label="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <label
                  key={slotIdx}
                  className="relative aspect-[3/4] rounded-xl border border-dashed border-[#DDD7E5]/40 hover:border-[#B2A4D7] bg-[#FFFFFF]/50 hover:bg-[#FFFFFF] flex flex-col items-center justify-center cursor-pointer transition p-2 text-center group"
                >
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={(e) => handleUploadPhoto(e, slotIdx)}
                    className="hidden"
                  />
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 text-[#B2A4D7] animate-spin" />
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E2DCE8] flex items-center justify-center text-[#D5CEE5] group-hover:text-[#1C1924] group-hover:border-[#B2A4D7] mb-1.5 transition">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-[#D5CEE5] group-hover:text-[#1C1924]">
                        {slotIdx === 0 ? 'Add Primary' : 'Add Photo'}
                      </span>
                    </>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Handle Claim */}
          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#9A8CC3]/35 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9A8CC3]">
              Member Handle
            </label>
            {initialHasUsername ? (
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-[#1C1924] font-bold">@{username}</span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#9A8CC3]">
                  Handle Locked
                </span>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A8CC3] font-mono">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="choose_handle"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/40 text-[#1C1924] font-mono text-sm focus:outline-none focus:border-[#9A8CC3]"
                  />
                </div>
                <p className="text-[11px] text-[#9A8CC3] mt-1.5">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9A8CC3]">
              Display Name
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
            />
          </div>

          {/* Age & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9A8CC3]">
                Age
              </label>
              <input
                type="number"
                min="18"
                max="99"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9A8CC3]">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9A8CC3]">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
              />
            </div>
          </div>

          {/* Profession & Relationship Intent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9A8CC3]">
                Profession / Occupation
              </label>
              <input
                type="text"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9A8CC3]">
                Relationship Goal
              </label>
              <select
                value={formData.relationship_goal}
                onChange={(e) => setFormData({ ...formData, relationship_goal: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9A8CC3]">
              About You
            </label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell sincere community members about your values and relationship goals..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-[#6555B8] hover:bg-[#7D4B9F] text-white font-bold text-sm shadow-lg shadow-[#6555B8]/40 transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Profile'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
