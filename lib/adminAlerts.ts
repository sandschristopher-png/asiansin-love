// lib/adminAlerts.ts
import { signAdminAction } from './adminSecurity';

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://asiansin.love' : 'http://localhost:3000')
  ).replace(/\/$/, '');
}

function verifyLink(userId: string, action: 'approve' | 'reject'): string {
  const { ts, sig } = signAdminAction(`verify:${userId}:${action}`);
  const q = new URLSearchParams({ uid: userId, action, ts, sig });
  return `${siteUrl()}/api/admin/verify?${q.toString()}`;
}

function photoLink(
  userId: string,
  photoId: string,
  photoUrl: string,
  action: 'approve' | 'reject',
  isPrimary: boolean
): string {
  const { ts, sig } = signAdminAction(
    `photo:${userId}:${photoId}:${action}:${isPrimary}:${photoUrl}`
  );
  const q = new URLSearchParams({
    uid: userId,
    photoId,
    action,
    isPrimary: String(isPrimary),
    u: photoUrl,
    ts,
    sig,
  });
  return `${siteUrl()}/api/admin/review-photo?${q.toString()}`;
}

export async function sendTelegramVerificationAlert({
  userId,
  poseRequested,
  selfieUrl,
  extraSelfieUrls = [],
  avatarUrl,
  aiVerdict,
}: {
  userId: string;
  poseRequested: string;
  selfieUrl: string;
  extraSelfieUrls?: string[];
  avatarUrl: string;
  aiVerdict?: {
    isSafe: boolean;
    poseMatchesPrompt: boolean;
    reason: string;
  };
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ADMIN_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram credentials missing in environment variables.');
    return;
  }

  const extras = extraSelfieUrls.map((u, i) => `\n👉 [View Capture ${i + 2}](${u})`).join('');
  const caption = 
`🛡️ *New Identity Gesture Verification*
*User ID:* \`${userId}\`
*Requested Poses:* ${poseRequested}
${aiVerdict ? `\n🤖 *Gemini AI Pre-Check (hint only):*\n• Pose Match: ${aiVerdict.poseMatchesPrompt ? '✅ Yes' : '⚠️ Unconfirmed'}\n• Content Safe: ${aiVerdict.isSafe ? '✅ Safe' : '⚠️ Flagged'}\n• Note: _${aiVerdict.reason}_\n` : ''}

👉 [View Profile Avatar](${avatarUrl})
👉 [View Live Selfie Capture](${selfieUrl})${extras}

Compare the live captures with the profile photos before approving.`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: caption,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Approve Identity', url: verifyLink(userId, 'approve') },
              { text: '❌ Reject Identity', url: verifyLink(userId, 'reject') },
            ],
          ],
        },
      }),
    });
  } catch (err) {
    console.error('Failed to dispatch Telegram alert:', err);
  }
}

export async function sendTelegramPhotoReviewAlert({
  userId,
  userGender,
  photoUrl,
  photoId,
  isPrimaryAvatar = true,
}: {
  userId: string;
  userGender?: string;
  photoUrl: string;
  photoId: string;
  isPrimaryAvatar?: boolean;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ADMIN_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram credentials missing in environment variables.');
    return;
  }

  const typeLabel = isPrimaryAvatar ? 'Main Avatar' : 'Gallery Photo';
  const caption = `📸 *New Photo Submission (${typeLabel})*\n*User ID:* \`${userId}\`\n*Gender:* ${userGender || 'female'}\n\nPlease inspect for inappropriate attire, solicitation watermarks, or violations.${isPrimaryAvatar ? '' : '\n\nGallery photos are live immediately - Reject removes it from the profile.'}`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Approve Photo',
                url: photoLink(userId, photoId, photoUrl, 'approve', isPrimaryAvatar),
              },
              {
                text: '❌ Reject Photo',
                url: photoLink(userId, photoId, photoUrl, 'reject', isPrimaryAvatar),
              },
            ],
          ],
        },
      }),
    });
  } catch (err) {
    console.error('Failed to dispatch photo review to Telegram:', err);
  }
}
