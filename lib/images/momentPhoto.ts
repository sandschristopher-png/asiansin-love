import { MAX_MOMENT_BYTES, MOMENT_MAX_WIDTH, MOMENT_QUALITY } from '@/lib/moments';

/**
 * Prepares a Moment photo in the browser before upload: honours the camera rotation, crops to the
 * feed's 4:5 portrait frame, scales to at most 1080 px wide and encodes WebP (JPEG where the
 * browser cannot) at quality 0.85, stepping the quality down if the file would still pass 5 MB.
 */
export async function prepareMomentPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    // Largest 4:5 window centred on the photo.
    let cropW = bitmap.width;
    let cropH = Math.round(cropW * 1.25);
    if (cropH > bitmap.height) {
      cropH = bitmap.height;
      cropW = Math.round(cropH * 0.8);
    }
    const sx = Math.round((bitmap.width - cropW) / 2);
    const sy = Math.round((bitmap.height - cropH) / 2);
    const outW = Math.min(MOMENT_MAX_WIDTH, cropW);
    const outH = Math.round(outW * 1.25);

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, sx, sy, cropW, cropH, 0, 0, outW, outH);

    const encode = (type: string, quality: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), type, quality));

    for (const quality of [MOMENT_QUALITY, 0.75, 0.65]) {
      const webp = await encode('image/webp', quality);
      const blob = webp && webp.type === 'image/webp' ? webp : await encode('image/jpeg', quality);
      if (blob && blob.size <= MAX_MOMENT_BYTES) return blob;
    }
    throw new Error('too_large');
  } finally {
    bitmap.close();
  }
}
