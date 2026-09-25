// lib/uploadAvatar.ts
import { supabase } from './supabaseClient';
import { compressProfileImage } from './imageUtils';

export interface UploadAvatarResponse {
  avatarUrl: string;
  status: 'pending_review' | 'approved';
}

export async function uploadAndProcessAvatar(
  userId: string,
  file: File
): Promise<UploadAvatarResponse> {
  // 1. Compress client-side to WebP under 200KB
  const compressedFile = await compressProfileImage(file);
  const filePath = `${userId}/${Date.now()}.webp`;

  // 2. Upload to Supabase 'avatars' bucket
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, compressedFile, {
      upsert: true,
      contentType: 'image/webp',
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 3. Obtain public URL
  const { data: publicData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const avatarUrl = publicData.publicUrl;

  // 4. Send through photo moderation pipeline (triggers your Telegram ping)
  const res = await fetch('/api/photos/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      photoUrl: avatarUrl,
      isPrimaryAvatar: true,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to submit photo for verification.');
  }

  const result = await res.json();

  return {
    avatarUrl,
    status: result.status,
  };
}
