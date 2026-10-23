'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Save, UserCheck, ShieldCheck, Camera, Trash2, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import UpgradeModal from '@/components/UpgradeModal';



function cleanHeightForDb(input: string): string | null {
  if (!input || !input.trim()) return null;
  const raw = input.trim();

  // If already matches "XXX cm", return trimmed
  const cmMatch = raw.match(/^(\d{2,3})\s*cm$/i);
  if (cmMatch) return `${cmMatch[1]} cm`;

  // If user entered just numbers (e.g. 165 or 170)
  const numOnlyMatch = raw.match(/^(\d{2,3})$/);
  if (numOnlyMatch) return `${numOnlyMatch[1]} cm`;

  // If user entered imperial like 5'5", 5ft 5, 5'5
  const imperialMatch = raw.match(/^(\d)['’fts]+(\d{1,2})["”ins]*$/i);
  if (imperialMatch) {
    const feet = parseInt(imperialMatch[1], 10);
    const inches = parseInt(imperialMatch[2], 10);
    const totalInches = feet * 12 + inches;
    const cm = Math.round(totalInches * 2.54);
    return `${cm} cm`;
  }

  // Fallback: extract any 2-3 digit number found
  const anyNum = raw.match(/(\d{2,3})/);
  if (anyNum) return `${anyNum[1]} cm`;

  return null;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [verifyingLocation, setVerifyingLocation] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const [initialHasUsername, setInitialHasUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    city: '',
    country: '',
    profession: '',
    relationship_goal: 'Marriage',
    marriage_timeline: 'Within 1-2 years',
    relocation: 'Open to relocation',
    marital_status: 'Never Married',
    wants_kids: 'Wants children',
    has_kids: 'No',
    living_situation: 'Lives independently',
    religion: 'Christian (Catholic)',
    languages: 'English, Tagalog',
    height: '',
    drinking: 'Socially',
    smoking: 'No',
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
          profession: data.profession || data.occupation || '',
          relationship_goal: data.relationship_goal || data.intent || 'Marriage',
          marriage_timeline: data.marriage_timeline || 'Within 1-2 years',
          relocation: data.relocation || 'Open to relocation',
          marital_status: data.marital_status || 'Never Married',
          wants_kids: data.wants_kids || 'Wants children',
          has_kids: data.has_kids || 'No',
          living_situation: data.living_situation || 'Lives independently',
          religion: data.religion || 'Christian (Catholic)',
          languages: Array.isArray(data.languages) ? data.languages.join(', ') : (data.languages || 'English, Tagalog'),
          height: data.height ? String(data.height) : '',
          drinking: data.drinking || 'Socially',
          smoking: data.smoking || 'No',
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

  
  const handleVerifyLocation = async () => {
    setVerifyingLocation(true);
    setStatusMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in to verify location.');

      const res = await fetch('/api/verify/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await res.json();
      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          text: result.message || result.error || 'Location verification failed.',
        });
      } else {
        setIsLocationVerified(true);
        setStatusMsg({
          type: 'success',
          text: result.message || 'Location verified successfully! Badge awarded.',
        });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Verification failed.' });
    } finally {
      setVerifyingLocation(false);
    }
  };

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
              <h1 className="text-xl font-medium text-[#1C1924] ">Edit Profile</h1>
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
              <h2 className="text-sm font-medium text-[#1C1924] flex items-center gap-2">
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
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#6555B8]/90 text-white text-[9px] font-medium shadow-sm">
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
            <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
              Username
            </label>
            {initialHasUsername ? (
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-[#1C1924] font-medium">{username}</span>
                <button type="button" onClick={() => setShowUpgradeModal(true)} className="text-xs px-2.5 py-1 rounded-lg bg-[#F3EFFC] border border-[#DDD7E5] text-[#6555b8] hover:bg-[#EAE0F5] transition flex items-center gap-1.5 font-medium cursor-pointer" title="Change handle with AIL+"><span>Handle Locked</span><span className="text-[10px] font-bold bg-[#6555b8] text-white px-1.5 py-[2px] rounded-full">AIL+</span></button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A8CC3] font-mono"></span>
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
                  {usernameStatus === 'idle' && 'Claim your unique username.'}
                </p>
              </div>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
              Username
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
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
              <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
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
              <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
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
              <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
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
              <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
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

          {/* Relationship Timeline */}
          <div className="pt-2 border-t border-[#9A8CC3]/20 space-y-3">
            <h3 className="text-xs font-bold text-[#6555b8] uppercase tracking-wider flex items-center gap-1.5">
              Relationship Timeline
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
                  Marriage Timeline
                </label>
                <select
                  value={formData.marriage_timeline}
                  onChange={(e) => setFormData({ ...formData, marriage_timeline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
                >
                  <option value="Within 6 months">Within 6 months</option>
                  <option value="Within 1-2 years">Within 1-2 years</option>
                  <option value="Within 2-3 years">Within 2-3 years</option>
                  <option value="When the time is right">When the time is right</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
                  Relocation Flexibility
                </label>
                <select
                  value={formData.relocation}
                  onChange={(e) => setFormData({ ...formData, relocation: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
                >
                  <option value="Open to relocation">Open to relocation</option>
                  <option value="Willing to relocate internationally">Willing to relocate internationally</option>
                  <option value="Willing to relocate domestically">Willing to relocate domestically</option>
                  <option value="Prefer partner to relocate">Prefer partner to relocate</option>
                  <option value="Not open to relocation">Not open to relocation</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
                  Marital Status
                </label>
                <select
                  value={formData.marital_status}
                  onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
                >
                  <option value="Never Married">Never Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location Verification Status Card */}
          <div className="rounded-2xl border transition-all p-3.5 bg-white shadow-xs">
            {isLocationVerified ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <span>Location Confirmed</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold">GPS Edge</span>
                    </span>
                    <p className="text-[11px] text-[#756D82]">
                      Your connection matches your declared location. Qualifies for the Verified filter.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyLocation}
                  disabled={verifyingLocation}
                  className="text-[11px] font-semibold text-[#6555b8] hover:underline shrink-0"
                >
                  {verifyingLocation ? 'Checking...' : 'Re-verify'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#F3EFFC] text-[#6555b8] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1C1924]">
                      Confirm Your Physical Location
                    </span>
                    <p className="text-[11px] text-[#756D82]">
                      1-click check against your network edge. Awards the Verified badge and +3 Rep.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyLocation}
                  disabled={verifyingLocation}
                  className="px-4 py-2 rounded-xl bg-[#6555B8] hover:bg-[#5242a3] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 shrink-0 shadow-xs"
                >
                  {verifyingLocation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Checking Edge...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify Location</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Family & Values */}
          <div className="pt-2 border-t border-[#9A8CC3]/20 space-y-3">
            <h3 className="text-xs font-bold text-[#E05375] uppercase tracking-wider flex items-center gap-1.5">
              Family & Values
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
                  Desires Children
                </label>
                <select
                  value={formData.wants_kids}
                  onChange={(e) => setFormData({ ...formData, wants_kids: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
                >
                  <option value="Wants children">Wants children</option>
                  <option value="Open to children">Open to children</option>
                  <option value="Does not want children">Does not want children</option>
                  <option value="Not sure yet">Not sure yet</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
                  Has Children
                </label>
                <select
                  value={formData.has_kids}
                  onChange={(e) => setFormData({ ...formData, has_kids: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
                >
                  <option value="No">No</option>
                  <option value="Yes, living with me">Yes, living with me</option>
                  <option value="Yes, not living with me">Yes, not living with me</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
                  Living Situation
                </label>
                <select
                  value={formData.living_situation}
                  onChange={(e) => setFormData({ ...formData, living_situation: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
                >
                  <option value="Lives independently">Lives independently</option>
                  <option value="Lives with family">Lives with family</option>
                  <option value="Lives with roommates">Lives with roommates</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
                  Faith & Beliefs
                </label>
                <input
                  type="text"
                  value={formData.religion}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  placeholder="e.g. Christian (Catholic)"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
                />
              </div>
            </div>
          </div>

          {/* Lifestyle & Background */}
          <div className="pt-2 border-t border-[#9A8CC3]/20 space-y-3">
            <h3 className="text-xs font-bold text-[#6555b8] uppercase tracking-wider flex items-center gap-1.5">
              Lifestyle & Background
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
                  Languages (Comma Separated)
                </label>
                <input
                  type="text"
                  value={formData.languages}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  placeholder="English, Tagalog, Japanese"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
                  Height
                </label>
                <input
                  type="text"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="e.g. 165 cm or 5'5"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
                  Drinks
                </label>
                <select
                  value={formData.drinking}
                  onChange={(e) => setFormData({ ...formData, drinking: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
                >
                  <option value="Never">Never</option>
                  <option value="Socially">Socially</option>
                  <option value="Regularly">Regularly</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
                  Smokes
                </label>
                <select
                  value={formData.smoking}
                  onChange={(e) => setFormData({ ...formData, smoking: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/35 text-[#1C1924] text-sm focus:outline-none focus:border-[#9A8CC3]"
                >
                  <option value="No">No</option>
                  <option value="Socially">Socially</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-[#9A8CC3]">
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
            className="w-full py-3.5 rounded-2xl bg-[#6555B8] hover:bg-[#7D4B9F] text-white font-medium text-sm shadow-lg shadow-[#6555B8]/40 transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Profile'}</span>
          </button>
        </form>
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} triggerContext='handle' />
    </div>
  );
}

