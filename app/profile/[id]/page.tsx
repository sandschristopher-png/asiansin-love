'use client';

import React, { useEffect, useState } from 'react';

import { notifyVisit } from '@/lib/notify';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, MapPin, Briefcase, ChevronLeft, ChevronRight, Heart, Zap, Languages, Globe, Send, MessageCircle, BadgeCheck, User, Sparkles, HeartHandshake, Baby, Ruler, Wine, Cigarette } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import RepScoreCard from '@/components/RepScoreCard';
import { ProfileHighlights } from '@/components/profile/ProfileHighlights';
import { ProfileTopHeader } from '@/components/profile/ProfileTopHeader';
import { ProfileFloatingDock } from '@/components/profile/ProfileFloatingDock';


export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
const [isMessageSheetOpen, setIsMessageSheetOpen] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [isSparked, setIsSparked] = useState(() => {
    try {
      const cached = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('ail_sparked_ids') || '[]') : [];
      return Array.isArray(cached) && cached.includes(String(id));
    } catch { return false; }
  });

  const [sparkBusy, setSparkBusy] = useState(false);

  const toggleSpark = async () => {
    if (sparkBusy || !id) return;
    const targetId = String(id);
    const next = !isSparked;
    setSparkBusy(true);
    setIsSparked(next);
    try {
      const res = await fetch('/api/spark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: targetId }),
      });
      if (!res.ok) throw new Error('Spark request failed');
      const data = await res.json();
      const sparked = !!data.sparked;
      setIsSparked(sparked);
      const key = 'ail_sparked_ids';
      const cached: string[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = sparked ? Array.from(new Set([...cached, targetId])) : cached.filter((x: string) => x !== targetId);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (err) {
      console.error('Spark failed:', err);
      setIsSparked(!next);
    } finally {
      setSparkBusy(false);
    }
  };
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [viewerInterests, setViewerInterests] = useState<string[]>([]);
  const [viewerIntent, setViewerIntent] = useState<string>('');

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
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            if (currentUser.id !== data.id) {
              supabase.from('profile_views').insert({ viewer_id: currentUser.id, viewed_id: data.id }).then(() => {
          if (currentUser.id !== data.id) {
            notifyVisit(supabase, data.id, currentUser.id);
          }
        });
            }
            const { data: myProf } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .maybeSingle();
            if (Array.isArray(myProf?.interests)) setViewerInterests(myProf.interests);
            if (myProf?.relationship_intent) setViewerIntent(myProf.relationship_intent);
          }
          const { data: highlightRows } = await supabase
            .from('user_interests')
            .select('tag_id, highlight_story, interest_tags(label, icon)')
            .eq('user_id', data.id)
            .eq('is_highlight', true)
            .order('created_at', { ascending: true })
            .limit(3);
          data.highlight_rows = highlightRows || [];

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
            name: data.username ? data.username.replace(/^@/, '') : (data.display_name || 'Member'),
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
    setSentSuccess(false);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: profile.id,
          content: message.trim(),
        }),
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Message could not be sent.');
        return;
      }

      setSentSuccess(true);
      setMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
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
        

{/* Hero Card: Photo + Identity + Direct Actions */}
        <div className="bg-white rounded-3xl border border-[#DDD7E5] shadow-xs overflow-hidden">
          {/* Main Photo Frame */}
          <div className="relative aspect-[4/5] w-full bg-[#181926] select-none group overflow-hidden rounded-t-3xl">
            {photoList && photoList.length > 0 ? (
              <div 
                className="flex h-full w-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
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
            <span className="presence-dot absolute top-3 left-3 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white/90 shadow z-20" />

            {/* Bottom gradient scrim */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-14 pointer-events-none">
              <div className="text-white">
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-1.5">
                  {profile.username || "Member"}{profile.age ? (', ' + profile.age) : ''}
                  {profile.is_verified && (
                    <BadgeCheck size={15} strokeWidth={2.5} className="shrink-0 text-emerald-300" />
                  )}
                </h1>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-200">
                  <MapPin size={11} strokeWidth={2.5} className="shrink-0" />
                  <span>{profile.locationDisplay || profile.location || 'Somewhere'}</span>
                </p>
              </div>
            </div>
          </div>

</div>

{isMessageSheetOpen && (
  <div
    className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm"
    onClick={() => setIsMessageSheetOpen(false)}
  >
    <div
      className="w-full max-w-lg p-4 pb-6 rounded-t-3xl bg-white shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
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
              ) : sendError ? (
                <span className="text-xs font-medium text-rose-500 flex items-center gap-1 max-w-[200px] truncate" title={sendError}>
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {sendError}
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
    </div>
  </div>
)}

{/* Reputation Score Card */}
          <RepScoreCard score={profile.rep_score ?? 100} />

          <ProfileHighlights
            highlights={profile.highlight_rows || []}
            viewerInterests={viewerInterests}
            targetUserName={profile.name}
          />

          {/* with-Style "Things in Common" & Interests Card */}
        {(() => {
          const profileTags: string[] = Array.isArray(profile.interests) ? profile.interests : [];
          const sharedTags = profileTags.filter((t) =>
            viewerInterests.some((v) => v.toLowerCase() === t.toLowerCase())
          );
          const sameIntent = Boolean(
            viewerIntent &&
            (profile.relationship_intent || profile.intent) &&
            viewerIntent.toLowerCase() === String(profile.relationship_intent || profile.intent).toLowerCase()
          );
          const totalCommon = sharedTags.length + (sameIntent ? 1 : 0);

          const hasHighlights = Array.isArray(profile.highlight_rows) && profile.highlight_rows.length > 0;
          if (hasHighlights) return null;
          if (profileTags.length === 0 && totalCommon === 0) return null;

          return (
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#DDD7E5] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#F3EFFC] text-[#6555b8] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h2
                      className="text-xs font-bold uppercase tracking-wider text-[#1C1924]"
                      style={{ fontFamily: 'var(--font-brand)' }}
                    >
                      Interests &amp; Things in Common
                    </h2>
                    <p className="text-[11px] text-[#6C637B]">
                      {totalCommon > 0
                        ? `You share ${totalCommon} interest${totalCommon > 1 ? 's' : ''} & values`
                        : 'Hobbies & lifestyle tags'}
                    </p>
                  </div>
                </div>
                {totalCommon > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-[#6555b8] text-white text-[11px] font-bold shadow-2xs">
                    {totalCommon} Shared
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {sameIntent && (
                  <span className="px-3 py-1 rounded-full bg-[#F3EFFC] border border-[#6555b8] text-[#6555b8] text-xs font-bold flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-[#6555b8]" />
                    <span>Both want {profile.relationship_intent || profile.intent}</span>
                  </span>
                )}
                {profileTags.map((tag: string) => {
                  const isShared = sharedTags.includes(tag);
                  return (
                    <span
                      key={tag}
                      className={
                        'px-3 py-1 rounded-full text-xs font-semibold border transition ' +
                        (isShared
                          ? 'bg-[#F3EFFC] border-[#6555b8] text-[#6555b8]'
                          : 'bg-[#F8F7FA] border-[#DDD7E5] text-[#524B5E]')
                      }
                    >
                      {isShared ? '✨ ' + tag : tag}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })()}

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

      <ProfileFloatingDock
        targetUserId={profile.id}
        targetUserName={profile.name}
        isSparked={isSparked}
        sparkBusy={sparkBusy}
        onSpark={toggleSpark}
        onMessage={() => setIsMessageSheetOpen(true)}
      />
    </div>
  );
}