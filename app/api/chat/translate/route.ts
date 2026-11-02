// app/api/chat/translate/route.ts
//   POST { message_id, text, target_language? } -> { translation }
//
// 1-tap translation of an incoming chat message with Gemini Flash. Only a participant of the
// message can translate it, and the text is what that member already sees (masked contact
// details stay masked). Runs on Node: @google/genai is not supported on the edge runtime.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { translateChatMessage } from '@/lib/aiVision';

export const runtime = 'nodejs';

const MAX_CHARS = 2000;
const TIMEOUT_MS = 10000;
const RATE_LIMIT = 30; // per member per minute (best-effort, per server instance)

const isUUID = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const recent = new Map<string, number[]>();
function rateLimited(userId: string): boolean {
  const now = Date.now();
  const hits = (recent.get(userId) || []).filter((t) => now - t < 60_000);
  hits.push(now);
  recent.set(userId, hits);
  return hits.length > RATE_LIMIT;
}

export async function POST(req: Request) {
  const supabase = await createSessionClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = data.user.id;

  let body: { message_id?: unknown; text?: unknown; target_language?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!isUUID(body.message_id) || !text) {
    return NextResponse.json({ error: 'message_id and text are required.' }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: 'Message is too long to translate.' }, { status: 400 });
  }
  const rawTarget = typeof body.target_language === 'string' ? body.target_language.trim() : '';
  const targetLanguage = /^[\p{L} ()-]{2,40}$/u.test(rawTarget) ? rawTarget : 'English';

  if (rateLimited(userId)) {
    return NextResponse.json({ error: 'Too many translations. Try again in a minute.' }, { status: 429 });
  }

  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data: msg } = await service
    .from('messages')
    .select('sender_id, receiver_id, is_quarantined')
    .eq('id', body.message_id)
    .maybeSingle();
  if (!msg || (msg.sender_id !== userId && msg.receiver_id !== userId) || msg.is_quarantined) {
    return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
  }

  const translation = await Promise.race([
    translateChatMessage(text, targetLanguage),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
  ]);
  if (!translation) {
    return NextResponse.json({ error: 'Translation is unavailable right now.' }, { status: 503 });
  }

  return NextResponse.json({ translation, target_language: targetLanguage });
}
