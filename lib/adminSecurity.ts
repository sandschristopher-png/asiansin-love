import crypto from 'crypto';

/**
 * Creates an HMAC signature for Telegram moderation links to prevent unauthorized approvals/rejections.
 */
export function generateAdminActionSignature(payload: string): string {
  const secret = process.env.TELEGRAM_BOT_TOKEN || 'fallback-secret-asiansinlove';
  return crypto.createHmac('sha256', secret).update(payload).digest('hex').substring(0, 32);
}

export function verifyAdminActionSignature(payload: string, providedSig: string | null): boolean {
  if (!providedSig) return false;
  const expectedSig = generateAdminActionSignature(payload);
  return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(providedSig));
}
