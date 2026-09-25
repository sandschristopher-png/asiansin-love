// lib/adminAlerts.ts

export async function sendTelegramVerificationAlert({
  userId,
  poseRequested,
  selfieUrl,
  avatarUrl,
}: {
  userId: string;
  poseRequested: string;
  selfieUrl: string;
  avatarUrl: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ADMIN_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram credentials missing in environment variables.');
    return;
  }

  const caption = 
`🛡️ *New Identity Gesture Verification*
*User ID:* \`${userId}\`
*Requested Pose:* ${poseRequested}

👉 [View Profile Avatar](${avatarUrl})
👉 [View Live Selfie Capture](${selfieUrl})`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
              { 
                text: '✅ Approve Identity', 
                url: `${baseUrl}/api/admin/verify?uid=${userId}&action=approve` 
              },
              { 
                text: '❌ Reject Identity', 
                url: `${baseUrl}/api/admin/verify?uid=${userId}&action=reject` 
              },
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const typeLabel = isPrimaryAvatar ? 'Main Avatar' : 'Gallery Photo';
  const caption = `📸 *New Photo Submission (${typeLabel})*\n*User ID:* \`${userId}\`\n*Gender:* ${userGender || 'female'}\n\nPlease inspect for inappropriate attire, solicitation watermarks, or violations.`;

  try {
    // Send photo directly to Telegram chat
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
                url: `${baseUrl}/api/admin/review-photo?photoId=${photoId}&uid=${userId}&action=approve&isPrimary=${isPrimaryAvatar}`,
              },
              {
                text: '❌ Reject Photo',
                url: `${baseUrl}/api/admin/review-photo?photoId=${photoId}&uid=${userId}&action=reject&isPrimary=${isPrimaryAvatar}`,
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
