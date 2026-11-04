// app/api/announcements/route.ts  (signed-in members)
//   GET  -> { announcements, lastReadAt }  broadcasts, pinned first then newest
//   POST -> marks every broadcast read (profiles.last_read_announcements_at = now())
// Before 20261113_announcements.sql runs, GET returns an empty list and POST is a no-op.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { MISSING_BROADCASTS_RE } from '@/lib/broadcasts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function currentUserId(): Promise<string | null> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.getUser();
  return error || !data?.user ? null : data.user.id;
}

const service = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = service();
  const [{ data, error }, { data: me }] = await Promise.all([
    admin
      .from('announcements')
      .select('id, title, body, tag, is_pinned, published_at')
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(50),
    admin.from('profiles').select('*').eq('id', userId).maybeSingle(),
  ]);
  if (error) {
    if (MISSING_BROADCASTS_RE.test(error.message)) return NextResponse.json({ announcements: [], lastReadAt: null });
    return NextResponse.json({ error: 'Could not load announcements.' }, { status: 500 });
  }
  return NextResponse.json({ announcements: data ?? [], lastReadAt: me?.last_read_announcements_at ?? null });
}

export async function POST() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await service()
    .from('profiles')
    .update({ last_read_announcements_at: new Date().toISOString() })
    .eq('id', userId);
  if (error && !MISSING_BROADCASTS_RE.test(error.message)) {
    return NextResponse.json({ error: 'Could not update.' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
