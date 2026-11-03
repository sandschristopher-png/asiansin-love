import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { resolveCountry } from '@/lib/countries';
import { getPresenceStatus } from '@/lib/presence';

/**
 * Only the columns the Discover grid / profile sheet mapping below reads. Never select('*') here:
 * the feed scans up to 200 rows, and profiles also holds Stripe ids, admin flags and
 * verification photo paths that must not be loaded for a feed.
 */
const DISCOVER_COLUMNS = [
  'id', 'username', 'display_name', 'full_name', 'name',
  'age', 'birthdate', 'gender', 'interested_in', 'seeking_gender',
  'city', 'country', 'location', 'latitude', 'longitude', 'location_source',
  'avatar_url', 'photos', 'is_verified', 'verification_status', 'is_plus', 'reputation_score',
  'last_active', 'show_active_status', 'hide_profile',
  'relationship_intent', 'intentions', 'relationship_goal', 'intent', 'looking_for',
  'bio', 'occupation', 'profession', 'languages', 'interests', 'height', 'weight', 'created_at',
  'voice_intro_url',
].join(', ');

/** Rhythm badge column from 20261106_reputation_rhythm.sql; the feed falls back without it. */
const RHYTHM_COLUMNS = 'reply_pace';

export const dynamic = 'force-dynamic';

function normalizeGenderValue(raw?: string | null): 'female' | 'male' | 'female' | 'male' | 'male' {
  const val = String(raw || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (['male', 'male', 'male', 'm', 'guy', 'guys'].includes(val)) return 'male';
  if (['female', 'female', 'female', 'f', 'lady', 'ladies', 'girl', 'girls'].includes(val)) return 'female';
  if (['female', 'female', 'transgender_woman', 'transgender_women', 'male', 'mtf', 'transfemale'].includes(val)) return 'female';
  if (['male', 'male', 'transgender_man', 'transgender_men', 'ftm', 'transmale'].includes(val)) return 'male';
  if (['male', 'nonbinary', 'nb', 'enby'].includes(val)) return 'male';
  return 'female';
}

function normalizeInterestedInList(rawInterestedIn: unknown, rawSeekingGender?: unknown): string[] {
  const list: string[] = [];
  if (Array.isArray(rawInterestedIn) && rawInterestedIn.length > 0) {
    rawInterestedIn.forEach((item) => {
      const s = String(item || '').toLowerCase().trim();
      if (s === 'everyone' || s === 'all') {
        list.push('male', 'female', 'female', 'male', 'male');
      } else if (s) {
        list.push(normalizeGenderValue(s));
      }
    });
  } else if (typeof rawInterestedIn === 'string' && rawInterestedIn.trim()) {
    const s = rawInterestedIn.toLowerCase().trim();
    if (s === 'everyone' || s === 'all') {
      list.push('male', 'female', 'female', 'male', 'male');
    } else {
      s.split(',').forEach((part) => {
        if (part.trim()) list.push(normalizeGenderValue(part));
      });
    }
  } else if (typeof rawSeekingGender === 'string' && rawSeekingGender.trim()) {
    const s = rawSeekingGender.toLowerCase().trim();
    if (s === 'everyone' || s === 'all') {
      list.push('male', 'female', 'female', 'male', 'male');
    } else {
      s.split(',').forEach((part) => {
        if (part.trim()) list.push(normalizeGenderValue(part));
      });
    }
  }
  return Array.from(new Set(list));
}

export async function GET() {
  try {
    const sessionClient = await createServerSupabaseClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', viewer: null, profiles: [] }, { status: 401 });
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const blockedUserIds = new Set<string>();
    let viewerProfile: Record<string, any> | null = null;
    let viewerInterestedIn: string[] = [];
    let favoriteIds: string[] = [];
    // Already sparked (sparks table, the "You Sparked" tab) or favourited: never shown again.
    const alreadyLikedIds = new Set<string>();

    if (user) {
      const [profRes, blocksRes, favsRes, sparksRes] = await Promise.all([
        serviceClient
          .from('profiles')
          .select('id, gender, interested_in, seeking_gender, latitude, longitude, interests, languages, intentions, relationship_intent, onboarding_completed, avatar_url')
          .eq('id', user.id)
          .maybeSingle(),
        serviceClient
          .from('user_blocks')
          .select('blocker_id, blocked_id')
          .or('blocker_id.eq.' + user.id + ',blocked_id.eq.' + user.id),
        serviceClient
          .from('favorites')
          .select('favorite_id')
          .eq('user_id', user.id),
        serviceClient
          .from('sparks')
          .select('receiver_id')
          .eq('sender_id', user.id),
      ]);

      if (profRes.data) {
        viewerProfile = profRes.data;
        viewerInterestedIn = normalizeInterestedInList(
          profRes.data.interested_in,
          profRes.data.seeking_gender
        );
      }

      blocksRes.data?.forEach((b: any) => {
        if (b.blocker_id === user.id) blockedUserIds.add(b.blocked_id);
        if (b.blocked_id === user.id) blockedUserIds.add(b.blocker_id);
      });

      if (favsRes.data) {
        // Live column is favorites.favorite_id (FK profiles.id).
        favoriteIds = (favsRes.data as { favorite_id: string | null }[])
          .map((f) => f.favorite_id)
          .filter((id): id is string => typeof id === 'string');
      }
      favoriteIds.forEach((id) => alreadyLikedIds.add(id));
      (sparksRes.data as { receiver_id: string | null }[] | null)?.forEach((r) => r.receiver_id && alreadyLikedIds.add(r.receiver_id));
    }

    // Strict binary matching (Pairs / with.is model): men see women, women see men. Raw gender
    // values vary ("female", "Woman", "F"...), so the query matches the common spellings and the
    // normalized check in the filter below is the source of truth.
    const viewerGender = viewerProfile?.gender ? normalizeGenderValue(viewerProfile.gender) : null;
    const targetGender = viewerGender === 'male' ? 'female' : viewerGender === 'female' ? 'male' : null;
    const GENDER_SPELLINGS: Record<'male' | 'female', string> = {
      female: 'gender.ilike.female,gender.ilike.woman,gender.ilike.f,gender.ilike.lady',
      male: 'gender.ilike.male,gender.ilike.man,gender.ilike.m,gender.ilike.guy',
    };

    // Exclusions happen in SQL (self, blocked, already sparked / favourited), so the 200-row window
    // is spent on real candidates and nothing unfiltered ever reaches the client. The JS filter
    // below repeats them as a safety net.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const excludedIds = Array.from(new Set([user.id, ...blockedUserIds, ...alreadyLikedIds])).filter((id) => UUID_RE.test(id));
    const fetchFeed = (cols: string) => {
      let q = serviceClient.from('profiles').select(cols).not('id', 'in', `(${excludedIds.join(',')})`);
      if (targetGender) q = q.or(GENDER_SPELLINGS[targetGender]);
      return q.order('created_at', { ascending: false }).limit(200);
    };
    let { data: allRows, error } = await fetchFeed(DISCOVER_COLUMNS + ', ' + RHYTHM_COLUMNS);
    if (error && /reply_pace/.test(error.message)) {
      ({ data: allRows, error } = await fetchFeed(DISCOVER_COLUMNS));
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profiles = (allRows || [])
      .filter((row: any) => {
        if (user && row.id === user.id) return false;
        if (blockedUserIds.has(row.id)) return false;
        if (alreadyLikedIds.has(row.id)) return false;
        if (targetGender && normalizeGenderValue(row.gender) !== targetGender) return false;
        if (row.hide_profile) return false; // Settings > Hide my profile

        // Evict seed/test profiles by name
        const lowerName = String(row.username || row.display_name || row.full_name || row.name || '').toLowerCase().trim();
        if (lowerName === 'bobby') return false;

        // Require at least one real (non-placeholder) photo
        const isPlaceholder = (u: any) =>
          !u ||
          typeof u !== 'string' ||
          u.trim() === '' ||
          u.includes('placeholder') ||
          u.includes('default') ||
          u.endsWith('.svg');

        const photoPool: any[] = Array.isArray(row.photos) ? row.photos.filter(Boolean) : [];
        const hasRealAvatar = !isPlaceholder(row.avatar_url);
        const hasRealGalleryPhoto = photoPool.some((p: any) => !isPlaceholder(p));
        if (!hasRealAvatar && !hasRealGalleryPhoto) return false;

        return Boolean(row.username || row.display_name || row.full_name || row.name || row.avatar_url);
      })
      .map((row: any) => {
        // Normalize codes ("US" -> "United States") and let an unambiguous city fix a mismatched
        // country ("Manila" + "US" -> Philippines). No invented default country.
        const countryVal = resolveCountry(row.city, row.country);
        const cityName = String(row.city || '').trim();
        const cityVal = cityName ? (countryVal ? cityName + ', ' + countryVal : cityName) : countryVal;
        const normGender = normalizeGenderValue(row.gender);

        let computedAge = row.age;
        if (!computedAge && (row.birthdate || row.date_of_birth)) {
          const dob = new Date(row.birthdate || row.date_of_birth);
          computedAge = Math.max(18, Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));
        }

        const cleanName =
          (row.username && !String(row.username).startsWith('user_') ? String(row.username).replace(/^@/, '') : '') ||
          row.display_name ||
          row.full_name ||
          row.name ||
          'Member';

        return {
          id: row.id,
          username: cleanName,
          name: cleanName,
          age: computedAge || 25,
          gender: normGender,
          interested_in: normalizeInterestedInList(row.interested_in, row.seeking_gender),
          location: cityVal,
          country: countryVal,
          avatarUrl: row.avatar_url || '/placeholder-avatar.svg',
          photos: Array.isArray(row.photos) && row.photos.length > 0
            ? row.photos.filter(Boolean)
            : [row.avatar_url || '/placeholder-avatar.svg'],
          repScore: row.reputation_score ?? 100,
          verified: Boolean(row.is_verified || row.verification_status === 'verified'),
          is_plus: Boolean(row.is_plus),
          // Other members' exact coordinates never leave the server: rounded to ~1 km.
          latitude: row.latitude == null || !Number.isFinite(Number(row.latitude)) ? null : Math.round(Number(row.latitude) * 100) / 100,
          longitude: row.longitude == null || !Number.isFinite(Number(row.longitude)) ? null : Math.round(Number(row.longitude) * 100) / 100,
          location_source: row.location_source || 'self_reported',
          // Respect Settings > Show active status; online = heartbeat within the last 5 minutes.
          // (The client also ORs in live Realtime Presence.)
          online: row.show_active_status !== false && getPresenceStatus(row.last_active).isOnline,
          lastActive: row.show_active_status !== false ? row.last_active || null : null,
          intent: row.relationship_intent || row.intentions || row.relationship_goal || row.intent || 'Marriage',
          looking_for: row.looking_for || row.intentions || row.relationship_intent || 'Serious Relationship',
          bio: row.bio || '',
          occupation: row.occupation || row.profession || '',
          languages: row.languages || 'English',
          interests: Array.isArray(row.interests) ? row.interests : [],
          height: row.height || '',
          weight: row.weight || '',
          created_at: row.created_at,
          voiceIntroUrl: row.voice_intro_url || null,
          replyPace: row.reply_pace || null,
        };
      });

    profiles.sort((a: any, b: any) => (b.is_plus ? 1 : 0) - (a.is_plus ? 1 : 0));

    return NextResponse.json({
      viewer: viewerProfile
        ? {
            id: viewerProfile.id,
            gender: normalizeGenderValue(viewerProfile.gender),
            interested_in: viewerInterestedIn,
            latitude: viewerProfile.latitude ?? null,
            longitude: viewerProfile.longitude ?? null,
            interests: Array.isArray(viewerProfile.interests) ? viewerProfile.interests : [],
            languages: viewerProfile.languages ?? null,
            avatarUrl: viewerProfile.avatar_url ?? null,
            intent: viewerProfile.relationship_intent || viewerProfile.intentions || '',
            onboarding_completed: viewerProfile.onboarding_completed,
          }
        : null,
      favoriteIds,
      profiles,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load discover feed' }, { status: 500 });
  }
}

