// app/api/admin/verify/route.ts
// Telegram "Approve / Reject identity" links.
//   GET  -> confirmation page only (no side effects, so link previews are harmless)
//   POST -> performs the action using the service role
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  verifyAdminAction,
  isUuid,
  escapeHtml,
  MODERATION_PAGE_HEADERS,
} from '@/lib/adminSecurity';

export const runtime = 'nodejs';

type Params = { uid: string | null; action: string | null; ts: string | null; sig: string | null };

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
  button{background:#6555B8;color:#fff;border:0;border-radius:12px;padding:12px 22px;font-weight:600;font-size:14px;cursor:pointer}
  button.reject{background:#C0392B}
</style></head><body><div class="card">${body}</div></body></html>`;
  return new NextResponse(html, { status, headers: MODERATION_PAGE_HEADERS });
}

function validate(p: Params): { ok: true; uid: string; action: 'approve' | 'reject' } | { ok: false; res: NextResponse } {
  if (!isUuid(p.uid) || (p.action !== 'approve' && p.action !== 'reject')) {
    return { ok: false, res: page('Invalid request', '<h2>Invalid request</h2>', 400) };
  }
  if (!verifyAdminAction(`verify:${p.uid}:${p.action}`, p.ts, p.sig)) {
    return {
      ok: false,
      res: page(
        'Link not valid',
        '<h2>Link expired or invalid</h2><p>Open the newest Telegram message for this user, or review them from the admin dashboard.</p>',
        403
      ),
    };
  }
  return { ok: true, uid: p.uid, action: p.action };
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const p: Params = { uid: sp.get('uid'), action: sp.get('action'), ts: sp.get('ts'), sig: sp.get('sig') };
  const v = validate(p);
  if (!v.ok) return v.res;

  const approve = v.action === 'approve';
  return page(
    'Confirm verification decision',
    `<h2>${approve ? 'Approve' : 'Reject'} identity verification?</h2>
     <p>User <code>${escapeHtml(v.uid)}</code></p>
     <form method="POST" action="/api/admin/verify">
       <input type="hidden" name="uid" value="${escapeHtml(v.uid)}"/>
       <input type="hidden" name="action" value="${v.action}"/>
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
    const p: Params = { uid: str('uid'), action: str('action'), ts: str('ts'), sig: str('sig') };
    const v = validate(p);
    if (!v.ok) return v.res;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return page('Server error', '<h2>Server is not configured</h2>', 500);
    const admin = createClient(url, key, { auth: { persistSession: false } });

    const approve = v.action === 'approve';

    const { data: current } = await admin
      .from('profiles')
      .select('verification_status')
      .eq('id', v.uid)
      .maybeSingle();

    if (!current) return page('Not found', '<h2>User not found</h2>', 404);

    const target = approve ? 'verified' : 'rejected';
    if (current.verification_status === target) {
      return page('Already done', `<h2>Already ${target}</h2><p>No changes were made.</p>`);
    }

    const { error: profileErr } = await admin
      .from('profiles')
      .update({
        verification_status: target,
        is_verified: approve,
        verified_at: approve ? new Date().toISOString() : null,
      })
      .eq('id', v.uid);

    if (profileErr) {
      console.error('[admin/verify] update failed:', profileErr.message);
      return page('Update failed', '<h2>Database update failed</h2><p>Nothing was changed. Try again.</p>', 500);
    }

    const { error: notifErr } = await admin.from('notifications').insert({
      user_id: v.uid,
      type: 'verification',
      title: approve ? 'Identity Verified! ✅' : 'Verification Update',
      description: approve
        ? 'Your identity has been verified. The verified checkmark is now active on your profile.'
        : 'Your selfie verification could not be approved. Please submit a new photo following the instructions.',
      link_url: '/profile',
    });
    if (notifErr) console.warn('[admin/verify] notification insert failed:', notifErr.message);

    return page(
      'Done',
      `<h2 style="color:${approve ? '#10B981' : '#EF4444'}">${approve ? 'Approved & verified' : 'Rejected'}</h2>
       <p>User <code>${escapeHtml(v.uid)}</code> is now <strong>${target}</strong>.</p>`
    );
  } catch (err) {
    console.error('[admin/verify] error:', err);
    return page('Server error', '<h2>Server error</h2>', 500);
  }
}
