import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { consumePhotoSwap, fetchOwnPhoto, photoSwapCleared, stepUpDb } from '@/lib/verify/stepUp';

export const runtime = 'nodejs';

/**
 * POST { url, stepUpId } -> { photos }   Makes one of the member's existing photos the primary one.
 * Changing the main photo needs a passed identity check matched against exactly that photo
 * (lib/verify/stepUp.photoSwapCleared), so this runs on the server instead of a direct profile update.
 */
export async function POST(req: Request) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { url?: unknown; stepUpId?: unknown };
  const url = typeof body.url === 'string' ? body.url : '';
  const db = stepUpDb();

  const { data: profile } = await db.from('profiles').select('photos, avatar_url').eq('id', user.id).maybeSingle();
  const photos: string[] = Array.isArray(profile?.photos) ? (profile!.photos as string[]).filter(Boolean) : profile?.avatar_url ? [profile.avatar_url as string] : [];
  if (!url || !photos.includes(url)) return NextResponse.json({ error: 'That photo is not on your profile.' }, { status: 400 });
  if (photos[0] === url) return NextResponse.json({ photos });

  const bytes = await fetchOwnPhoto(url);
  if (!bytes) return NextResponse.json({ error: 'Could not read that photo.' }, { status: 400 });
  const sha = createHash('sha256').update(bytes.data).digest('hex');
  if (!(await photoSwapCleared(db, user.id, body.stepUpId, sha))) {
    return NextResponse.json({ error: 'Confirm your identity to change your main photo.', code: 'STEP_UP_REQUIRED' }, { status: 403 });
  }

  const next = [url, ...photos.filter((p) => p !== url)];
  const { error } = await db.from('profiles').update({ avatar_url: url, photos: next }).eq('id', user.id);
  if (error) return NextResponse.json({ error: 'Could not update your main photo.' }, { status: 500 });
  await consumePhotoSwap(db, body.stepUpId);
  return NextResponse.json({ photos: next });
}
