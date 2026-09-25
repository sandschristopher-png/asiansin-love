'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChatInterface, TargetUserProfile, MessageItem } from '@/components/ChatInterface';
import { DUMMY_PROFILES } from '@/lib/dummyProfiles';

// Helper to check valid UUID format
const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default function ChatConversationPage() {
  const router = useRouter();
  const params = useParams();
  const rawParam = (params?.userId as string) || '';

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<TargetUserProfile | null>(null);
  const [initialMessages, setInitialMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initChat() {
      // 1. Get authenticated user session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Must be logged in for real database writes
        router.push('/login');
        return;
      }

      setCurrentUserId(user.id);

      // 2. Resolve target user profile safely without UUID casting errors
      let profileData: any = null;

      if (isUUID(rawParam)) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', rawParam)
          .maybeSingle();
        profileData = data;
      } else {
        // Try finding profile by username/slug
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', rawParam)
          .maybeSingle();
        profileData = data;
      }

      if (profileData) {
        setTargetUser({
          id: profileData.id,
          fullName: profileData.full_name || profileData.username || 'Member',
          age: profileData.age || 26,
          city: profileData.city || 'Makati',
          country: profileData.country || 'Philippines',
          avatarUrl: profileData.avatar_url || '/placeholder.jpg',
          galleryUrls: profileData.gallery_urls || [],
          isVerified: Boolean(profileData.is_verified),
          relationshipIntent: profileData.intent || 'Long-term relationship',
          jobTitle: profileData.job_title,
          languages: profileData.languages || ['English'],
          bio: profileData.bio || '',
          trustPill: profileData.trust_pill,
          trustStatus: profileData.trust_status,
        });

        // 3. Load message history between authenticated user and target UUID
        const { data: history } = await supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${profileData.id}),and(sender_id.eq.${profileData.id},receiver_id.eq.${user.id})`
          )
          .order('created_at', { ascending: true });

        if (history) {
          setInitialMessages(history);
        }
      } else {
        // Fallback to dummy profile if user is not in profiles table
        const dummy =
          DUMMY_PROFILES.find((p) => p.id === rawParam) || DUMMY_PROFILES[0];

        setTargetUser({
          id: dummy.id,
          fullName: dummy.fullName,
          age: dummy.age,
          city: dummy.city,
          country: dummy.country,
          avatarUrl: dummy.avatarUrl,
          galleryUrls: dummy.galleryUrls || [],
          isVerified: dummy.isVerified ?? true,
          relationshipIntent: dummy.relationshipIntent || 'Sincere connection',
          jobTitle: dummy.jobTitle,
          languages: dummy.languages,
          bio: dummy.bio,
          trustPill: dummy.trustPill,
          trustStatus: dummy.trustStatus,
        });
      }

      setLoading(false);
    }

    initChat();
  }, [rawParam, router]);

  if (loading || !targetUser) {
    return (
      <div className="min-h-screen bg-[#17131F] flex items-center justify-center text-[#E6D7FA]">
        <div className="animate-pulse text-sm">Loading conversation...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#17131F]">
      <ChatInterface
        currentUserId={currentUserId || ''}
        targetUser={targetUser}
        initialMessages={initialMessages}
      />
    </main>
  );
}
