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
    ],
    bio: 'Tech professional based in Metro Manila. Sincere, family-oriented, and looking for intentional commitment.',
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
    city: 'Cebu City',
    country: 'Philippines',
    profession: 'Boutique Hotel Supervisor',
    relationshipGoal: 'Serious Relationship',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    ],
    bio: 'Hospitality professional who values warmth, honesty, and mutual respect.',
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
    ],
    bio: 'Detail-oriented and calm. Seeking a committed partner to build a life with.',
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
    bio: 'Passionate about heritage, culture, and meaningful connection.',
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
    profession: 'Silk Weaving Manager',
    relationshipGoal: 'Long-Term Dating',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    ],
    bio: 'Artisan entrepreneur in Vientiane. Seeking a thoughtful, authentic gentleman.',
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
    profession: 'Graphic Designer',
    relationshipGoal: 'Serious Relationship',
    avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
    ],
    bio: 'Creative mind living in Chiang Mai. I love photography, coffee, and sincerity.',
    languages: ['Thai', 'English'],
    heightCm: 160,
    education: 'BFA in Visual Communication',
    isVerified: true,
    isOnline: true,
    reputationScore: 100,
  },
];
