// app/api/profile/photo/route.ts
//   DELETE { url } -> removes one of the member's own photos: { photos, avatar_url }
//
// Guardrails: a profile always keeps at least one photo; deleting the main photo promotes the next
// one so Discover cards never break; the file is removed from storage (avatars / user_photos)
// only when it sits in the member's own folder.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const PHOTO_BUCKETS = new Set(['avatars', 'user_photos']);

/** ".../storage/v1/object/public/<bucket>/<path>?..." -> { bucket, path } */
function storageLocation(url: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(url);
    if (u.host !== new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host) return null;
    const m = u.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
    if (!m) return null;
    return { bucket: decodeURIComponent(m[1]), path: decodeURIComponent(m[2]) };
  } catch {
    return null;
  }
}

export async function DELETE(req: Request) {
  const supabase = await createSessionClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = data.user.id;

  let url: unknown;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof url !== 'string' || !url) return NextResponse.json({ error: 'Photo URL required.' }, { status: 400 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data: profile, error: readError } = await admin
    .from('profiles')
    .select('photos, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (readError || !profile) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });

  const current: string[] = Array.isArray(profile.photos) ? profile.photos.filter(Boolean) : [];
  // Older profiles may have only avatar_url set.
  if (current.length === 0 && profile.avatar_url) current.push(profile.avatar_url);
  if (!current.includes(url)) return NextResponse.json({ error: 'Photo not found on your profile.' }, { status: 404 });
  if (current.length <= 1) {
    return NextResponse.json({ error: 'Profiles require at least one photo.' }, { status: 400 });
  }

  const photos = current.filter((p) => p !== url);
  const wasMain = profile.avatar_url === url || current[0] === url;
  const avatar_url = wasMain ? photos[0] : profile.avatar_url;

  const { error: updateError } = await admin
    .from('profiles')
    .update({ photos, avatar_url, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (updateError) {
    console.error('[profile/photo] update failed:', updateError.message);
    return NextResponse.json({ error: 'Could not remove the photo.' }, { status: 500 });
  }

  // Storage cleanup: only files in this member's own folder of a photo bucket.
  const loc = storageLocation(url);
  if (loc && PHOTO_BUCKETS.has(loc.bucket) && loc.path.startsWith(`${userId}/`)) {
    const { error: removeError } = await admin.storage.from(loc.bucket).remove([loc.path]);
    if (removeError) console.warn('[profile/photo] storage remove failed:', removeError.message);
  }

  return NextResponse.json({ success: true, photos, avatar_url });
}
