/** Face-only liveness poses. Ids must match POSE_POOL in lib/verify/token.ts. */
export type PoseId = 'blink' | 'turn_left' | 'turn_right' | 'smile';

export interface VerificationPose {
  id: PoseId;
  label: string;
  instruction: string;
  /** Frontal poses are used for the 1:1 avatar face match. */
  frontal: boolean;
}

export const VERIFICATION_POSES: VerificationPose[] = [
  { id: 'blink', label: 'Blink', instruction: 'Look at the camera and blink both eyes once.', frontal: true },
  { id: 'turn_left', label: 'Turn head left', instruction: 'Slowly turn your head to your left and hold.', frontal: false },
  { id: 'turn_right', label: 'Turn head right', instruction: 'Slowly turn your head to your right and hold.', frontal: false },
  { id: 'smile', label: 'Smile', instruction: 'Give the camera a big smile and hold it.', frontal: true },
];

export function getPoseById(id: string): VerificationPose | null {
  return VERIFICATION_POSES.find((p) => p.id === id) ?? null;
}

export interface CompressionResult {
  valid: boolean;
  error?: string;
  blob?: Blob;
  previewUrl?: string;
  brightness?: number;
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

export async function validateAndCompressVerificationImage(
  file: File
): Promise<CompressionResult> {
  if (!ALLOWED_MIME.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, or WebP images are supported.' };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'Photo must be under 10MB.' };
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    return { valid: false, error: 'Photo could not be read. Please try again.' };
  }
  const MAX_DIM = 1280;
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { valid: false, error: 'Photo could not be processed.' };
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  // Sample brightness (every 10th pixel) to gate obviously unusable photos
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let total = 0;
  let samples = 0;
  for (let i = 0; i < data.length; i += 40) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    samples++;
  }
  const brightness = samples > 0 ? total / samples : 0;
  if (brightness < 40) {
    return { valid: false, error: 'Photo is too dark. Move somewhere with better lighting.' };
  }
  if (brightness > 235) {
    return { valid: false, error: 'Photo is overexposed. Try again in softer light.' };
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85)
  );
  if (!blob) {
    return { valid: false, error: 'Photo could not be compressed. Please try again.' };
  }
  return { valid: true, blob, previewUrl: URL.createObjectURL(blob), brightness };
}

export function generatePoseSequence(): PoseId[] {
  const ids = VERIFICATION_POSES.map((p) => p.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}