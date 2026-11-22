/**
 * The Interests & Hobbies pills, one list for onboarding and Edit Profile. Interests are stored as these exact strings
 * (profiles.interests), so a tag is only ever added here, never renamed. Icons live in lib/interestIcons.ts.
 */
export const HOBBY_TAGS = [
  'Cooking & Food',
  'Beach & Ocean',
  'Island Hopping',
  'Family First',
  'Travel',
  'Movies & Cinema',
  'Music & Karaoke',
  'Fitness & Gym',
  'Health & Wellness',
  'Coffee & Cafes',
  'Hiking & Outdoors',
  'Faith & Church',
  'Homebody',
  'Nightlife & Bars',
  'Shopping & Malls',
  'Photography',
  'Pets & Animals',
  'Mobile Gaming & Esports',
  'Art & Design',
  'Business & Career',
  // Popular across Southeast Asia and in traveler / expat circles
  'Street Food & Markets',
  'Anime & Manga',
  'K-Drama & C-Drama',
  'Badminton & Sports',
  'Road Trips & Motorbikes',
  'Board Games & Trivia',
  'Live Music & Concerts',
  'Language Exchange',
  'Reading & Books',
  'Yoga & Mindfulness',
] as const;

/** Case-insensitive, order-preserving unique list (a profile card never shows the same tag twice). */
export function uniqueTags(tags: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = String(raw ?? '').trim();
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}
