import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';
import { getSigningSecret } from '@/lib/verify/token';
import { TOKEN_TTL_MS, type TriggerReason, pickPoses } from '@/lib/verify/stepUpRules';
import type { StepUpPose } from '@/lib/headPose';

/** Service-role client for the step-up routes (challenges and flags are written only by the server). */
export function stepUpDb(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---- Signed challenge (HMAC-SHA256) -------------------------------------------------------------------
export interface StepUpToken {
  /** member */
  u: string;
  /** one-time nonce (also the liveness_challenges row key) */
  n: string;
  /** the 3 poses, in order */
  p: StepUpPose[];
  r: TriggerReason;
  /** issued at (ms) */
  t: number;
  /** which pose frame the pre-screen inspects: sealed here so the client cannot know it in advance */
  x: number;
}

const DOMAIN = 'meetin-asia:step-up:v1.';

const mac = (body: string) => createHmac('sha256', getSigningSecret()).update(DOMAIN + body).digest('base64url');

export function newChallenge(userId: string, reason: TriggerReason): StepUpToken {
  return { u: userId, n: randomBytes(18).toString('base64url'), p: pickPoses(() => randomInt(0, 1_000_000) / 1_000_000), r: reason, t: Date.now(), x: randomInt(0, 3) };
}

export function signStepUp(payload: StepUpToken): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${mac(body)}`;
}

export function verifyStepUp(token: unknown): StepUpToken | null {
  if (typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  let expected: Buffer;
  try {
    expected = Buffer.from(mac(body));
  } catch {
    return null;
  }
  const given = Buffer.from(token.slice(dot + 1));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as StepUpToken;
    if (typeof p.u !== 'string' || typeof p.n !== 'string' || !Array.isArray(p.p) || p.p.length !== 3 || typeof p.t !== 'number' || ![0, 1, 2].includes(p.x)) return null;
    return p;
  } catch {
    return null;
  }
}

export const tokenExpired = (t: StepUpToken, now = Date.now()) => now - t.t > TOKEN_TTL_MS;

// ---- Pre-screen (same Gemini route as the /verify selfie review) ------------------------------------------
export interface StepUpReview {
  face_count: number;
  /** 0-100: the neutral frame is the same person as the reference photo */
  face_match_confidence: number;
  /** the pose frame is that same person */
  pose_same_person: boolean;
  /** the pose frame shows the head turned the requested way */
  pose_direction_ok: boolean;
  spoof_detected: boolean;
  summary: string;
}

const DIRECTION_TEXT: Record<StepUpPose, string> = {
  turn_left: "turned to the subject's own LEFT (their left cheek toward the camera is NOT required; just the head clearly rotated that way)",
  turn_right: "turned to the subject's own RIGHT",
  look_up: 'tilted up (chin raised, looking above the camera)',
  look_down: 'tilted down (chin lowered, looking below the camera)',
};

/**
 * IMAGE 1 neutral selfie, IMAGE 2 the frame captured on one requested pose, IMAGE 3 the reference photo
 * (the new primary photo for a swap, otherwise the current one). The images are raw camera frames, not
 * mirrored, so the subject's own left side appears on the RIGHT of the picture. Returns null on any error
 * so the caller routes the check to a person instead of trusting a default.
 */
export async function reviewStepUp(opts: {
  neutral: Buffer;
  poseFrame: Buffer;
  pose: StepUpPose;
  reference: { data: Buffer; mimeType: string } | null;
}): Promise<StepUpReview | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      {
        text: `You are pre-screening a liveness check for the dating platform Meet in Asia.
IMAGE 1 is a live selfie looking straight at the camera. IMAGE 2 is a frame from the same session where the member was asked to turn their head. ${
          opts.reference ? 'IMAGE 3 is the profile photo to compare against.' : 'No reference photo exists; set face_match_confidence to 0.'
        }
The images are raw camera frames and are NOT mirrored: the subject's own left side appears on the right of the picture.
Answer strictly:
- face_count: human faces clearly visible in IMAGE 1 (0 if none or covered).
- face_match_confidence: 0-100, that the face in IMAGE 1 is the same person as IMAGE 3.
- pose_same_person: is the person in IMAGE 2 the same person as in IMAGE 1?
- pose_direction_ok: in IMAGE 2 is the head ${DIRECTION_TEXT[opts.pose]}?
- spoof_detected: does either image look like a photo of a screen or print, a mask, a deepfake, or otherwise not a live camera?
- summary: one short sentence for a human reviewer.`,
      },
      { inlineData: { data: opts.neutral.toString('base64'), mimeType: 'image/jpeg' } },
      { inlineData: { data: opts.poseFrame.toString('base64'), mimeType: 'image/jpeg' } },
    ];
    if (opts.reference) parts.push({ inlineData: { data: opts.reference.data.toString('base64'), mimeType: opts.reference.mimeType } });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            face_count: { type: Type.INTEGER },
            face_match_confidence: { type: Type.INTEGER },
            pose_same_person: { type: Type.BOOLEAN },
            pose_direction_ok: { type: Type.BOOLEAN },
            spoof_detected: { type: Type.BOOLEAN },
            summary: { type: Type.STRING },
          },
          required: ['face_count', 'face_match_confidence', 'pose_same_person', 'pose_direction_ok', 'spoof_detected', 'summary'],
        },
      },
    });
    const parsed = JSON.parse(response.text || '{}');
    if (typeof parsed.pose_same_person !== 'boolean' || typeof parsed.pose_direction_ok !== 'boolean') return null;
    const conf = Math.round(Number(parsed.face_match_confidence));
    return {
      face_count: Number.isFinite(Number(parsed.face_count)) ? Math.max(0, Math.round(Number(parsed.face_count))) : 0,
      face_match_confidence: Number.isFinite(conf) ? Math.max(0, Math.min(100, conf)) : 0,
      pose_same_person: parsed.pose_same_person,
      pose_direction_ok: parsed.pose_direction_ok,
      spoof_detected: parsed.spoof_detected !== false,
      summary: String(parsed.summary || '').slice(0, 400),
    };
  } catch (err) {
    console.error('[step-up] pre-screen error:', err);
    return null;
  }
}

/** Pass: exactly one face, same person as the reference, the pose frame is that person turning the right way, no spoof. */
export function reviewPasses(r: StepUpReview, minConfidence: number): boolean {
  return r.face_count === 1 && r.face_match_confidence >= minConfidence && r.pose_same_person && r.pose_direction_ok && !r.spoof_detected;
}

// ---- Primary-photo swap clearance ---------------------------------------------------------------------
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export function imageMimeOf(b: Buffer): string | null {
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 12 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

/** Downloads one of the member's own stored photos (only our own Supabase storage host is fetched). */
export async function fetchOwnPhoto(url: string | null | undefined): Promise<{ data: Buffer; mimeType: string } | null> {
  if (!url) return null;
  try {
    const target = new URL(url);
    if (target.protocol !== 'https:' || target.host !== new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host) return null;
    const res = await fetch(target, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = Buffer.from(await res.arrayBuffer());
    const mimeType = imageMimeOf(data);
    return mimeType && data.length <= IMAGE_MAX_BYTES ? { data, mimeType } : null;
  } catch {
    return null;
  }
}

const SWAP_WINDOW_MS = 10 * 60 * 1000;
const missingTable = (e: { code?: string; message?: string } | null) =>
  Boolean(e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|schema cache/i.test(e.message ?? '')));

/**
 * May this exact photo become the member's primary photo? Needs a passed 'photo_swap' challenge of theirs,
 * finished in the last 10 minutes, not used yet, whose matched photo hash equals this file's hash (so the
 * photo that was face-matched is the photo that is saved). Before the migration is applied the table does
 * not exist, so nothing is enforced rather than every swap being blocked.
 */
export async function photoSwapCleared(db: SupabaseClient, userId: string, challengeId: unknown, sha256: string): Promise<boolean> {
  const probe = await db.from('liveness_challenges').select('id', { head: true, count: 'exact' }).limit(1);
  if (missingTable(probe.error)) return true;
  if (typeof challengeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(challengeId)) return false;
  const { data } = await db
    .from('liveness_challenges')
    .select('passed, trigger_reason, photo_sha256, consumed_at, completed_at')
    .eq('id', challengeId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!data || data.passed !== true || data.trigger_reason !== 'photo_swap' || data.consumed_at || data.photo_sha256 !== sha256) return false;
  return Date.now() - new Date(String(data.completed_at)).getTime() <= SWAP_WINDOW_MS;
}

export async function consumePhotoSwap(db: SupabaseClient, challengeId: unknown): Promise<void> {
  if (typeof challengeId !== 'string') return;
  await db.from('liveness_challenges').update({ consumed_at: new Date().toISOString() }).eq('id', challengeId);
}
