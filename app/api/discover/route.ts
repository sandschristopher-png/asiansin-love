import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function normalizeGenderValue(raw?: string | null): 'woman' | 'man' | 'trans_woman' | 'trans_man' | 'non_binary' {
  const val = String(raw || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (['man', 'men', 'male', 'm', 'guy', 'guys'].includes(val)) return 'man';
  if (['woman', 'women', 'female', 'f', 'lady', 'ladies', 'girl', 'girls'].includes(val)) return 'woman';
  if (['trans_woman', 'trans_women', 'transgender_woman', 'transgender_women', 'trans', 'mtf', 'transfemale'].includes(val)) return 'trans_woman';
  if (['trans_man', 'trans_men', 'transgender_man', 'transgender_men', 'ftm', 'transmale'].includes(val)) return 'trans_man';
  if (['non_binary', 'nonbinary', 'nb', 'enby'].includes(val)) return 'non_binary';
  return 'woman';
}

function normalizeInterestedInList(rawInterestedIn: unknown, rawSeekingGender?: unknown): string[] {
  const list: string[] = [];
  if (Array.isArray(rawInterestedIn) && rawInterestedIn.length > 0) {
    rawInterestedIn.forEach((item) => {
      const s = String(item || '').toLowerCase().trim();
      if (s === 'everyone' || s === 'all') {
        list.push('man', 'woman', 'trans_woman', 'trans_man', 'non_binary');
      } else if (s) {
        list.push(normalizeGenderValue(s));
      }
    });
  } else if (typeof rawInterestedIn === 'string' && rawInterestedIn.trim()) {
    const s = rawInterestedIn.toLowerCase().trim();
    if (s === 'everyone' || s === 'all') {
      list.push('man', 'woman', 'trans_woman', 'trans_man', 'non_binary');
    } else {
      s.split(',').forEach((part) => {
        if (part.trim()) list.push(normalizeGenderValue(part));
      });
    }
  } else if (typeof rawSeekingGender === 'string' && rawSeekingGender.trim()) {
    const s = rawSeekingGender.toLowerCase().trim();
    if (s === 'everyone' || s === 'all') {
      list.push('man', 'woman', 'trans_woman', 'trans_man', 'non_binary');
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

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const blockedUserIds = new Set<string>();
    let viewerProfile: Record<string, any> | null = null;
    let viewerInterestedIn: string[] = [];
    let favoriteIds: string[] = [];

    if (user) {
      const [profRes, blocksRes, favsRes] = await Promise.all([
        serviceClient.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        serviceClient
          .from('user_blocks')
          .select('blocker_id, blocked_id')
          .or('blocker_id.eq.' + user.id + ',blocked_id.eq.' + user.id),
        serviceClient
          .from('favorites')
          .select('favorite_profile_id')
          .eq('user_id', user.id),
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
        favoriteIds = favsRes.data.map((f: any) => f.favorite_profile_id);
      }
    }

    const { data: allRows, error } = await serviceClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profiles = (allRows || [])
      .filter((row: any) => {
        if (user && row.id === user.id) return false;
        if (blockedUserIds.has(row.id)) return false;

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
        const countryVal = row.country || 'Philippines';
        const cityVal = row.city ? row.city + ', ' + countryVal : (row.location || countryVal);
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
          latitude: row.latitude ?? null,
          longitude: row.longitude ?? null,
          location_source: row.location_source || 'self_reported',
          online: Boolean(
            row.last_active
              ? Date.now() - new Date(row.last_active).getTime() < 1000 * 60 * 15
              : true
          ),
          intent: row.relationship_intent || row.intentions || row.relationship_goal || row.intent || 'Marriage',
          looking_for: row.looking_for || row.intentions || row.relationship_intent || 'Serious Relationship',
          bio: row.bio || '',
          occupation: row.occupation || row.profession || '',
          languages: row.languages || 'English',
          interests: Array.isArray(row.interests) ? row.interests : [],
          height: row.height || '',
          weight: row.weight || '',
          created_at: row.created_at,
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
