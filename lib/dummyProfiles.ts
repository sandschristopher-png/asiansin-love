export interface Profile {
  id: string;
  fullName: string;
  age: number;
  city: string;
  country: string;
  avatarUrl: string;
  photos: string[];
  isVerified: boolean;
  relationshipGoal: string;
  profession: string;
  bio: string;
  isOnline: boolean;
}

export const DUMMY_PROFILES: Profile[] = [
  {
    id: 'ph-camille',
    fullName: 'Camille',
    age: 26,
    city: 'Makati, Metro Manila',
    country: 'Philippines',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
    ],
    isVerified: true,
    relationshipGoal: 'Marriage & Long-Term Partner',
    profession: 'Software QA Analyst',
    bio: 'Looking for a kind, dependable gentleman who values family and open communication.',
    isOnline: true,
  },
  {
    id: 'ph-maricel',
    fullName: 'Maricel',
    age: 33,
    city: 'Cebu City',
    country: 'Philippines',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
    ],
    isVerified: true,
    relationshipGoal: 'Committed Courtship',
    profession: 'Boutique Hotel Supervisor',
    bio: 'Warm-hearted, love coastal weekend trips, and appreciate traditional courtship values.',
    isOnline: false,
  },
  {
    id: 'ph-atthea',
    fullName: 'Atthea',
    age: 29,
    city: 'Davao City, Mindanao',
    country: 'Philippines',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
    ],
    isVerified: false,
    relationshipGoal: 'Marriage & Family',
    profession: 'Registered Nurse',
    bio: 'Caring, hardworking, and seeking an honest international partner ready to build a peaceful future.',
    isOnline: false,
  },
  {
    id: 'th-siriporn',
    fullName: 'Siriporn',
    age: 28,
    city: 'Bangkok',
    country: 'Thailand',
    avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80'
    ],
    isVerified: false,
    relationshipGoal: 'Long-Term Marriage Partner',
    profession: 'Hospitality Operations Lead',
    bio: 'Passionate about food, mindfulness, and finding a supportive man to explore life with.',
    isOnline: true,
  },
  {
    id: 'th-kanya',
    fullName: 'Kanya',
    age: 36,
    city: 'Chiang Mai',
    country: 'Thailand',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'
    ],
    isVerified: true,
    relationshipGoal: 'Meaningful Companionship',
    profession: 'Ceramics & Textile Studio Owner',
    bio: 'Calm spirit who enjoys nature, creative craft, and quiet conversations over good coffee.',
    isOnline: false,
  },
  {
    id: 'th-chanya',
    fullName: 'Chanya',
    age: 25,
    city: 'Phuket',
    country: 'Thailand',
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80'
    ],
    isVerified: false,
    relationshipGoal: 'Committed Relationship',
    profession: 'Customer Relations Representative',
    bio: 'Active, cheerful, and looking for someone trustworthy who communicates from the heart.',
    isOnline: true,
  },
  {
    id: 'kh-socheata',
    fullName: 'Socheata',
    age: 27,
    city: 'Phnom Penh',
    country: 'Cambodia',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80'
    ],
    isVerified: false,
    relationshipGoal: 'Marriage & Long-Term Partner',
    profession: 'Accountant & Financial Auditor',
    bio: 'Gentle, values loyalty and integrity. Looking for a respectful partner with shared goals.',
    isOnline: true,
  },
  {
    id: 'kh-bopha',
    fullName: 'Bopha',
    age: 32,
    city: 'Siem Reap',
    country: 'Cambodia',
    avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80'
    ],
    isVerified: false,
    relationshipGoal: 'Committed Relationship',
    profession: 'Cultural Tour Coordinator',
    bio: 'Proud of our rich heritage and looking for a mature gentleman who treats family with deep respect.',
    isOnline: false,
  },
  {
    id: 'la-manivanh',
    fullName: 'Manivanh',
    age: 30,
    city: 'Vientiane',
    country: 'Laos',
    avatarUrl: 'https://images.unsplash.com/photo-1534751516642-a1714f364024?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1534751516642-a1714f364024?auto=format&fit=crop&w=800&q=80'
    ],
    isVerified: true,
    relationshipGoal: 'Marriage & Lifelong Companion',
    profession: 'Silk Weaving & Eco-Store Manager',
    bio: 'Simple living, kind heart, and searching for an intentional man to share a happy, peaceful life.',
    isOnline: true,
  }
];