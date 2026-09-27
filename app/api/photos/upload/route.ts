import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramPhotoReviewAlert } from '@/lib/adminAlerts';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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

    // 2. Enforce multipart/form-data exclusively
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content type. Binary multipart/form-data file required.' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('photo') as File | null;
    const isPrimaryAvatar = formData.get('isPrimary') !== 'false';

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
    const filePath = `${userId}/primary-${Date.now()}.${safeExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Upload under authenticated caller context (satisfies RLS)
    const { error: uploadError } = await authenticatedClient.storage
      .from('photos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 6. Public URL resolution
    const { data: publicUrlData } = authenticatedClient.storage
      .from('photos')
      .getPublicUrl(filePath);

    const photoUrl = publicUrlData?.publicUrl;
    if (!photoUrl) {
      return NextResponse.json({ error: 'Failed to generate public photo URL' }, { status: 500 });
    }

    // 7. Update profile row
    if (isPrimaryAvatar) {
      const { error: profileUpdateError } = await authenticatedClient
        .from('profiles')
        .update({
          avatar_url: photoUrl,
          avatar_status: 'pending_review',
        })
        .eq('id', userId);

      if (profileUpdateError) {
        console.error('Profile update failed:', profileUpdateError);
        return NextResponse.json(
          { error: `Failed updating profile avatar: ${profileUpdateError.message}` },
          { status: 500 }
        );
      }
    }

    // 8. Telegram review alert
    const { data: profile } = await authenticatedClient
      .from('profiles')
      .select('gender, full_name')
      .eq('id', userId)
      .single();

    await sendTelegramPhotoReviewAlert({
      userId,
      userGender: profile?.gender || 'not_specified',
      photoUrl,
      photoId: `${userId}_${Date.now()}`,
      isPrimaryAvatar,
    }).catch((err) => {
      console.warn('Telegram alert skipped or failed:', err.message);
    });

    return NextResponse.json({
      success: true,
      photoUrl,
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
