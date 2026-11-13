// app/api/messages/voice/route.ts
//   POST multipart { receiverId, audio, durationMs } -> sends a voice note (max 60 s)
//   GET  ?id=<messageId>                         -> short-lived signed URL for a participant
//
// Voice notes cannot be screened for phone numbers / handles, so they sit behind the same
// contact-reveal gate as text contact details: both members must have sent 3 substantive
// messages first.
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { evaluateSubstantiveConversation } from '@/lib/moderation';
import { CONTACT_UNLOCK_TURNS } from '@/lib/safety';
import { canSendVoiceNote, scoreOf } from '@/lib/reputation';
import { AUDIO_MIME_EXT, VOICE_NOTE_MAX_BYTES, VOICE_NOTE_MAX_MS, baseMime, sniffAudioMime } from '@/lib/audio';
import { sendPushToUser } from '@/lib/pushSender';

export const runtime = 'nodejs';

const BUCKET = 'voice-notes';
const SIGNED_URL_TTL_SECONDS = 10 * 60;
const VOICE_NOTE_LABEL = 'Voice note';

const isUUID = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

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

const unavailable = () =>
  NextResponse.json({ error: 'Voice notes are not available yet. Please try again later.' }, { status: 503 });

export async function POST(req: Request) {
  const senderId = await currentUserId();
  if (!senderId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const receiverId = form.get('receiverId');
  const audio = form.get('audio');
  const durationMs = Math.round(Number(form.get('durationMs')));
  if (!isUUID(receiverId) || receiverId === senderId) {
    return NextResponse.json({ error: 'Invalid recipient.' }, { status: 400 });
  }
  if (!audio || typeof audio === 'string' || audio.size === 0) {
    return NextResponse.json({ error: 'Missing recording.' }, { status: 400 });
  }
  if (!Number.isFinite(durationMs) || durationMs < 500 || durationMs > VOICE_NOTE_MAX_MS + 500) {
    return NextResponse.json({ error: `Voice notes can be up to ${VOICE_NOTE_MAX_MS / 1000} seconds.` }, { status: 400 });
  }
  if (audio.size > VOICE_NOTE_MAX_BYTES) {
    return NextResponse.json({ error: 'Recording is too large.' }, { status: 400 });
  }

  const admin = service();

  const { data: block } = await admin
    .from('user_blocks')
    .select('id')
    .or(`and(blocker_id.eq.${senderId},blocked_id.eq.${receiverId}),and(blocker_id.eq.${receiverId},blocked_id.eq.${senderId})`)
    .limit(1)
    .maybeSingle();
  if (block) return NextResponse.json({ error: 'You cannot message this member.' }, { status: 403 });

  // Members under review (reputation below 70) cannot send voice notes: audio can't be screened.
  const { data: senderProfile } = await admin
    .from('profiles')
    .select('reputation_score')
    .eq('id', senderId)
    .maybeSingle();
  if (!canSendVoiceNote(scoreOf(senderProfile?.reputation_score))) {
    return NextResponse.json(
      {
        error: 'Voice notes are paused while your account is under review. Text messages still work.',
        code: 'REPUTATION_VOICE_LOCKED',
      },
      { status: 403 }
    );
  }

  // Contact-reveal gate (same rule as text contact sharing in /api/messages)
  const { data: thread } = await admin
    .from('messages')
    .select('sender_id, content')
    .in('sender_id', [senderId, receiverId])
    .in('receiver_id', [senderId, receiverId])
    .eq('is_quarantined', false)
    .order('created_at', { ascending: false })
    .limit(40);
  const gate = evaluateSubstantiveConversation(thread || [], senderId, receiverId, 15, CONTACT_UNLOCK_TURNS);
  if (!gate.isUnlocked) {
    return NextResponse.json(
      {
        error: `Voice notes unlock after you both send ${CONTACT_UNLOCK_TURNS} messages (15+ characters). Progress: You (${gate.senderSubstantiveCount}/${CONTACT_UNLOCK_TURNS}) • Partner (${gate.receiverSubstantiveCount}/${CONTACT_UNLOCK_TURNS}).`,
        courtshipLocked: true,
      },
      { status: 403 }
    );
  }

  const buf = Buffer.from(await audio.arrayBuffer());
  const sniffed = sniffAudioMime(buf);
  if (!sniffed || sniffed !== baseMime(audio.type || sniffed)) {
    return NextResponse.json({ error: 'Unsupported audio format.' }, { status: 400 });
  }

  // voice-notes/{senderId}/{conversationId}_{timestamp}.{ext}: a conversation is keyed by the other
  // member's id (/chat/{id}); the short random suffix keeps same-millisecond sends distinct. The
  // sender-folder prefix is what GET checks before signing a URL.
  const path = `${senderId}/${receiverId}_${Date.now()}_${randomUUID().slice(0, 8)}.${AUDIO_MIME_EXT[sniffed]}`;
  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buf, { contentType: sniffed, upsert: false });
  if (upErr) {
    console.error('[voice-note] upload failed:', upErr.message);
    return /not found/i.test(upErr.message)
      ? unavailable()
      : NextResponse.json({ error: 'Could not send your voice note.' }, { status: 500 });
  }

  const { data: message, error: insErr } = await admin
    .from('messages')
    .insert([
      {
        sender_id: senderId,
        receiver_id: receiverId,
        content: VOICE_NOTE_LABEL,
        is_quarantined: false,
        audio_path: path,
        audio_duration_ms: Math.min(durationMs, VOICE_NOTE_MAX_MS),
      },
    ])
    .select('id, sender_id, receiver_id, content, created_at, is_read, audio_duration_ms')
    .single();

  if (insErr || !message) {
    await admin.storage.from(BUCKET).remove([path]).catch(() => {});
    console.error('[voice-note] insert failed:', insErr?.message);
    return /audio_path|audio_duration_ms/.test(insErr?.message || '')
      ? unavailable()
      : NextResponse.json({ error: 'Could not send your voice note.' }, { status: 500 });
  }

  try {
    const { data: sender } = await admin.from('profiles').select('username').eq('id', senderId).maybeSingle();
    await admin.from('notifications').insert({
      user_id: receiverId,
      actor_id: senderId,
      type: 'message',
      title: 'New Voice Note',
      description: (sender?.username || 'Someone') + ' sent you a voice note.',
      link_url: '/messages',
    });
    await sendPushToUser({
      userId: receiverId,
      type: 'message',
      conversationId: senderId,
      actorId: senderId,
      body: (sender?.username || 'Someone') + ' sent you a voice note.',
    }).catch(() => {});
  } catch {
    // Non-blocking notification dispatch
  }

  return NextResponse.json({ success: true, message });
}

export async function GET(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!isUUID(id)) return NextResponse.json({ error: 'Invalid message.' }, { status: 400 });

  const admin = service();
  const { data: msg } = await admin
    .from('messages')
    .select('sender_id, receiver_id, audio_path, is_quarantined')
    .eq('id', id)
    .maybeSingle();

  const isParticipant = msg && (msg.sender_id === userId || msg.receiver_id === userId);
  if (!msg || !isParticipant || !msg.audio_path) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  if (msg.is_quarantined && msg.sender_id !== userId) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  // The stored path must live in the sender's own folder.
  if (!String(msg.audio_path).startsWith(`${msg.sender_id}/`)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const { data: signed, error } = await admin.storage.from(BUCKET).createSignedUrl(msg.audio_path, SIGNED_URL_TTL_SECONDS);
  if (error || !signed?.signedUrl) return NextResponse.json({ error: 'Unavailable.' }, { status: 404 });
  return NextResponse.json({ url: signed.signedUrl });
}
