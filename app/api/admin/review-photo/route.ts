// app/api/admin/review-photo/route.ts
// Telegram "Approve / Reject photo" links.
//   GET  -> confirmation page only (no side effects)
//   POST -> applies the decision with the service role
//
// Main avatar : sets avatar_status approved / rejected.
// Gallery     : gallery photos are live on upload, so Reject removes the photo
//               from profiles.photos (and deletes the stored file).
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  verifyAdminAction,
  isUuid,
  escapeHtml,
  MODERATION_PAGE_HEADERS,
} from '@/lib/adminSecurity';

export const runtime = 'nodejs';

type Params = {
  uid: string | null;
  photoId: string | null;
  action: string | null;
  isPrimary: string | null;
  u: string | null;
  ts: string | null;
  sig: string | null;
};

function page(title: string, body: string, status = 200) {
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex,nofollow"/>
<title>${escapeHtml(title)}</title>
<style>
  body{background:#F8F7FA;color:#1C1924;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px}
  .card{background:#fff;border:1px solid #E5DFEE;border-radius:16px;padding:28px;text-align:center;max-width:420px;width:100%}
  h2{margin-top:0} p{color:#6C637B;font-size:14px;word-break:break-all}
  img{max-width:100%;max-height:260px;border-radius:12px;margin-bottom:12px}
  button{background:#6555B8;color:#fff;border:0;border-radius:12px;padding:12px 22px;font-weight:600;font-size:14px;cursor:pointer}
  button.reject{background:#C0392B}
</style></head><body><div class="card">${body}</div></body></html>`;
  return new NextResponse(html, { status, headers: MODERATION_PAGE_HEADERS });
}

function validate(
  p: Params
):
  | { ok: true; uid: string; photoId: string; action: 'approve' | 'reject'; isPrimary: boolean; photoUrl: string }
  | { ok: false; res: NextResponse } {
  const photoId = p.photoId || '';
  const photoUrl = p.u || '';
  if (
    !isUuid(p.uid) ||
    (p.action !== 'approve' && p.action !== 'reject') ||
    (p.isPrimary !== 'true' && p.isPrimary !== 'false') ||
    !photoId ||
    photoId.length > 100 ||
    !photoUrl
  ) {
    return { ok: false, res: page('Invalid request', '<h2>Invalid request</h2>', 400) };
  }
  const isPrimary = p.isPrimary === 'true';
  if (
    !verifyAdminAction(
      `photo:${p.uid}:${photoId}:${p.action}:${isPrimary}:${photoUrl}`,
      p.ts,
      p.sig
    )
  ) {
    return {
      ok: false,
      res: page(
        'Link not valid',
        '<h2>Link expired or invalid</h2><p>Open the newest Telegram message for this photo.</p>',
        403
      ),
    };
  }
  // Defence in depth: the signed URL must be inside this user's own storage folder.
  let pathname = '';
  try {
    pathname = decodeURIComponent(new URL(photoUrl).pathname);
  } catch {
    return { ok: false, res: page('Invalid request', '<h2>Invalid photo URL</h2>', 400) };
  }
  if (!pathname.includes(`/user_photos/${p.uid}/`)) {
    return { ok: false, res: page('Invalid request', '<h2>Photo does not belong to this user</h2>', 400) };
  }
  return { ok: true, uid: p.uid, photoId, action: p.action, isPrimary, photoUrl };
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const p: Params = {
    uid: sp.get('uid'),
    photoId: sp.get('photoId'),
    action: sp.get('action'),
    isPrimary: sp.get('isPrimary'),
    u: sp.get('u'),
    ts: sp.get('ts'),
    sig: sp.get('sig'),
  };
  const v = validate(p);
  if (!v.ok) return v.res;

  const approve = v.action === 'approve';
  return page(
    'Confirm photo decision',
    `<img src="${escapeHtml(v.photoUrl)}" alt="Photo under review"/>
     <h2>${approve ? 'Approve' : 'Reject'} this ${v.isPrimary ? 'main photo' : 'gallery photo'}?</h2>
     <p>User <code>${escapeHtml(v.uid)}</code></p>
     <form method="POST" action="/api/admin/review-photo">
       <input type="hidden" name="uid" value="${escapeHtml(v.uid)}"/>
       <input type="hidden" name="photoId" value="${escapeHtml(v.photoId)}"/>
       <input type="hidden" name="action" value="${v.action}"/>
       <input type="hidden" name="isPrimary" value="${v.isPrimary}"/>
       <input type="hidden" name="u" value="${escapeHtml(v.photoUrl)}"/>
       <input type="hidden" name="ts" value="${escapeHtml(p.ts || '')}"/>
       <input type="hidden" name="sig" value="${escapeHtml(p.sig || '')}"/>
       <button type="submit" class="${approve ? '' : 'reject'}">${approve ? 'Yes, approve' : 'Yes, reject'}</button>
     </form>`
  );
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const str = (k: string) => {
      const x = form.get(k);
      return typeof x === 'string' ? x : null;
    };
    const p: Params = {
      uid: str('uid'),
      photoId: str('photoId'),
      action: str('action'),
      isPrimary: str('isPrimary'),
      u: str('u'),
      ts: str('ts'),
      sig: str('sig'),
    };
    const v = validate(p);
    if (!v.ok) return v.res;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return page('Server error', '<h2>Server is not configured</h2>', 500);
    const admin = createClient(url, key, { auth: { persistSession: false } });

    const approve = v.action === 'approve';

    if (v.isPrimary) {
      const { data, error } = await admin
        .from('profiles')
        .update({
          avatar_status: approve ? 'approved' : 'rejected',
          avatar_approved_at: approve ? new Date().toISOString() : null,
        })
        .eq('id', v.uid)
        .select('id');

      if (error) {
        console.error('[admin/review-photo] update failed:', error.message);
        return page('Update failed', '<h2>Database update failed</h2><p>Nothing was changed.</p>', 500);
      }
      if (!data || data.length === 0) {
        return page('Not found', '<h2>User not found</h2><p>Nothing was changed.</p>', 404);
      }
    } else if (!approve) {
      // Gallery reject: remove the photo from the profile and storage.
      const { data: prof, error: readErr } = await admin
        .from('profiles')
        .select('photos')
        .eq('id', v.uid)
        .maybeSingle();
      if (readErr || !prof) {
        return page('Not found', '<h2>User not found</h2><p>Nothing was changed.</p>', 404);
      }
      const photos: string[] = Array.isArray(prof.photos) ? prof.photos : [];
      const remaining = photos.filter((x) => x !== v.photoUrl);
      if (remaining.length !== photos.length) {
        const { error: updErr } = await admin.from('profiles').update({ photos: remaining }).eq('id', v.uid);
        if (updErr) {
          console.error('[admin/review-photo] photos update failed:', updErr.message);
          return page('Update failed', '<h2>Database update failed</h2>', 500);
        }
      }
      try {
        const marker = '/user_photos/';
        const idx = decodeURIComponent(new URL(v.photoUrl).pathname).indexOf(marker);
        if (idx >= 0) {
          const objectPath = decodeURIComponent(new URL(v.photoUrl).pathname).slice(idx + marker.length);
          await admin.storage.from('user_photos').remove([objectPath]);
        }
      } catch (e) {
        console.warn('[admin/review-photo] storage cleanup skipped:', e);
      }
    }

    return page(
      'Done',
      `<h2 style="color:${approve ? '#10B981' : '#EF4444'}">${approve ? 'Photo approved' : 'Photo rejected'}</h2>
       <p>User <code>${escapeHtml(v.uid)}</code></p>`
    );
  } catch (err) {
    console.error('[admin/review-photo] error:', err);
    return page('Server error', '<h2>Server error</h2>', 500);
  }
}
