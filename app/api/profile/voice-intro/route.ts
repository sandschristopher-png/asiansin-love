// app/api/profile/voice-intro/route.ts
//   POST   multipart { audio: Blob, durationMs } -> stores voice-intros/<userId>.<ext>, saves profiles.voice_intro_url
//   DELETE -> removes the intro
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import {
  AUDIO_MIME_EXT,
  VOICE_INTRO_MAX_BYTES,
  VOICE_INTRO_MAX_MS,
  VOICE_INTRO_MIN_MS,
  baseMime,
  sniffAudioMime,
} from '@/lib/audio';

export const runtime = 'nodejs';

const BUCKET = 'voice-intros';

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

async function currentUserId(): Promise<string | null> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.getUser();
  return error || !data?.user ? null : data.user.id;
}

const notReady = (msg: string) =>
  /bucket not found|not found/i.test(msg)
    ? NextResponse.json({ error: 'Voice intros are not available yet. Please try again later.' }, { status: 503 })
    : null;

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const audio = form.get('audio');
  const durationMs = Number(form.get('durationMs'));
  if (!audio || typeof audio === 'string') {
    return NextResponse.json({ error: 'Missing recording' }, { status: 400 });
  }
  if (!Number.isFinite(durationMs) || durationMs < VOICE_INTRO_MIN_MS - 250 || durationMs > VOICE_INTRO_MAX_MS + 500) {
    return NextResponse.json({ error: `Your voice intro must be ${VOICE_INTRO_MIN_MS / 1000} to ${VOICE_INTRO_MAX_MS / 1000} seconds long.` }, { status: 400 });
  }
  if (audio.size === 0 || audio.size > VOICE_INTRO_MAX_BYTES) {
    return NextResponse.json({ error: 'Recording is too large.' }, { status: 400 });
  }

  const buf = Buffer.from(await audio.arrayBuffer());
  const sniffed = sniffAudioMime(buf);
  if (!sniffed || sniffed !== baseMime(audio.type || sniffed)) {
    return NextResponse.json({ error: 'Unsupported audio format.' }, { status: 400 });
  }

  const admin = service();
  const path = `${userId}.${AUDIO_MIME_EXT[sniffed]}`;
  const other = `${userId}.${sniffed === 'audio/webm' ? 'm4a' : 'webm'}`;

  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buf, {
    contentType: sniffed,
    upsert: true,
    cacheControl: '3600',
  });
  if (upErr) {
    console.error('[voice-intro] upload failed:', upErr.message);
    return notReady(upErr.message) ?? NextResponse.json({ error: 'Could not save your voice intro.' }, { status: 500 });
  }
  // A previous recording in the other container would be orphaned otherwise.
  await admin.storage.from(BUCKET).remove([other]).catch(() => {});

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  const url = `${pub.publicUrl}?v=${Date.now()}`; // bust CDN cache on re-record

  const { error: dbErr } = await admin.from('profiles').update({ voice_intro_url: url }).eq('id', userId);
  if (dbErr) {
    console.error('[voice-intro] profile update failed:', dbErr.message);
    return NextResponse.json({ error: 'Could not save your voice intro.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, url });
}

export async function DELETE() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = service();
  await admin.storage.from(BUCKET).remove([`${userId}.webm`, `${userId}.m4a`]).catch(() => {});
  const { error } = await admin.from('profiles').update({ voice_intro_url: null }).eq('id', userId);
  if (error) return NextResponse.json({ error: 'Could not remove your voice intro.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
