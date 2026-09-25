export interface DummyProfile {
  id: string;
  fullName: string;
  age: number;
  city: string;
  country: string;
  profession: string;
  avatarUrl: string;
  galleryUrls: string[];
  isVerified: boolean;
  isOnline: boolean;
  relationshipGoal: string;
  heightCm: number;
  languages: string[];
  education: string;
  bio: string[];
}

export const DUMMY_PROFILES: DummyProfile[] = [
  // --- PHILIPPINES ---
  {
    id: 'ph-camille',
    fullName: 'Camille',
    age: 26,
    city: 'Makati, Metro Manila',
    country: 'Philippines',
    profession: 'Software QA Analyst',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
    ],
    isVerified: true,
    isOnline: true,
    relationshipGoal: 'Marriage & Long-Term Partner',
    heightCm: 162,
    languages: ['English (Fluent)', 'Tagalog (Native)'],
    education: "Bachelor's in Computer Science",
    bio: [
      'Warm, grounded, and family-oriented. Working in tech in Makati during the week.',
      'I appreciate sincere gentlemen who lead with kindness and clear intentions. On weekends, I love discovering quiet coffee spots, cooking comfort food, and weekend beach escapes to Batangas.',
      'Ready for a loyal partner to build a peaceful future with.',
    ],
  },
  {
    id: 'ph-maricel',
    fullName: 'Maricel',
    age: 33,
    city: 'Cebu City',
    country: 'Philippines',
    profession: 'Boutique Hotel Supervisor',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=80',
    ],
    isVerified: true,
    isOnline: false,
    relationshipGoal: 'Committed Courtship',
    heightCm: 158,
    languages: ['English (Conversational)', 'Cebuano (Native)', 'Tagalog'],
    education: 'Hospitality & Tourism Management',
    bio: [
      'Born and raised in Cebu with a calm island temperament and a strong work ethic.',
      'I value traditional respect, shared laughter, and emotional maturity. Looking for an honest man who knows what he wants in life.',
    ],
  },
  {
    id: 'ph-althea',
    fullName: 'Althea',
    age: 29,
    city: 'Davao City, Mindanao',
    country: 'Philippines',
    profession: 'Registered Nurse',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80',
    ],
    isVerified: false,
    isOnline: true,
    relationshipGoal: 'Marriage & Family',
    heightCm: 165,
    languages: ['English (Fluent)', 'Tagalog (Native)'],
    education: 'B.S. in Nursing',
    bio: [
      'Caring and soft-spoken healthcare worker. I spend my off days gardening and spending time with my parents and nieces.',
      'Hoping to connect with an intentional gentleman who values faith, family ties, and calm communication.',
    ],
  },

  // --- THAILAND ---
  {
    id: 'th-siriporn',
    fullName: 'Siriporn',
    age: 28,
    city: 'Bangkok',
    country: 'Thailand',
    profession: 'Hospitality Operations Lead',
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1000&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1000&q=80',
    ],
    isVerified: true,
    isOnline: true,
    relationshipGoal: 'Long-Term Marriage Partner',
    heightCm: 160,
    languages: ['Thai (Native)', 'English (Fluent)'],
    education: 'B.A. in International Business',
    bio: [
      'Energetic, polite, and deeply respectful of cultural balance.',
      'Passionate about regional Thai cuisine, morning temple visits, and exploring world cultures. Seeking an older gentleman who is stable, appreciative of family, and sincere.',
    ],
  },
  {
    id: 'th-kanya',
    fullName: 'Kanya',
    age: 36,
    city: 'Chiang Mai',
    country: 'Thailand',
    profession: 'Ceramics & Textile Studio Owner',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
    ],
    isVerified: true,
    isOnline: false,
    relationshipGoal: 'Meaningful Companionship',
    heightCm: 163,
    languages: ['Thai (Native)', 'English (Conversational)'],
    education: 'Fine Arts & Design Degree',
    bio: [
      'Living a mindful, creative life in northern Thailand surrounded by hills and artisan craft communities.',
      'Independent and emotionally grounded. Looking for a partner with wisdom, integrity, and an appreciation for nature and tranquil living.',
    ],
  },
  {
    id: 'th-chanya',
    fullName: 'Chanya',
    age: 25,
    city: 'Phuket',
    country: 'Thailand',
    profession: 'Customer Relations Representative',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=80',
    ],
    isVerified: false,
    isOnline: true,
    relationshipGoal: 'Committed Relationship',
    heightCm: 157,
    languages: ['Thai (Native)', 'English (Good)'],
    education: 'Liberal Arts Diploma',
    bio: [
      'Sunny smile, love seaside walks, swimming, and night market treats.',
      'I am looking for a responsible man who values mutual loyalty and wants a dedicated companion.',
    ],
  },

  // --- CAMBODIA ---
  {
    id: 'kh-socheata',
    fullName: 'Socheata',
    age: 27,
    city: 'Phnom Penh',
    country: 'Cambodia',
    profession: 'Accountant & Financial Auditor',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=1000&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=1000&q=80',
    ],
    isVerified: true,
    isOnline: true,
    relationshipGoal: 'Marriage & Long-Term Partner',
    heightCm: 161,
    languages: ['Khmer (Native)', 'English (Fluent)', 'French (Basic)'],
    education: 'B.A. in Finance & Banking',
    bio: [
      'Organized, cheerful, and guided by strong family values. Raised in Phnom Penh with traditional morals.',
      'I enjoy riverside runs, reading, and learning new recipes. Looking for a dependable gentleman who values honesty and traditional courtship.',
    ],
  },
  {
    id: 'kh-bopha',
    fullName: 'Bopha',
    age: 32,
    city: 'Siem Reap',
    country: 'Cambodia',
    profession: 'Cultural Tour Coordinator',
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=1000&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=1000&q=80',
    ],
    isVerified: false,
    isOnline: false,
    relationshipGoal: 'Committed Relationship',
    heightCm: 159,
    languages: ['Khmer (Native)', 'English (Fluent)'],
    education: 'Archaeology & Heritage Management',
    bio: [
      'Passionate about Cambodian heritage, ancient architecture, and gentle daily living near the temples.',
      'I respect men who treat others with patience and quiet strength. Looking forward to deep conversations.',
    ],
  },

  // --- LAOS ---
  {
    id: 'la-manivanh',
    fullName: 'Manivanh',
    age: 30,
    city: 'Vientiane',
    country: 'Laos',
    profession: 'Silk Weaving & Eco-Store Manager',
    avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1000&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1000&q=80',
    ],
    isVerified: true,
    isOnline: true,
    relationshipGoal: 'Marriage & Lifelong Companionship',
    heightCm: 156,
    languages: ['Lao (Native)', 'English (Good)', 'Thai (Fluent)'],
    education: 'Business Administration',
    bio: [
      'Gentle, thoughtful, and traditional. I love the calm rhythm of the Mekong River and brewing green tea.',
      'Seeking a kind-hearted man who values quiet evenings, sincere devotion, and building a loyal home together.',
    ],
  },
];