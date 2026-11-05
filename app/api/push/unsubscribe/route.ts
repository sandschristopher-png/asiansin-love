import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSessionClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // Shared server client: writes refreshed auth cookies back (a no-op setAll would consume the
    // rotating refresh token without saving its replacement and sign the member out).
    const supabase = await createSessionClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('[Push] Failed to delete subscription:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}