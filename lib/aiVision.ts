// lib/aiVision.ts
import { GoogleGenAI } from '@google/genai';

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
      reason: 'AI review bypassed due to processing error; routed to manual Telegram backup.',
    };
  }
}
