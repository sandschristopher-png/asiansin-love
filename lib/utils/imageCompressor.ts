/**
 * Browser-side photo preprocessing before upload (profile edit + onboarding).
 *
 * - Downsamples in memory on a canvas to a 1440px max edge: keeps facial detail for the profile
 *   detail view while dropping most of a phone camera's 12-50 MP payload.
 * - Encodes WebP at 83% quality (~150-200 KB instead of multi-MB JPEGs on provincial 3G/LTE).
 * - Produces a tiny blurred preview (16px-wide WebP data URL, well under 1 KB) that is stored
 *   with the photo and painted while the real image streams in.
 *
 * Falls back to the original file when the browser cannot decode or encode (old WebViews).
 */

export const MAX_PHOTO_EDGE = 1440;
export const PHOTO_WEBP_QUALITY = 0.83;
const PLACEHOLDER_EDGE = 16;

export interface CompressedPhoto {
  file: File;
  /** data:image/webp;base64,... (or JPEG on browsers without WebP encoding); null on fallback. */
  placeholder: string | null;
  width: number;
  height: number;
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      // imageOrientation honours EXIF rotation from phone cameras.
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // fall through to <img> decode (HEIC on some Android builds, older WebViews)
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

function draw(source: CanvasImageSource, srcW: number, srcH: number, maxEdge: number): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  if (typeof document === 'undefined' || !file.type.startsWith('image/')) {
    return { file, placeholder: null, width: 0, height: 0 };
  }
  try {
    const source = await decode(file);
    const srcW = 'naturalWidth' in source ? source.naturalWidth : source.width;
    const srcH = 'naturalHeight' in source ? source.naturalHeight : source.height;

    const canvas = draw(source, srcW, srcH, MAX_PHOTO_EDGE);
    let blob = await canvasToBlob(canvas, 'image/webp', PHOTO_WEBP_QUALITY);
    let type = 'image/webp';
    if (!blob || blob.type !== 'image/webp') {
      // Safari < 14 silently returns PNG for unsupported types: use JPEG instead.
      blob = await canvasToBlob(canvas, 'image/jpeg', PHOTO_WEBP_QUALITY);
      type = 'image/jpeg';
    }

    const tiny = draw(canvas, canvas.width, canvas.height, PLACEHOLDER_EDGE);
    let placeholder = tiny.toDataURL('image/webp', 0.5);
    if (!placeholder.startsWith('data:image/webp')) placeholder = tiny.toDataURL('image/jpeg', 0.5);

    if ('close' in source) source.close();
    if (!blob || blob.size >= file.size) {
      // Already small (e.g. a pre-compressed WebP): keep the original bytes.
      return { file, placeholder, width: canvas.width, height: canvas.height };
    }

    const ext = type === 'image/webp' ? 'webp' : 'jpg';
    const name = (file.name.replace(/\.[^.]+$/, '') || 'photo') + '.' + ext;
    return {
      file: new File([blob], name, { type, lastModified: Date.now() }),
      placeholder,
      width: canvas.width,
      height: canvas.height,
    };
  } catch {
    return { file, placeholder: null, width: 0, height: 0 };
  }
}
