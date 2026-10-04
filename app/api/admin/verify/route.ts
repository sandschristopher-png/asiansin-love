// app/api/admin/verify/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyAdminActionSignature } from '@/lib/adminSecurity';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    const action = searchParams.get('action');
    const sig = searchParams.get('sig');

    if (!uid || !action || !['approve', 'reject'].includes(action)) {
      return new NextResponse('Invalid verification request parameters.', { status: 400 });
    }

    // Verify HMAC signature
    const isValid = verifyAdminActionSignature(`verify:${uid}:${action}`, sig);
    if (!isValid) {
      return new NextResponse('Unauthorized: Invalid or missing moderation signature.', { status: 403 });
    }

    const isApprove = action === 'approve';

    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        verification_status: isApprove ? 'verified' : 'rejected',
        is_verified: isApprove,
        verified_at: isApprove ? new Date().toISOString() : null,
      })
      .eq('id', uid);

    if (profileErr) {
      return new NextResponse(`Database update error: ${profileErr.message}`, { status: 500 });
    }

    await supabase.from('notifications').insert({
      user_id: uid,
      type: 'verification',
      title: isApprove ? 'Identity Verified! ✅' : 'Verification Update',
      description: isApprove
        ? 'Your identity has been verified. The verified checkmark is now active on your profile.'
        : 'Your selfie verification could not be approved. Please submit a new photo following the instructions.',
      link_url: '/profile',
    });

    const statusColor = isApprove ? '#10B981' : '#EF4444';
    const statusText = isApprove ? 'Approved & Verified' : 'Rejected';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Verification Moderation</title>
          <style>
            body { background: #13141f; color: #fff; font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: #1e1f30; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; text-align: center; max-width: 400px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h2 { color: ${statusColor}; margin-top: 0; }
            p { color: #a1a1aa; font-size: 14px; word-break: break-all; }
            .badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; background: ${statusColor}22; color: ${statusColor}; font-weight: bold; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">${statusText}</div>
            <h2>Action Recorded</h2>
            <p>User <code>${uid}</code> has been set to <strong>${statusText}</strong>.</p>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err: any) {
    return new NextResponse(`Server error: ${err.message}`, { status: 500 });
  }
}
