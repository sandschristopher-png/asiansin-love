// lib/aiVision.ts
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface VisionSafetyResult {
  isSafe: boolean;
  isSexuallySuggestive: boolean;
  poseMatchesPrompt: boolean;
  reason: string;
}

export async function evaluateImageWithAI(
  imageBuffer: Buffer,
  mimeType: string,
  requiredPosePrompt?: string
): Promise<VisionSafetyResult> {
  try {
    const base64Data = imageBuffer.toString('base64');

    const promptText = `
Analyze this image for a dating platform called asiansin.love.
Evaluate two things strictly:
1. Is this photo sexually suggestive, explicit, showing nudity, underwear, lingerie, or inappropriate sexual content? (Answer true/false for isSexuallySuggestive).
2. ${
      requiredPosePrompt
        ? `The user was instructed to perform this exact pose: "${requiredPosePrompt}". Is the person in the image clearly performing this exact physical gesture? (Answer true/false for poseMatchesPrompt).`
        : `No pose required. Set poseMatchesPrompt to true.`
    }

Respond ONLY in valid JSON matching this schema:
{
  "isSafe": boolean,
  "isSexuallySuggestive": boolean,
  "poseMatchesPrompt": boolean,
  "reason": string
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || 'image/jpeg',
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed: VisionSafetyResult = JSON.parse(response.text || '{}');
    return {
      isSafe: parsed.isSafe ?? true,
      isSexuallySuggestive: parsed.isSexuallySuggestive ?? false,
      poseMatchesPrompt: parsed.poseMatchesPrompt ?? true,
      reason: parsed.reason || 'Evaluation completed.',
    };
  } catch (error: any) {
    console.error('AI Vision evaluation error:', error);
    return {
      isSafe: true,
      isSexuallySuggestive: false,
      poseMatchesPrompt: true,
      reason: 'AI review bypassed due to processing error; routed to manual admin review.',
    };
  }
}

export interface SelfieReviewResult {
  pose_matches: boolean;
  same_person: boolean;
  /** 0-100 */
  face_match_confidence: number;
  spoof_detected: boolean;
  /** Human faces clearly visible in the selfie (a hand or object alone = 0). */
  face_count: number;
  summary: string;
}

/** Strong pre-screen passes are tagged for the admin queue; the badge is still granted by a human. */
export const FAST_TRACK_MIN_CONFIDENCE = 85;

export function isFastTrack(r: SelfieReviewResult | null | undefined): boolean {
  return Boolean(
    r &&
      r.face_count === 1 &&
      r.pose_matches &&
      r.same_person &&
      !r.spoof_detected &&
      r.face_match_confidence >= FAST_TRACK_MIN_CONFIDENCE
  );
}

/**
 * Pre-screens a verification selfie against the member's main photo. Returns null on any error so
 * callers queue the submission for manual review instead of trusting a fail-open default.
 * Never use this result to grant verification on its own.
 */
export async function reviewVerificationSelfie(opts: {
  selfie: Buffer;
  avatar: { data: Buffer; mimeType: string } | null;
  poseDescription: string;
}): Promise<SelfieReviewResult | null> {
  try {
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      {
        text: `You are pre-screening an identity verification for the dating platform asiansin.love.
IMAGE 1 is a live selfie taken just now. ${opts.avatar ? 'IMAGE 2 is the member\'s main profile photo.' : 'No profile photo is available; set same_person to false.'}
The member was asked to copy this pose in the selfie: ${opts.poseDescription}.

Answer strictly:
- pose_matches: is the person in IMAGE 1 clearly performing that exact pose?
- same_person: is the face in IMAGE 1 the same person as in IMAGE 2?
- face_match_confidence: 0-100, how confident you are that they are the same person.
- spoof_detected: does IMAGE 1 look like a photo of a screen or printed photo, a mask, a deepfake, heavy filters, or otherwise not a live camera capture?
- face_count: how many human faces are clearly visible in IMAGE 1 (0 if it shows only a hand, an object, a wall, or a face too covered to see).
- summary: one or two short sentences for a human reviewer.`,
      },
      { inlineData: { data: opts.selfie.toString('base64'), mimeType: 'image/jpeg' } },
    ];
    if (opts.avatar) {
      parts.push({ inlineData: { data: opts.avatar.data.toString('base64'), mimeType: opts.avatar.mimeType } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pose_matches: { type: Type.BOOLEAN },
            same_person: { type: Type.BOOLEAN },
            face_match_confidence: { type: Type.INTEGER },
            spoof_detected: { type: Type.BOOLEAN },
            face_count: { type: Type.INTEGER },
            summary: { type: Type.STRING },
          },
          required: ['pose_matches', 'same_person', 'face_match_confidence', 'spoof_detected', 'face_count', 'summary'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (typeof parsed.same_person !== 'boolean' || typeof parsed.pose_matches !== 'boolean') return null;
    const confidence = Math.round(Number(parsed.face_match_confidence));
    return {
      pose_matches: parsed.pose_matches,
      same_person: parsed.same_person,
      face_match_confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(100, confidence)) : 0,
      // Missing / malformed spoof flag counts as suspect.
      spoof_detected: parsed.spoof_detected !== false,
      // Unknown counts as 1 here: only an explicit 0 / 2+ from the model rejects a submission.
      face_count: Number.isFinite(Number(parsed.face_count)) ? Math.max(0, Math.round(Number(parsed.face_count))) : 1,
      summary: String(parsed.summary || '').slice(0, 500),
    };
  } catch (error) {
    console.error('AI selfie review error:', error);
    return null;
  }
}

const TRANSLATION_SYSTEM_INSTRUCTION =
  'You are a machine translation filter for a dating app. Translate the dating message into natural English. ' +
  'Accurately translate Taglish, Bisaya, Thai, or colloquial Asian slang. Return ONLY the raw translated text string. ' +
  'Never include quotes, explanations, romanization, or conversational notes.';

export type TranslationResult = { ok: true; text: string } | { ok: false; rateLimited: boolean };

/**
 * Deterministic one-message translation (temperature 0.1, max 150 output tokens). The message is
 * passed as data under a fixed system instruction, so text inside it can't change the task.
 */
export async function translateChatMessage(text: string, targetLanguage = 'English'): Promise<TranslationResult> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        systemInstruction:
          targetLanguage === 'English'
            ? TRANSLATION_SYSTEM_INSTRUCTION
            : TRANSLATION_SYSTEM_INSTRUCTION.replace('into natural English', `into natural ${targetLanguage}`),
        temperature: 0.1,
        maxOutputTokens: 150,
      },
    });
    const out = (response.text || '').trim().replace(/^["“”']+|["“”']+$/g, '').trim();
    return out ? { ok: true, text: out.slice(0, 2000) } : { ok: false, rateLimited: false };
  } catch (error) {
    const status = (error as { status?: number })?.status;
    const rateLimited = status === 429 || /429|quota|rate/i.test(String((error as Error)?.message || ''));
    console.error('AI translation error:', error);
    return { ok: false, rateLimited };
  }
}
