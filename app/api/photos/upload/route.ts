import { NextResponse, after } from 'next/server';
import { notifyAdmins } from '@/lib/adminNotify';
import exifr from 'exifr';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** The browser-supplied MIME type is not trusted: check the file's actual leading bytes. */
function matchesImageSignature(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === 'image/png') return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === 'image/webp') return buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate via Bearer Token header or SSR Session Cookies
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let user = null;
    let authenticatedClient = null;

    if (bearerToken) {
      // Create client authenticated specifically with caller's verified JWT
      authenticatedClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${bearerToken}`,
            },
          },
        }
      );
      const { data, error } = await authenticatedClient.auth.getUser(bearerToken);
      if (!error && data?.user) {
        user = data.user;
      }
    } else {
      authenticatedClient = await createServerClient();
      const { data, error } = await authenticatedClient.auth.getUser();
      if (!error && data?.user) {
        user = data.user;
      }
    }

    if (!user || !authenticatedClient) {
      return NextResponse.json({ error: 'Unauthorized: Valid session required' }, { status: 401 });
    }

    const userId = user.id;

    // Privileged storage client: route already authenticated the caller
    // (Bearer JWT or SSR session), so RLS-verified context is known.
    const serviceClient = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
      : authenticatedClient;

    // 2. Enforce multipart/form-data exclusively
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content type. Binary multipart/form-data file required.' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = (formData.get('photo') || formData.get('file')) as File | null;
    const isPrimaryAvatar = (formData.get('isPrimary') ?? formData.get('isPrimaryAvatar')) !== 'false';
    // Tiny blurred preview from lib/utils/imageCompressor.ts (shown while the photo streams in).
    const rawPlaceholder = formData.get('placeholder');
    const placeholder =
      typeof rawPlaceholder === 'string' &&
      rawPlaceholder.length <= 4096 &&
      /^data:image\/(?:webp|jpeg);base64,[A-Za-z0-9+/=]+$/.test(rawPlaceholder)
        ? rawPlaceholder
        : null;

    if (!file) {
      return NextResponse.json({ error: 'No photo file provided' }, { status: 400 });
    }

    // 3. Server-side validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds maximum allowed size of 10MB' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid image format. Allowed formats: JPEG, PNG, WEBP' },
        { status: 400 }
      );
    }

    // 4. File extension derived safely from MIME type
    const mimeExtMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const safeExt = mimeExtMap[file.type] || 'jpg';
    const arrayBuffer = await file.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);
    if (!matchesImageSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: 'File contents do not match an allowed image format' },
        { status: 400 }
      );
    }
    // AI-photo safeguard (20261108): classify upload origin before storing.
    let aiStatus: 'camera' | 'suspect' | 'ai' = 'suspect';
    try {
      const latin = buffer.toString('latin1');
      if (latin.includes('urn:c2pa') || latin.includes('c2pa')) {
        aiStatus = 'ai'; // provenance manifest embedded by generator
      } else {
        const meta = await exifr.parse(buffer);
        if (meta && (meta.Make || meta.make || meta.Model || meta.model)) {
          aiStatus = 'camera';
        }
      }
    } catch {
      // Metadata unreadable: leave as 'suspect'. Upload never fails here.
    }

    const filePath = `${userId}/${isPrimaryAvatar ? 'primary' : 'photo'}-${crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16)}.${safeExt}`;

    // 5. Upload under authenticated caller context (satisfies RLS)
    const { error: uploadError } = await serviceClient.storage
      .from('user_photos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 6. Public URL resolution
    const { data: publicUrlData } = serviceClient.storage
      .from('user_photos')
      .getPublicUrl(filePath);

    const photoUrl = publicUrlData?.publicUrl;
    if (!photoUrl) {
      return NextResponse.json({ error: 'Failed to generate public photo URL' }, { status: 500 });
    }

    // 7. Update profile row and sync photos array
    const { data: currentProfile } = await authenticatedClient
      .from('profiles')
      .select('photos, avatar_url, photo_ai_status')
      .eq('id', userId)
      .maybeSingle();

    const existingPhotos: string[] = Array.isArray(currentProfile?.photos)
      ? currentProfile.photos.filter(Boolean)
      : (currentProfile?.avatar_url ? [currentProfile.avatar_url] : []);

    if (!isPrimaryAvatar && existingPhotos.length >= 6) {
      return NextResponse.json(
        { error: 'Maximum limit of 6 photos reached. Delete a photo to upload a new one.' },
        { status: 400 }
      );
    }

    let updatedPhotos: string[];
    if (isPrimaryAvatar) {
      updatedPhotos = [photoUrl, ...existingPhotos.filter((p: string) => p !== photoUrl)];
    } else {
      updatedPhotos = existingPhotos.includes(photoUrl)
        ? existingPhotos
        : [...existingPhotos, photoUrl];
    }

    const updatePayload: Record<string, any> = {
      photos: updatedPhotos,
    };

    // Sync per-photo AI classification map (pruned to surviving photos).
    const existingAi: Record<string, string> =
      currentProfile?.photo_ai_status && typeof currentProfile.photo_ai_status === 'object'
        ? currentProfile.photo_ai_status
        : {};
    const nextAi: Record<string, string> = {};
    for (const url of updatedPhotos) if (existingAi[url]) nextAi[url] = existingAi[url];
    nextAi[photoUrl] = aiStatus;
    updatePayload.photo_ai_status = nextAi;

    if (isPrimaryAvatar) {
      updatePayload.avatar_url = photoUrl;
      updatePayload.avatar_status = 'pending_review';
      updatePayload.photo_review_status = 'pending';
    }

    let { error: profileUpdateError } = await serviceClient
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);
    // photo_review_status arrives with 20261112_admin_console.sql; retry without it until then.
    if (profileUpdateError && /photo_review_status|photo_ai_status/.test(profileUpdateError.message)) {
      delete updatePayload.photo_review_status;
      ({ error: profileUpdateError } = await serviceClient.from('profiles').update(updatePayload).eq('id', userId));
    }

    if (profileUpdateError) {
      console.error('Profile update failed:', profileUpdateError);
      return NextResponse.json(
        { error: `Failed updating profile photos: ${profileUpdateError.message}` },
        { status: 500 }
      );
    }

    // Blur previews live in profiles.photo_placeholders (20261108_release_features.sql); optional.
    if (placeholder) {
      const { data: phRow, error: phReadErr } = await serviceClient
        .from('profiles')
        .select('photo_placeholders')
        .eq('id', userId)
        .maybeSingle();
      if (!phReadErr) {
        const current = (phRow?.photo_placeholders && typeof phRow.photo_placeholders === 'object' ? phRow.photo_placeholders : {}) as Record<string, string>;
        const next: Record<string, string> = {};
        for (const url of updatedPhotos) if (current[url]) next[url] = current[url];
        next[photoUrl] = placeholder;
        await serviceClient.from('profiles').update({ photo_placeholders: next }).eq('id', userId);
      }
    }

    // 8. Main photos wait in the admin review queue (/admin/photos) while avatar_status is pending_review.
    if (isPrimaryAvatar) {
      after(() => notifyAdmins({ kind: 'photo', ref: userId, actorId: userId }));
    }

    return NextResponse.json({
      success: true,
      photoUrl,
      photos: updatedPhotos,
      status: 'pending_review',
    });
  } catch (err: any) {
    console.error('Error in /api/photos/upload:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing photo' },
      { status: 500 }
    );
  }
}
