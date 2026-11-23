/**
 * Demo data for the landing-page showcase screenshots (scripts/capture-showcase.ts). Every member and Moment here is invented:
 * the pictures are flat illustrations (scripts/make-showcase-samples.mjs), the names are made up, and nothing touches a real account.
 */

const PHOTO = (name: string) => `/showcase/sample/${name}.jpg`;

export const VIEWER_ID = '00000000-0000-4000-8000-000000000001';

export const viewer = {
  id: VIEWER_ID,
  gender: 'male',
  interested_in: ['female'],
  latitude: null,
  longitude: null,
  interests: ['Travel', 'Coffee & Cafes', 'Street Food & Markets', 'Hiking & Outdoors', 'Photography'],
  languages: ['English', 'Filipino'],
  avatarUrl: null,
  city: 'Manila',
  country: 'Philippines',
  intent: 'serious_relationship',
  onboarding_completed: true,
  isPlus: true,
};

/** The viewer's own profiles row, as the header and the pages read it. */
export const viewerRow = {
  id: VIEWER_ID,
  username: 'miguel',
  display_name: 'Miguel',
  avatar_url: null,
  // No city on the demo profile, so the spot map frames the pins (rather than opening on a fixed city).
  city: null,
  country: null,
  is_plus: true,
  is_verified: true,
  onboarding_completed: true,
  gender: 'male',
  reputation_score: 100,
};

interface Sample {
  id: string;
  photo: string;
  name: string;
  age: number;
  city: string;
  country: string;
  intent: string;
  interests: string[];
  online?: boolean;
  trip?: { city: string; country: string; arrival: string; departure: string };
  shared?: number;
}

const SAMPLES: Sample[] = [
  { id: 'a1', photo: 'mika', name: 'Mika', age: 28, city: 'Tokyo', country: 'Japan', intent: 'serious_relationship', interests: ['Travel', 'Coffee & Cafes', 'Reading & Books'], online: true, shared: 2 },
  { id: 'a2', photo: 'ploy', name: 'Ploy', age: 27, city: 'Bangkok', country: 'Thailand', intent: 'serious_relationship', interests: ['Street Food & Markets', 'Yoga & Mindfulness', 'Travel'], shared: 3 },
  { id: 'a3', photo: 'aira', name: 'Aira', age: 26, city: 'Taguig', country: 'Philippines', intent: 'local_guide', interests: ['Coffee & Cafes', 'Photography', 'Live Music & Concerts'], online: true, shared: 2 },
  { id: 'a4', photo: 'nok', name: 'Nok', age: 29, city: 'Bangkok', country: 'Thailand', intent: 'figuring_it_out', interests: ['Hiking & Outdoors', 'Cooking & Food', 'Beach & Ocean'], shared: 1 },
  { id: 'a5', photo: 'sofia', name: 'Sofia', age: 30, city: 'Makati', country: 'Philippines', intent: 'serious_relationship', interests: ['Art & Design', 'Language Exchange', 'Coffee & Cafes'], shared: 2 },
  { id: 'a6', photo: 'yuna', name: 'Yuna', age: 25, city: 'Tokyo', country: 'Japan', intent: 'casual_dating', interests: ['Anime & Manga', 'Music & Karaoke', 'Photography'], online: true, shared: 1 },
  { id: 'a7', photo: 'bea', name: 'Bea', age: 27, city: 'Quezon City', country: 'Philippines', intent: 'friends', interests: ['Board Games & Trivia', 'Badminton & Sports', 'Travel'], shared: 2 },
  { id: 'a8', photo: 'lani', name: 'Lani', age: 28, city: 'Pasig', country: 'Philippines', intent: 'local_guide', interests: ['Street Food & Markets', 'Road Trips & Motorbikes', 'Cooking & Food'], online: true, shared: 3 },
];

/** What /api/discover returns for the viewer. */
export const discoverProfiles = SAMPLES.map((p, i) => ({
  id: p.id,
  username: p.name,
  name: p.name,
  age: p.age,
  gender: 'female',
  interested_in: ['male'],
  location: `${p.city}, ${p.country}`,
  country: p.country,
  avatarUrl: PHOTO(p.photo),
  photos: [PHOTO(p.photo)],
  repScore: 100,
  verified: true,
  is_plus: i % 2 === 0,
  latitude: null,
  longitude: null,
  location_source: 'gps_verified',
  online: Boolean(p.online),
  lastActive: null,
  intent: p.intent,
  looking_for: p.intent,
  bio: '',
  occupation: '',
  languages: ['English'],
  interests: p.interests,
  height: '',
  heightCm: null,
  lifestyle: {},
  created_at: new Date(Date.now() - i * 86_400_000).toISOString(),
  voiceIntroUrl: null,
  hasSparked: false,
  sharedCount: p.shared ?? 0,
  replyPace: null,
  trip: p.trip ?? null,
  dayOneNumber: null,
  photoPlaceholders: {},
}));

interface MomentSpec {
  id: string;
  authorId: string;
  scene: string;
  place: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  caption: string;
  vibe: string;
  likes: number;
  hoursAgo: number;
}

const AUTHORS: Record<string, { name: string; age: number; photo: string; localGuide: boolean }> = {
  a1: { name: 'Mika', age: 28, photo: 'mika', localGuide: false },
  a2: { name: 'Ploy', age: 27, photo: 'ploy', localGuide: false },
  a3: { name: 'Aira', age: 26, photo: 'aira', localGuide: true },
  a5: { name: 'Sofia', age: 30, photo: 'sofia', localGuide: false },
  a7: { name: 'Bea', age: 27, photo: 'bea', localGuide: false },
  a8: { name: 'Lani', age: 28, photo: 'lani', localGuide: true },
};

const MOMENT_SPECS: MomentSpec[] = [
  { id: 'm1', authorId: 'a3', scene: 'cafe', place: 'Café Lupe, Poblacion', city: 'Manila', country: 'Philippines', lat: 14.565, lng: 121.03, caption: 'Slow Sunday flat white. Best window seat in Poblacion.', vibe: 'cafe_hopping', likes: 24, hoursAgo: 3 },
  { id: 'm2', authorId: 'a2', scene: 'streetfood', place: 'Soi 38 night market', city: 'Bangkok', country: 'Thailand', lat: 13.7185, lng: 100.5832, caption: 'Grilled skewers at 11pm, worth every queue.', vibe: 'street_food', likes: 41, hoursAgo: 7 },
  { id: 'm3', authorId: 'a1', scene: 'viewpoint', place: 'Shibuya Sky', city: 'Tokyo', country: 'Japan', lat: 35.6585, lng: 139.7023, caption: 'Golden hour over the crossing.', vibe: 'city_walks', likes: 63, hoursAgo: 12 },
  { id: 'm4', authorId: 'a8', scene: 'streetfood', place: 'Kapitolyo night market', city: 'Manila', country: 'Philippines', lat: 14.5716, lng: 121.0577, caption: 'Pasig after dark: isaw, halo-halo, repeat.', vibe: 'street_food', likes: 18, hoursAgo: 20 },
  { id: 'm5', authorId: 'a5', scene: 'riverside', place: 'Intramuros walls', city: 'Manila', country: 'Philippines', lat: 14.5896, lng: 120.9747, caption: 'Sunset walk along the old walls.', vibe: 'beach_sunset', likes: 30, hoursAgo: 26 },
  { id: 'm6', authorId: 'a3', scene: 'viewpoint', place: 'Sky deck, BGC', city: 'Manila', country: 'Philippines', lat: 14.5495, lng: 121.045, caption: 'City lights from the 40th floor.', vibe: 'city_walks', likes: 52, hoursAgo: 30 },
  { id: 'm7', authorId: 'a7', scene: 'cafe', place: 'Escolta Common', city: 'Manila', country: 'Philippines', lat: 14.5985, lng: 120.9795, caption: 'Books and calamansi soda.', vibe: 'cafe_hopping', likes: 12, hoursAgo: 40 },
];

function momentItem(spec: MomentSpec) {
  const a = AUTHORS[spec.authorId];
  return {
    id: spec.id,
    userId: spec.authorId,
    imageUrl: PHOTO(`scene-${spec.scene}`),
    aspectRatio: '4:5',
    caption: spec.caption,
    vibeTag: spec.vibe,
    prompt: null,
    city: spec.city,
    country: spec.country,
    likesCount: spec.likes,
    likedByMe: false,
    locationVerified: true,
    place: spec.place,
    placeLat: spec.lat,
    placeLng: spec.lng,
    sharedVibe: false,
    createdAt: new Date(Date.now() - spec.hoursAgo * 3_600_000).toISOString(),
    isMine: false,
    author: {
      id: spec.authorId,
      username: a.name,
      age: a.age,
      avatarUrl: PHOTO(a.photo),
      verified: true,
      founding: false,
      localGuide: a.localGuide,
    },
  };
}

/** The Moments feed (a location-pinned post first). */
export const feedMoments = MOMENT_SPECS.slice(0, 4).map(momentItem);
/** The pins on the spot map: Manila spots, so the map opens at neighbourhood scale. */
export const mapMoments = MOMENT_SPECS.filter((m) => m.city === 'Manila').map(momentItem);
