'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, ShieldCheck, MapPin, Briefcase, ChevronLeft, ChevronRight,
  Heart, Languages, Globe, Send, MessageCircle,
  Bookmark, User, Sparkles, HeartHandshake, Baby, Ruler, Wine, Cigarette
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';


export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let query = supabase.from('profiles').select('*');

        if (isUuid) {
          query = query.eq('id', id);
        } else {
          query = query.ilike('username', id);
        }

        const { data, error } = await query.maybeSingle();
        if (error) throw error;

        if (data) {
          let calculatedAge = data.age;
          if (!calculatedAge && (data.birthdate || data.date_of_birth)) {
            const dob = new Date(data.birthdate || data.date_of_birth);
            const diffMs = Date.now() - dob.getTime();
            calculatedAge = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
          }

          const rawCountry = data.country || 'Philippines';
          const rawCity = data.city || '';
          const locationDisplay = rawCity ? (rawCity + ', ' + rawCountry) : (data.location || rawCountry);

          setProfile({
            ...data,
            name: data.display_name || data.full_name || (data.username ? data.username.replace(/^@/, '') : 'Member'),
            handle: data.username ? data.username.replace(/^@/, '') : null,
            age: calculatedAge || null,
            locationDisplay,
            avatar_url: data.avatar_url || '/placeholder-avatar.svg',
            photos: Array.isArray(data.photos) && data.photos.length > 0
              ? data.photos
              : [data.avatar_url || '/placeholder-avatar.svg'],
            rep_score: data.reputation_score || 98,
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: profile.id,
        content: message.trim(),
      });

      if (error) throw error;
      setSentSuccess(true);
      setMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FA] flex items-center justify-center p-6">

        <div className="w-8 h-8 rounded-full border-2 border-[#6555b8] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8F7FA] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-xl font-medium text-[#1C1924]">Profile Not Found</h2>
        <p className="text-sm text-[#756D82]">This member may have deactivated their account or updated their handle.</p>
        <Link
          href="/discover"
          className="px-5 py-2.5 rounded-full bg-[#6555b8] text-white text-sm font-semibold hover:bg-[#52449e] transition shadow-xs"
        >
          Return to Discover
        </Link>
      </div>
    );
  }

  const photoList = profile.photos || [profile.avatar_url];
  const currentImg = photoList[currentPhotoIdx] || profile.avatar_url;
  const hasMultiple = photoList.length > 1;

  const parseCmHeight = (val: any) => {
    if (!val) return 'Not specified';
    const match = String(val).match(/(\d{2,3})\s*cm/i);
    if (match) return `${match[1]} cm`;
    const numOnly = String(val).match(/^\d{2,3}$/);
    if (numOnly) return `${numOnly[0]} cm`;
    return String(val).replace(/[()]/g, '').trim();
  };
  const formattedHeight = parseCmHeight(profile.height);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FA] text-[#1C1924]">
      <main className="flex-1 w-full px-4 pt-4 pb-28 space-y-4">
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#524B5E] hover:text-[#1C1924] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-x-0.5 active:scale-90 select-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Discover</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFC] border border-[#DDD7E5] text-xs font-medium text-[#6555B8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6555B8]" />
            <span>{profile.rep_score}% Reputation</span>
          </div>
        </div>

        {/* Hero Card: Photo + Identity + Direct Actions */}
        <div className="bg-white rounded-3xl border border-[#DDD7E5] shadow-xs overflow-hidden">
          {/* Main Photo Frame */}
          <div className="relative aspect-[4/5] w-full bg-[#181926] select-none group overflow-hidden">
            {photoList && photoList.length > 0 ? (
              <div 
                className="flex h-full w-full transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
                style={{ transform: `translateX(-${currentPhotoIdx * 100}%)` }}
              >
                {photoList.map((photo: string, idx: number) => (
                  <div key={idx} className="w-full h-full shrink-0 relative">
                    <img
                      src={photo}
                      alt={`${profile.name} - ${idx + 1}`}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-[#756D82] h-full">
                <User className="w-12 h-12 stroke-[1.5] text-[#6555b8]" />
                <span className="text-xs">No photo available</span>
              </div>
            )}

            {/* Instagram / Story Tap Targets & Progress Bars */}
            {hasMultiple && (
              <>
                <div className="absolute top-2.5 inset-x-3 flex items-center gap-1 z-20 pointer-events-none">
                  {photoList.map((_: any, idx: number) => (
                    <div
                      key={idx}
                      className={'h-1 flex-1 rounded-full transition-all duration-300 ' + (
                        idx === currentPhotoIdx
                          ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                          : 'bg-white/40 backdrop-blur-xs'
                      )}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIdx((prev) => (prev > 0 ? prev - 1 : photoList.length - 1));
                  }}
                  className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIdx((prev) => (prev < photoList.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer focus:outline-none"
                />
              </>
            )}

            {/* Online Status Badge */}
            <span className="presence-dot h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white/90 shadow" />
          </div>

          {/* Profile Name & Primary Quick Details */}
          <div className="p-4 space-y-3 font-sans">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-lg font-medium text-[#1C1924]">
                  {profile.username || "Member"}{profile.age ? (', ' + profile.age) : ''}
                </h1>
                
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <p className="text-xs font-normal text-neutral-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#6555B8]" />
                  <span>{profile.locationDisplay}</span>
                </p>
                {profile.location_source === 'gps_verified' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F3EFFC] border border-[#6555B8]/20 text-[10px] font-medium text-[#6555B8]">
                    <ShieldCheck className="w-3 h-3 text-[#6555B8]" />
                    GPS Verified
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons: Like & Save */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#F0EDF5]">
              <button
                type="button"
                onClick={() => setIsLiked(!isLiked)}
                className={`flex-1 py-2.5 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90 select-none cursor-pointer shadow-sm ${
                  isLiked
                    ? 'bg-[#6555b8] border-[#6555b8] text-white'
                    : 'bg-white border-[#DDD7E5] text-[#1C1924] hover:bg-[#FAF8FD]'
                }`}
              >
                <Heart className={`w-4 h-4 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${isLiked ? 'fill-white text-white scale-110' : 'text-[#6555b8] active:scale-75'}`} />
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSaved(!isSaved)}
                className={`flex-1 py-2.5 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90 select-none cursor-pointer shadow-sm ${
                  isSaved
                    ? 'bg-[#6555b8] border-[#6555b8] text-white'
                    : 'bg-white border-[#DDD7E5] text-[#1C1924] hover:bg-[#FAF8FD]'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white text-white' : 'text-[#6555b8]'}`} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Message Composer Card */}
        <div className="p-4 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1C1924] flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-[#6555b8]" />
              Send {profile.name} a Message
            </span>
            <span className="text-[10px] font-medium text-[#756D82]">Direct Delivery</span>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-2.5">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder={`Hi ${profile.username || "Member"}, I noticed your profile and would love to introduce myself...`}
              className="w-full text-xs p-3 rounded-2xl border border-[#DDD7E5] bg-[#FAF8FD] focus:bg-white focus:border-[#6555b8] focus:outline-none transition resize-none placeholder:text-[#8C849B]"
            />

            <div className="flex items-center justify-between">
              {sentSuccess ? (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Sent successfully!
                </span>
              ) : (
                <span className="text-[11px] text-[#756D82]">Polite intros build trust</span>
              )}

              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="px-4 py-2 rounded-full bg-[#6555b8] hover:bg-[#52449e] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 select-none cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* About Me Card */}
        <div className="p-4 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-1.5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-[#756D82]">About Me</h2>
          <p className="text-xs sm:text-sm text-[#1C1924] leading-relaxed">
            {profile.bio || 'No bio provided yet.'}
          </p>
        </div>

        {/* Looking For Card */}
        <div className="p-4 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-1.5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-[#756D82]">What I'm Looking For</h2>
          <p className="text-xs sm:text-sm text-[#1C1924] leading-relaxed">
            {profile.looking_for || 'Long-Term Relationship'}
          </p>
        </div>

        {/* Vitals & Lifestyle Card */}
          <div className="p-5 rounded-3xl bg-white border border-[#DDD7E5]/70 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold text-[#6555B8] uppercase tracking-wider">
              Vitals & Lifestyle
            </h2>

            <div className="space-y-0 text-xs divide-y divide-[#F0ECF5]">
              {profile.intent && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="font-medium text-[#756D82]">Relationship Intent</span>
                  <span className="font-semibold text-[#1C1924] text-right">{profile.intent}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-2.5">
                <span className="font-medium text-[#756D82]">Occupation</span>
                <span className="font-semibold text-[#1C1924] text-right">{profile.occupation || 'Not specified'}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="font-medium text-[#756D82]">Marital Status</span>
                <span className="font-semibold text-[#1C1924] text-right">{profile.marital_status || 'Never Married'}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="font-medium text-[#756D82]">Height</span>
                <span className="font-semibold text-[#1C1924] text-right">
                  {formattedHeight && formattedHeight !== 'Not specified' ? formattedHeight : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="font-medium text-[#756D82]">Beliefs</span>
                <span className="font-semibold text-[#1C1924] text-right">{profile.religion || 'None'}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="font-medium text-[#756D82]">Relocation</span>
                <span className="font-semibold text-[#1C1924] text-right">{profile.relocation || 'Open'}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="font-medium text-[#756D82]">Drinks</span>
                <span className="font-semibold text-[#1C1924] text-right">{profile.drinking || 'Socially'}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="font-medium text-[#756D82]">Smokes</span>
                <span className="font-semibold text-[#1C1924] text-right">{profile.smoking || 'No'}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="font-medium text-[#756D82]">Has Children</span>
                <span className="font-semibold text-[#1C1924] text-right">{profile.has_kids || 'No'}</span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="font-medium text-[#756D82]">Wants Children</span>
                <span className="font-semibold text-[#1C1924] text-right">{profile.wants_kids || 'Yes'}</span>
              </div>
            </div>
          </div>

          {/* Languages Spoken Card */}
          <div className="p-5 rounded-3xl bg-white border border-[#DDD7E5]/70 shadow-sm space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6555B8] uppercase tracking-wider">
              <Languages className="w-3.5 h-3.5" />
              <span>Languages Spoken</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {(profile.languages || 'English')
                .split(',')
                .map((lang: string) => lang.trim())
                .filter(Boolean)
                .map((lang: string) => (
                  <span
                    key={lang}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FAF8FD] border border-[#DDD7E5] text-xs font-semibold text-[#1C1924]"
                  >
                    {lang}
                  </span>
                ))}
            </div>
          </div>
      </main>
    </div>
  );
}

