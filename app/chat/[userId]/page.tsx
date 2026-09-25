import React from 'react';
import { notFound } from 'next/navigation';
import { ChatInterface, TargetUserProfile } from '@/components/ChatInterface';

interface DummyProfile {
  id: string;
  fullName: string;
  age: number;
  city: string;
  country: string;
  avatarUrl: string;
  galleryUrls?: string[];
  isVerified: boolean;
  relationshipIntent: string;
  jobTitle?: string;
  languages?: string[];
  bio?: string;
  reputationScore?: number;
  childrenStatus?: string;
}

const DUMMY_MEMBERS: Record<string, DummyProfile> = {
  'ph-camille': {
    id: 'ph-camille',
    fullName: 'Camille',
    age: 26,
    city: 'Makati, Metro Manila',
    country: 'Philippines',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    ],
    isVerified: true,
    relationshipIntent: 'Marriage & Long-Term Partner',
    jobTitle: 'Hospitality Specialist',
    languages: ['Tagalog', 'English'],
    bio: 'Dedicated to intentional living, deep family values, and genuine conversation. Seeking an honest gentleman for marriage.',
    reputationScore: 98,
    childrenStatus: 'No Dependents',
  },
  'th-siriporn': {
    id: 'th-siriporn',
    fullName: 'Siriporn',
    age: 28,
    city: 'Bangkok',
    country: 'Thailand',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    isVerified: true,
    relationshipIntent: 'Committed Courtship',
    jobTitle: 'Graphic Designer',
    languages: ['Thai', 'English'],
    bio: 'Creative spirit with traditional values. Excited to connect with someone sincere.',
    reputationScore: 95,
    childrenStatus: 'No Dependents',
  },
  'ph-maricel': {
    id: 'ph-maricel',
    fullName: 'Maricel',
    age: 25,
    city: 'Cebu City',
    country: 'Philippines',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    isVerified: false,
    relationshipIntent: 'Marriage & Long-Term Partner',
    jobTitle: 'Teacher',
    languages: ['Cebuano', 'English'],
    bio: 'Kindhearted teacher who loves cooking and beach walks.',
    reputationScore: 92,
    childrenStatus: 'No Dependents',
  },
};

export default async function ChatPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const targetUser = DUMMY_MEMBERS[userId] || null;

  if (!targetUser) {
    notFound();
  }

  // Placeholder logged-in viewer ID for initial dummy demo
  const currentUserId = '00000000-0000-0000-0000-000000000001';

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-[#17131F]">
      <ChatInterface
        currentUserId={currentUserId}
        targetUser={targetUser as TargetUserProfile}
        initialMessages={[]}
      />
    </div>
  );
}
