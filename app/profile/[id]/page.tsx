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
            name: data.display_name || data.full_name || data.username || 'Member',
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
    if (!profile?.id) return;
    router.push(`/chat/${profile.id}`);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FA] flex items-center justify-center text-[#1C1924] text-sm">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8F7FA] flex flex-col items-center justify-center text-center p-6 space-y-4 text-[#1C1924]">
        <p className="text-sm">Profile not found.</p>
        <Link href="/discover" className="text-sm font-bold text-[#9A8CC3] hover:text-[#1C1924] transition">
          Return to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FA] text-[#1C1924]">
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-7 space-y-5 pb-28 md:pb-12">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1C1924] hover:text-[#1C1924] transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#9A8CC3]" />
            <span>Back to Discover</span>
          </Link>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Masthead with Framed Photo */}
          <div className="md:col-span-5 rounded-3xl bg-[#FFFFFF] border border-[#9A8CC3]/45 shadow-xl shadow-2xl p-5 sm:p-6 space-y-4">
            
            {/* Header Up Top */}
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#9A8CC3]/20">
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-2xl font-bold text-[#1C1924] tracking-tight">
                    {profile.name}, {profile.age}
                  </h1>
                  <span className="text-sm font-bold text-[#9A8CC3]">
                    @{profile.username || 'member'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#1C1924] flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-[#9A8CC3]" />
                  <span>{profile.location || 'Southeast Asia'}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F7FA] border border-[#9A8CC3]/45 text-xs font-bold text-[#1C1924] shrink-0 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#9A8CC3]" />
                <span>{profile.rep_score || 100}% Rep</span>
              </div>
            </div>

            {/* Framed Photo Container */}
            {(() => {
              const photoList: string[] = Array.isArray(profile.photos) && profile.photos.length > 0
                ? profile.photos.filter(Boolean)
                : (profile.avatar_url ? [profile.avatar_url] : []);
              const currentImg = photoList[currentPhotoIdx] || profile.avatar_url;
              const hasMultiple = photoList.length > 1;

              return (
                <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#FFFFFF] to-[#F8F7FA] border border-[#9A8CC3]/20 flex items-center justify-center select-none group">
                  {currentImg ? (
                    <img
                      src={currentImg}
                      alt={profile.name}
                      className="w-full h-full object-cover transition-opacity duration-200"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2.5 text-[#9A8CC3]/70 p-6 text-center">
                      <div className="w-20 h-20 rounded-3xl bg-[#F8F7FA] border border-[#9A8CC3]/45 flex items-center justify-center shadow-inner">
                        <User className="w-10 h-10 stroke-[1.5] text-[#9A8CC3]" />
                      </div>
                    </div>
                  )}

                  {/* Story Dashes */}
                  {hasMultiple && (
                    <div className="absolute top-2.5 left-3 right-3 flex items-center gap-1.5 z-20 pointer-events-none">
                      {photoList.map((_, idx) => (
                        <div
                          key={idx}
                          className={'h-1 flex-1 rounded-full transition-all duration-300 ' + (
                            idx === currentPhotoIdx
                              ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]'
                              : 'bg-white/30 backdrop-blur-sm'
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {/* Touch / Click zones for cycling photos */}
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

                      {/* Desktop Hover Chevrons */}
                      <div className="hidden sm:flex items-center justify-between absolute inset-x-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          aria-label="Previous photo button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPhotoIdx((prev) => (prev > 0 ? prev - 1 : photoList.length - 1));
                          }}
                          className="pointer-events-auto p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-[#1C1924] backdrop-blur-sm transition shadow"
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
                          className="pointer-events-auto p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-[#1C1924] backdrop-blur-sm transition shadow"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Online Badge */}
                  <div className={'absolute left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-semibold text-emerald-400 border border-emerald-500/30 z-20 pointer-events-none ' + (
                    hasMultiple ? 'top-6' : 'top-3'
                  )}>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online</span>
                  </div>
                </div>
              );
            })()}

            {/* Quick Actions at Base */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsLiked(!isLiked)}
                className={`flex-1 py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition active:scale-95 shadow-sm ${
                  isLiked 
                    ? 'bg-[#6555B8] border-[#9A8CC3] text-white shadow-[#6555B8]/40' 
                    : 'bg-[#F8F7FA] border-[#9A8CC3]/30 text-white hover:text-[#1C1924] hover:border-[#9A8CC3] hover:bg-[#6555B8]/20'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-white text-white' : 'text-[#9A8CC3]'}`} />
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSaved(!isSaved)}
                className={`flex-1 py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition active:scale-95 shadow-sm ${
                  isSaved 
                    ? 'bg-[#6555B8] border-[#9A8CC3] text-white shadow-[#6555B8]/40' 
                    : 'bg-[#F8F7FA] border-[#9A8CC3]/30 text-white hover:text-[#1C1924] hover:border-[#9A8CC3] hover:bg-[#6555B8]/20'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white text-white' : 'text-[#9A8CC3]'}`} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>

          </div>

          {/* Right Column */}
          <div className="md:col-span-7 space-y-5">
            
            {/* Direct Message Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] border border-[#9A8CC3]/45 shadow-xl shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#1C1924] uppercase tracking-wider flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#9A8CC3]" />
                  Send {profile.name} a Message
                </span>
                <span className="text-xs font-semibold text-[#1C1924]">Direct Delivery</span>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-3 pt-1">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder={`Hi ${profile.name}, I read your profile and wanted to say hello...`}
                  className="w-full p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#9A8CC3]/50 text-[#FFFFFF] placeholder-[#756D82]/70 placeholder-[#B2A4D7] focus:outline-none focus:border-[#9A8CC3] focus:ring-1 focus:ring-[#9A8CC3] transition"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="px-6 py-2.5 rounded-xl bg-[#6555B8] hover:bg-[#7D4B9F] text-white font-bold text-sm shadow-lg shadow-[#6555B8]/50 active:scale-95 transition flex items-center gap-2"
                  >
                    <Send className="w-4 h-4 text-[#1C1924]" />
                    <span>{sending ? 'Sending...' : sentSuccess ? 'Message Sent!' : 'Send Message'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* ABOUT ME */}
            <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#9A8CC3]/45 shadow-xl shadow-2xl space-y-2.5">
              <h3 className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider">ABOUT ME</h3>
              <p className="text-sm text-[#1C1924] leading-relaxed font-medium">
                {profile.bio || 'No bio provided yet.'}
              </p>
            </div>

            {/* WHAT I'M LOOKING FOR */}
            <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#9A8CC3]/45 shadow-xl shadow-2xl space-y-2.5">
              <h3 className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider">WHAT I'M LOOKING FOR</h3>
              <p className="text-sm text-[#1C1924] leading-relaxed font-medium">
                {profile.looking_for || 'Seeking an intentional, marriage-minded partner.'}
              </p>
            </div>

            {/* CLEAN BORDERLESS VITALS */}
            <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#9A8CC3]/45 shadow-xl shadow-2xl space-y-4">
              <h3 className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider">VITALS</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                
                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-[#9A8CC3]" />
                  </div>
                  <span className="text-[#9A8CC3] font-medium w-28 shrink-0">Profession</span>
                  <span className="font-medium text-[#1C1924] text-xs">{profile.occupation || 'Customer Support Lead'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4 text-[#9A8CC3]" />
                  </div>
                  <span className="text-[#9A8CC3] font-medium w-28 shrink-0">Intent</span>
                  <span className="font-medium text-[#1C1924] text-xs">{profile.intentions || 'Marriage & Kids'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[#9A8CC3]" />
                  </div>
                  <span className="text-[#9A8CC3] font-medium w-28 shrink-0">Religion</span>
                  <span className="font-medium text-[#1C1924] text-xs">{profile.religion || 'Catholic'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-[#9A8CC3]" />
                  </div>
                  <span className="text-[#9A8CC3] font-medium w-28 shrink-0">Relocation</span>
                  <span className="font-medium text-[#1C1924] text-xs">{profile.relocation || 'Can Relocate'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <HeartHandshake className="w-4 h-4 text-[#9A8CC3]" />
                  </div>
                  <span className="text-[#9A8CC3] font-medium w-28 shrink-0">Status</span>
                  <span className="font-medium text-[#1C1924] text-xs">{profile.marital_status || 'Never Married'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Baby className="w-4 h-4 text-[#9A8CC3]" />
                  </div>
                  <span className="text-[#9A8CC3] font-medium w-28 shrink-0">Has Kids?</span>
                  <span className="font-medium text-[#1C1924] text-xs">{profile.has_kids || 'No'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Baby className="w-4 h-4 text-[#9A8CC3]" />
                  </div>
                  <span className="text-[#9A8CC3] font-medium w-28 shrink-0">Wants Kids?</span>
                  <span className="font-medium text-[#1C1924] text-xs">{profile.wants_kids || 'Yes'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Languages className="w-4 h-4 text-[#9A8CC3]" />
                  </div>
                  <span className="text-[#9A8CC3] font-medium w-28 shrink-0">Languages</span>
                  <span className="font-medium text-[#1C1924] text-xs">{profile.languages || 'English, Tagalog'}</span>
                </div>

              </div>

              {/* Lifestyle Line */}
              <div className="pt-4 border-t border-[#9A8CC3]/20">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Ruler className="w-4 h-4 text-[#9A8CC3] shrink-0" />
                    <span className="text-[#9A8CC3] font-medium w-16 shrink-0">Height:</span>
                    <span className="font-medium text-[#1C1924] text-xs">{profile.height || `5'3" (160 cm)`}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Wine className="w-4 h-4 text-[#9A8CC3] shrink-0" />
                    <span className="text-[#9A8CC3] font-medium w-16 shrink-0">Drinks:</span>
                    <span className="font-medium text-[#1C1924] text-xs">{profile.drinking || 'Socially'}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Cigarette className="w-4 h-4 text-[#9A8CC3] shrink-0" />
                    <span className="text-[#9A8CC3] font-medium w-16 shrink-0">Smokes:</span>
                    <span className="font-medium text-[#1C1924] text-xs">{profile.smoking || 'No'}</span>
                  </div>
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