// app/api/admin/verify/route.ts
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');
  const action = searchParams.get('action');

  if (!uid || !['approve', 'reject'].includes(action || '')) {
    return new Response('Invalid request parameters', { status: 400 });
  }

  const isApproved = action === 'approve';

  const { error } = await supabase
    .from('profiles')
    .update({
      is_verified: isApproved,
      verification_status: isApproved ? 'approved' : 'rejected',
      verified_at: isApproved ? new Date().toISOString() : null,
    })
    .eq('id', uid);

  if (error) {
    return new Response(`Database update failed: ${error.message}`, { status: 500 });
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Verification Updated</title>
      <style>
        body { font-family: -apple-system, sans-serif; background: #09090b; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #18181b; padding: 2rem; border-radius: 1rem; text-align: center; border: 1px solid #27272a; max-width: 90%; }
        .tag { display: inline-block; padding: 0.35rem 0.8rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem; }
        .approved { background: #064e3b; color: #34d399; }
        .rejected { background: #7f1d1d; color: #f87171; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="tag ${isApproved ? 'approved' : 'rejected'}">
          ${isApproved ? 'USER APPROVED' : 'USER REJECTED'}
        </span>
        <h2>Action Recorded</h2>
        <p style="color: #a1a1aa; font-size: 0.9rem;">User ID: <code>${uid}</code></p>
        <p style="color: #71717a; font-size: 0.8rem;">You may close this tab.</p>
      </div>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
