export type PoseId = 'chin' | 'palm' | 'peace' | 'three';

export interface VerificationPose {
  id: PoseId;
  label: string;
  image: string;
}

export const VERIFICATION_POSES: VerificationPose[] = [
  { id: 'chin', label: 'Chin rest', image: '/images/verification/pose-chin.png' },
  { id: 'palm', label: 'Palm up', image: '/images/verification/pose-palm.png' },
  { id: 'peace', label: 'Peace sign', image: '/images/verification/pose-peace.png' },
  { id: 'three', label: 'Three fingers', image: '/images/verification/pose-three.png' },
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