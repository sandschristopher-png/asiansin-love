export interface DummyProfile {
  id: string;
  fullName: string;
  age: number;
  city: string;
  country: string;
  profession: string;
  relationshipGoal: 'Marriage' | 'Serious Relationship' | 'Long-Term Dating' | 'Casual Dating';
  avatarUrl: string;
  galleryUrls: string[];
  bio: string;
  languages: string[];
  heightCm?: number;
  education?: string;
  isVerified: boolean;
  isOnline: boolean;
  reputationScore: number;
}

export const DUMMY_PROFILES: DummyProfile[] = [
  {
    id: 'ph-camille',
    fullName: 'Camille',
    age: 26,
    city: 'Makati, Metro Manila',
    country: 'Philippines',
    profession: 'Software QA Analyst',
    relationshipGoal: 'Marriage',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    ],
    bio: 'Tech professional based in Metro Manila. Sincere, family-oriented, and looking for intentional commitment and shared growth.',
    languages: ['English', 'Tagalog'],
    heightCm: 162,
    education: 'BS in Computer Science',
    isVerified: true,
    isOnline: true,
    reputationScore: 100,
  },
  {
    id: 'ph-maricel',
    fullName: 'Maricel',
    age: 33,
    city: 'Cebu City, Central Visayas',
    country: 'Philippines',
    profession: 'Boutique Hotel Supervisor',
    relationshipGoal: 'Serious Relationship',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    ],
    bio: 'Hospitality professional who values warmth, mutual respect, good food, and honest communication.',
    languages: ['English', 'Cebuano', 'Tagalog'],
    heightCm: 158,
    education: 'BS in Hospitality Management',
    isVerified: true,
    isOnline: false,
    reputationScore: 100,
  },
  {
    id: 'kh-socheata',
    fullName: 'Socheata',
    age: 27,
    city: 'Phnom Penh',
    country: 'Cambodia',
    profession: 'Accountant & Auditor',
    relationshipGoal: 'Marriage',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
    ],
    bio: 'Detail-oriented and calm. Looking to build a reliable partnership grounded in trust, family values, and genuine care.',
    languages: ['Khmer', 'English'],
    heightCm: 160,
    education: 'BBA in Accounting',
    isVerified: true,
    isOnline: true,
    reputationScore: 98,
  },
  {
    id: 'kh-bopha',
    fullName: 'Bopha',
    age: 32,
    city: 'Siem Reap',
    country: 'Cambodia',
    profession: 'Cultural Tour Coordinator',
    relationshipGoal: 'Serious Relationship',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    ],
    bio: 'Passionate about heritage, temple preservation, and quiet coffee afternoons. Looking for a dependable, thoughtful partner.',
    languages: ['Khmer', 'English', 'French'],
    heightCm: 165,
    education: 'BA in Tourism Management',
    isVerified: true,
    isOnline: false,
    reputationScore: 96,
  },
  {
    id: 'la-manivanh',
    fullName: 'Manivanh',
    age: 30,
    city: 'Vientiane',
    country: 'Laos',
    profession: 'Silk Weaving Studio Director',
    relationshipGoal: 'Long-Term Dating',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    ],
    bio: 'Artisan entrepreneur in Vientiane. Seeking a kind, authentic partner who values tradition, creative work, and peaceful living.',
    languages: ['Lao', 'Thai', 'English'],
    heightCm: 163,
    education: 'Business Administration',
    isVerified: true,
    isOnline: true,
    reputationScore: 100,
  },
  {
    id: 'th-siriporn',
    fullName: 'Siriporn',
    age: 28,
    city: 'Chiang Mai',
    country: 'Thailand',
    profession: 'Visual Brand Designer',
    relationshipGoal: 'Serious Relationship',
    avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    ],
    bio: 'Creative mind living in Chiang Mai. Passionate about photography, Northern Thai culinary arts, and sincere companionship.',
    languages: ['Thai', 'English'],
    heightCm: 160,
    education: 'BFA in Visual Communication',
    isVerified: true,
    isOnline: true,
    reputationScore: 100,
  },
  {
    id: 'th-anong',
    fullName: 'Anong',
    age: 25,
    city: 'Bangkok',
    country: 'Thailand',
    profession: 'Digital Marketing Strategist',
    relationshipGoal: 'Marriage',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    ],
    bio: 'Balancing fast-paced city life with peaceful weekends. Seeking someone family-oriented and ready for lifelong partnership.',
    languages: ['Thai', 'English'],
    heightCm: 165,
    education: 'BA in Communications',
    isVerified: true,
    isOnline: false,
    reputationScore: 99,
  },
  {
    id: 'ph-bea',
    fullName: 'Bea',
    age: 29,
    city: 'Davao City, Mindanao',
    country: 'Philippines',
    profession: 'Registered Nurse',
    relationshipGoal: 'Serious Relationship',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    ],
    bio: 'Compassionate healthcare professional. Values faith, family dinners, loyalty, and honest intention.',
    languages: ['English', 'Tagalog', 'Cebuano'],
    heightCm: 157,
    education: 'BS in Nursing',
    isVerified: true,
    isOnline: true,
    reputationScore: 100,
  },
];