'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, ShieldCheck, MapPin, Briefcase, 
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

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      if (id.startsWith('dummy-')) {
        const dummyProfiles: Record<string, any> = {
          'dummy-1': {
            name: 'Camille',
            username: 'camille',
            age: 26,
            location: 'Makati, Philippines',
            bio: 'Working in corporate Makati on weekdays, spending time with church and cooking adobo for my nieces on weekends. Not here for games or flings—seeking a God fearing, mature gentleman ready for something real.',
            looking_for: 'A sincere, patient, and grounded partner who values family, communicates openly, and is ready for an intentional cross-border commitment.',
            occupation: 'Customer Support Lead',
            intentions: 'Marriage & Kids',
            religion: 'Catholic',
            marital_status: 'Never Married',
            has_kids: 'No',
            wants_kids: 'Yes',
            relocation: 'Can Relocate',
            languages: 'English, Tagalog',
            height: `5'3" (160 cm)`,
            drinking: 'Socially',
            smoking: 'No',
            avatar_url: '/dummy-1.jpg',
            rep_score: 100,
            online: true
          }
        };

        setProfile(dummyProfiles[id] || dummyProfiles['dummy-1']);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setProfile(data);
      }
      setLoading(false);
    }

    loadData();
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSentSuccess(true);
      setMessage('');
      setTimeout(() => setSentSuccess(false), 3000);
    }, 600);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#130F18] flex items-center justify-center text-[#E6D7FA] text-sm">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#130F18] flex flex-col items-center justify-center text-center p-6 space-y-4 text-[#E6D7FA]">
        <p className="text-sm">Profile not found.</p>
        <Link href="/discover" className="text-sm font-semibold text-[#9A79BA] hover:text-white transition">
          Return to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#130F18] text-[#E6D7FA]">
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-7 space-y-5 pb-28 md:pb-12">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E6D7FA] hover:text-white transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#9A79BA]" />
            <span>Back to Discover</span>
          </Link>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Masthead with Framed Photo */}
          <div className="md:col-span-5 rounded-3xl bg-[#1D1726] border border-[#9A79BA]/30 shadow-2xl p-5 sm:p-6 space-y-4">
            
            {/* Header Up Top */}
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#9A79BA]/20">
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {profile.name}, {profile.age}
                  </h1>
                  <span className="text-sm font-semibold text-[#9A79BA]">
                    @{profile.username || 'member'}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#E6D7FA] flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-[#9A79BA]" />
                  <span>{profile.location || 'Southeast Asia'}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#130F18] border border-[#9A79BA]/40 text-xs font-bold text-white shrink-0 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#9A79BA]" />
                <span>{profile.rep_score || 100}% Rep</span>
              </div>
            </div>

            {/* Framed Photo Container */}
            <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#241E2F] to-[#130F18] border border-[#9A79BA]/20 flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2.5 text-[#9A79BA]/70 p-6 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-[#130F18] border border-[#9A79BA]/30 flex items-center justify-center shadow-inner">
                    <User className="w-10 h-10 stroke-[1.5] text-[#9A79BA]" />
                  </div>
                </div>
              )}

              {/* Online Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online</span>
              </div>
            </div>

            {/* Quick Actions at Base */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsLiked(!isLiked)}
                className={`flex-1 py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition active:scale-95 shadow-sm ${
                  isLiked 
                    ? 'bg-[#653C87] border-[#9A79BA] text-white shadow-[#653C87]/40' 
                    : 'bg-[#130F18] border-[#9A79BA]/30 text-[#E6D7FA] hover:text-white hover:border-[#9A79BA] hover:bg-[#653C87]/20'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-white text-white' : 'text-[#9A79BA]'}`} />
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSaved(!isSaved)}
                className={`flex-1 py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition active:scale-95 shadow-sm ${
                  isSaved 
                    ? 'bg-[#653C87] border-[#9A79BA] text-white shadow-[#653C87]/40' 
                    : 'bg-[#130F18] border-[#9A79BA]/30 text-[#E6D7FA] hover:text-white hover:border-[#9A79BA] hover:bg-[#653C87]/20'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white text-white' : 'text-[#9A79BA]'}`} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>

          </div>

          {/* Right Column */}
          <div className="md:col-span-7 space-y-5">
            
            {/* Direct Message Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#1D1726] border border-[#9A79BA]/30 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#9A79BA]" />
                  Send {profile.name} a Message
                </span>
                <span className="text-xs font-medium text-[#A8A2AB]">Direct Delivery</span>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-3 pt-1">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder={`Hi ${profile.name}, I read your profile and wanted to say hello...`}
                  className="w-full p-3.5 rounded-2xl bg-[#130F18] border border-[#9A79BA]/30 text-sm text-white placeholder-[#A8A2AB] focus:outline-none focus:border-[#9A79BA] focus:ring-1 focus:ring-[#9A79BA] transition"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="px-6 py-2.5 rounded-xl bg-[#653C87] hover:bg-[#7D49A8] disabled:opacity-40 text-sm font-bold text-white flex items-center gap-2 transition active:scale-95 shadow-md shadow-[#653C87]/30"
                  >
                    <Send className="w-4 h-4 text-white" />
                    <span>{sending ? 'Sending...' : sentSuccess ? 'Message Sent!' : 'Send Message'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* ABOUT ME */}
            <div className="p-6 rounded-3xl bg-[#1D1726] border border-[#9A79BA]/30 shadow-2xl space-y-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">ABOUT ME</h3>
              <p className="text-sm text-[#E6D7FA] leading-relaxed font-normal">
                {profile.bio || 'No bio provided yet.'}
              </p>
            </div>

            {/* WHAT I'M LOOKING FOR */}
            <div className="p-6 rounded-3xl bg-[#1D1726] border border-[#9A79BA]/30 shadow-2xl space-y-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">WHAT I'M LOOKING FOR</h3>
              <p className="text-sm text-[#E6D7FA] leading-relaxed font-normal">
                {profile.looking_for || 'Seeking an intentional, marriage-minded partner.'}
              </p>
            </div>

            {/* CLEAN BORDERLESS VITALS */}
            <div className="p-6 rounded-3xl bg-[#1D1726] border border-[#9A79BA]/30 shadow-2xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">VITALS</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                
                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-[#9A79BA]" />
                  </div>
                  <span className="text-[#A8A2AB] font-medium w-28 shrink-0">Profession</span>
                  <span className="font-semibold text-white truncate">{profile.occupation || 'Customer Support Lead'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4 text-[#9A79BA]" />
                  </div>
                  <span className="text-[#A8A2AB] font-medium w-28 shrink-0">Intent</span>
                  <span className="font-semibold text-white truncate">{profile.intentions || 'Marriage & Kids'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[#9A79BA]" />
                  </div>
                  <span className="text-[#A8A2AB] font-medium w-28 shrink-0">Religion</span>
                  <span className="font-semibold text-white truncate">{profile.religion || 'Catholic'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-[#9A79BA]" />
                  </div>
                  <span className="text-[#A8A2AB] font-medium w-28 shrink-0">Relocation</span>
                  <span className="font-semibold text-white truncate">{profile.relocation || 'Can Relocate'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <HeartHandshake className="w-4 h-4 text-[#9A79BA]" />
                  </div>
                  <span className="text-[#A8A2AB] font-medium w-28 shrink-0">Status</span>
                  <span className="font-semibold text-white truncate">{profile.marital_status || 'Never Married'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Baby className="w-4 h-4 text-[#9A79BA]" />
                  </div>
                  <span className="text-[#A8A2AB] font-medium w-28 shrink-0">Has Kids?</span>
                  <span className="font-semibold text-white truncate">{profile.has_kids || 'No'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Baby className="w-4 h-4 text-[#9A79BA]" />
                  </div>
                  <span className="text-[#A8A2AB] font-medium w-28 shrink-0">Wants Kids?</span>
                  <span className="font-semibold text-white truncate">{profile.wants_kids || 'Yes'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Languages className="w-4 h-4 text-[#9A79BA]" />
                  </div>
                  <span className="text-[#A8A2AB] font-medium w-28 shrink-0">Languages</span>
                  <span className="font-semibold text-white truncate">{profile.languages || 'English, Tagalog'}</span>
                </div>

              </div>

              {/* Lifestyle Line */}
              <div className="pt-4 border-t border-[#9A79BA]/20">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3.5 gap-x-6 text-sm">
                  <div className="flex items-center gap-2.5">
                    <Ruler className="w-4 h-4 text-[#9A79BA] shrink-0" />
                    <span className="text-[#A8A2AB] font-medium w-16 shrink-0">Height:</span>
                    <span className="font-semibold text-white truncate">{profile.height || `5'3" (160 cm)`}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Wine className="w-4 h-4 text-[#9A79BA] shrink-0" />
                    <span className="text-[#A8A2AB] font-medium w-16 shrink-0">Drinks:</span>
                    <span className="font-semibold text-white truncate">{profile.drinking || 'Socially'}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Cigarette className="w-4 h-4 text-[#9A79BA] shrink-0" />
                    <span className="text-[#A8A2AB] font-medium w-16 shrink-0">Smokes:</span>
                    <span className="font-semibold text-white truncate">{profile.smoking || 'No'}</span>
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