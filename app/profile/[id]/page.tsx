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
import { Footer } from '@/components/Footer';

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
          setProfile({
            ...data,
            name: data.username || data.display_name || 'Member',
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

      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: profile.id,
        content: message.trim(),
      });

      setSentSuccess(true);
      setMessage('');
      setTimeout(() => setSentSuccess(false), 3000);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FA] flex items-center justify-center text-[#756D82] text-sm">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8F7FA] flex flex-col items-center justify-center text-center p-6 space-y-4 text-[#1C1924]">
        <p className="text-base font-bold">Profile not found.</p>
        <Link href="/discover" className="text-sm font-semibold text-[#6555b8] hover:underline">
          Return to Discover
        </Link>
      </div>
    );
  }

  const photoList: string[] = Array.isArray(profile.photos) && profile.photos.length > 0
    ? profile.photos
    : [profile.avatar_url];
  const currentImg = photoList[currentPhotoIdx] || photoList[0];
  const hasMultiple = photoList.length > 1;

    const parseCmHeight = (val: string | undefined | null) => {
    if (!val) return 'Not specified';
    const match = val.match(/(\d{2,3})\s*cm/i);
    if (match) return `${match[1]} cm`;
    const numOnly = val.match(/^\d{2,3}$/);
    if (numOnly) return `${numOnly[0]} cm`;
    return val.replace(/[()]/g, '').trim();
  };
  const formattedHeight = parseCmHeight(profile.height);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FA] text-[#1C1924]">
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 pb-32">
        <div className="flex items-center justify-between">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#524B5E] hover:text-[#1C1924] transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Discover</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFC] border border-[#DDD7E5] text-xs font-semibold text-[#6555B8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6555B8]" />
            <span>{profile.rep_score}% Reputation</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-5 bg-white rounded-3xl border border-[#DDD7E5] shadow-xs p-4 sm:p-5 space-y-4">
            <div className="pb-3 border-b border-[#DDD7E5] space-y-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1C1924] tracking-tight">
                  {profile.name}{profile.age ? `, ${profile.age}` : ''}
                </h1>
                
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs sm:text-sm font-medium text-[#524B5E] flex items-center gap-1.5">
                  <MapPin className={`w-3.5 h-3.5 ${'text-[#6555B8]'}`} />
                  <span>{profile.location || 'Southeast Asia'}</span>
                </p>
                {profile.location_source === 'gps_verified' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F3EFFC] border border-[#DDD7E5] text-[10px] font-semibold text-[#6555B8]">
                    <ShieldCheck className="w-3 h-3 text-[#6555B8]" />
                    GPS Verified
                  </span>
                )}
              </div>
            </div>

            <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#FAF8FD] border border-[#DDD7E5] flex items-center justify-center select-none group">
              {currentImg ? (
                <img
                  src={currentImg}
                  alt={profile.name}
                  className="w-full h-full object-cover transition-opacity duration-200"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2.5 text-[#756D82] p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#F3EFFC] flex items-center justify-center text-[#6555b8]">
                    <User className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <span className="text-xs">No photo available</span>
                </div>
              )}

              {hasMultiple && (
                <div className="absolute top-2.5 left-3 right-3 flex items-center gap-1.5 z-20 pointer-events-none">
                  {photoList.map((_, idx) => (
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
              )}

              {hasMultiple && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhotoIdx((prev) => (prev > 0 ? prev - 1 : photoList.length - 1));
                    }}
                    className="absolute inset-y-0 left-0 w-1/2 z-10 cursor-pointer focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhotoIdx((prev) => (prev < photoList.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute inset-y-0 right-0 w-1/2 z-10 cursor-pointer focus:outline-none"
                  />

                  <div className="hidden sm:flex items-center justify-between absolute inset-x-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      aria-label="Previous photo button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIdx((prev) => (prev > 0 ? prev - 1 : photoList.length - 1));
                      }}
                      className="pointer-events-auto p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition shadow"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next photo button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIdx((prev) => (prev < photoList.length - 1 ? prev + 1 : 0));
                      }}
                      className="pointer-events-auto p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition shadow"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              <div className={'absolute left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-semibold text-[#1C1924] border border-[#E5E1EC] z-20 pointer-events-none ' + (
                hasMultiple ? 'top-6' : 'top-3'
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsLiked(!isLiked)}
                className={`flex-1 py-2.5 rounded-full border text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs ${
                  isLiked
                    ? 'bg-[#6555b8] border-[#6555b8] text-white shadow-xs'
                    : 'bg-white border-[#DDD7E5] text-[#1C1924] hover:bg-[#FAF8FD] hover:border-[#6555b8]'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-white text-white' : 'text-[#6555b8]'}`} />
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSaved(!isSaved)}
                className={`flex-1 py-2.5 rounded-full border text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs ${
                  isSaved
                    ? 'bg-[#6555b8] border-[#6555b8] text-white shadow-xs'
                    : 'bg-white border-[#DDD7E5] text-[#1C1924] hover:bg-[#FAF8FD] hover:border-[#6555b8]'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white text-white' : 'text-[#6555b8]'}`} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-7 space-y-4">
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-[#1C1924] flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#6555b8]" />
                  Send {profile.name} a Message
                </span>
                <span className="text-[11px] font-medium text-[#756D82]">Direct Delivery</span>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-3 pt-1">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder={`Hi ${profile.name}, I noticed your profile and would love to introduce myself...`}
                  className="w-full p-3.5 rounded-2xl bg-white border border-[#DDD7E5] text-[#1C1924] placeholder-[#8C849B] text-xs sm:text-sm focus:outline-none focus:border-[#6555b8] focus:ring-2 focus:ring-[#6555b8]/15 transition shadow-xs resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="px-6 py-2.5 rounded-full bg-[#6555b8] hover:bg-[#52449e] disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-xs active:scale-95 transition flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                    <span>{sending ? 'Sending...' : sentSuccess ? 'Message Sent!' : 'Send Message'}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-[#756D82] uppercase tracking-wider">About Me</h3>
              <p className="text-xs sm:text-sm text-[#1C1924] leading-relaxed font-normal whitespace-pre-line">
                {profile.bio || 'No bio provided yet.'}
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-[#756D82] uppercase tracking-wider">What I&apos;m Looking For</h3>
              <p className="text-xs sm:text-sm text-[#1C1924] leading-relaxed font-normal whitespace-pre-line">
                {profile.looking_for || 'Seeking an intentional, marriage-minded partner.'}
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-[#756D82] uppercase tracking-wider">Courtship Vitals</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#FAF8FD] border border-[#DDD7E5]">
                  <Briefcase className="w-4 h-4 text-[#6555b8] shrink-0" />
                  <span className="text-[#756D82]">Profession:</span>
                  <span className="font-semibold text-[#1C1924] truncate">{profile.occupation || 'Professional'}</span>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#FAF8FD] border border-[#DDD7E5]">
                  <Heart className="w-4 h-4 text-[#6555b8] shrink-0" />
                  <span className="text-[#756D82]">Intent:</span>
                  <span className="font-semibold text-[#1C1924] truncate">{profile.relationship_intent || profile.intentions || profile.intent || 'Marriage'}</span>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#FAF8FD] border border-[#DDD7E5]">
                  <Sparkles className="w-4 h-4 text-[#6555b8] shrink-0" />
                  <span className="text-[#756D82]">Faith:</span>
                  <span className="font-semibold text-[#1C1924] truncate">{profile.religion || 'Christian'}</span>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#FAF8FD] border border-[#DDD7E5]">
                  <Globe className="w-4 h-4 text-[#6555b8] shrink-0" />
                  <span className="text-[#756D82]">Relocation:</span>
                  <span className="font-semibold text-[#1C1924] truncate">{profile.relocation || 'Open'}</span>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#FAF8FD] border border-[#DDD7E5]">
                  <HeartHandshake className="w-4 h-4 text-[#6555b8] shrink-0" />
                  <span className="text-[#756D82]">Status:</span>
                  <span className="font-semibold text-[#1C1924] truncate">{profile.marital_status || 'Never Married'}</span>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#FAF8FD] border border-[#DDD7E5]">
                  <Baby className="w-4 h-4 text-[#6555b8] shrink-0" />
                  <span className="text-[#756D82]">Has Kids:</span>
                  <span className="font-semibold text-[#1C1924] truncate">{profile.has_kids || 'No'}</span>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#FAF8FD] border border-[#DDD7E5]">
                  <Baby className="w-4 h-4 text-[#6555b8] shrink-0" />
                  <span className="text-[#756D82]">Wants Kids:</span>
                  <span className="font-semibold text-[#1C1924] truncate">{profile.wants_kids || 'Yes'}</span>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#FAF8FD] border border-[#DDD7E5]">
                  <Languages className="w-4 h-4 text-[#6555b8] shrink-0" />
                  <span className="text-[#756D82]">Languages:</span>
                  <span className="font-semibold text-[#1C1924] truncate">{profile.languages || 'English'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#DDD7E5] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8FD] border border-[#DDD7E5] whitespace-nowrap min-w-0">
                  <Ruler className="w-3.5 h-3.5 text-[#6555b8] shrink-0" />
                  <span className="text-[#756D82] shrink-0">Height:</span>
                  <span className="font-semibold text-[#1C1924] truncate">{formattedHeight}</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8FD] border border-[#DDD7E5] whitespace-nowrap min-w-0">
                  <Wine className="w-3.5 h-3.5 text-[#6555b8] shrink-0" />
                  <span className="text-[#756D82] shrink-0">Drinks:</span>
                  <span className="font-semibold text-[#1C1924] truncate">{profile.drinking || 'Socially'}</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8FD] border border-[#DDD7E5] whitespace-nowrap min-w-0">
                  <Cigarette className="w-3.5 h-3.5 text-[#6555b8] shrink-0" />
                  <span className="text-[#756D82] shrink-0">Smokes:</span>
                  <span className="font-semibold text-[#1C1924] truncate">{profile.smoking || 'No'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
