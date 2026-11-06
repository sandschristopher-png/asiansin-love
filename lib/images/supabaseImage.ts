/**
 * Supabase Storage image transformations (Pro plan): rewrites a public object URL
 *   https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
 * to the edge render endpoint
 *   https://<ref>.supabase.co/storage/v1/render/image/public/<bucket>/<path>?width=480&height=640&quality=75&resize=cover
 * so cards download a ~40-80 KB resized image instead of the multi-megabyte original.
 *
 * No `format` parameter on purpose: Supabase then serves WebP automatically to browsers that
 * accept it. (`format=origin` would force the original JPEG/PNG and skip WebP.)
 *
 * Anything else (local /public assets, other hosts, data URLs, URLs already on /render/) is
 * returned unchanged; empty input falls back to the placeholder avatar.
 */

export const PLACEHOLDER_AVATAR = '/placeholder-avatar.svg';

const OBJECT_PATH = '/storage/v1/object/public/';
const RENDER_PATH = '/storage/v1/render/image/public/';

export interface EdgeImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
}

/** Card defaults: 3:4 at 480x640, quality 75, center crop. */
export const CARD_IMAGE: Required<EdgeImageOptions> = { width: 480, height: 640, quality: 75, resize: 'cover' };
/** Round avatars up to ~48px (96px covers 2x screens; one size so the browser caches it once). */
export const AVATAR_IMAGE: Required<EdgeImageOptions> = { width: 96, height: 96, quality: 75, resize: 'cover' };
/** Larger round avatars (~80px, mutual Spark modal). */
export const AVATAR_LG_IMAGE: Required<EdgeImageOptions> = { width: 160, height: 160, quality: 75, resize: 'cover' };
/** Small 3:4 photo tiles (profile thumbnails, Edit Profile photo grid). */
export const TILE_IMAGE: Required<EdgeImageOptions> = { width: 320, height: 427, quality: 70, resize: 'cover' };
/** Profile detail hero: 4:5 at 1080x1350 for full-width phones. */
export const DETAIL_IMAGE: Required<EdgeImageOptions> = { width: 1080, height: 1350, quality: 75, resize: 'cover' };

export function isEdgeTransformUrl(src: string | null | undefined): boolean {
  return typeof src === 'string' && src.includes(RENDER_PATH);
}

/** Alias used by the release spec; same behavior as supabaseImage (no `format`, so WebP). */
export function getOptimizedImageUrl(src: string | null | undefined, opts: EdgeImageOptions = CARD_IMAGE): string {
  return supabaseImage(src, opts);
}

export function supabaseImage(src: string | null | undefined, opts: EdgeImageOptions = CARD_IMAGE): string {
  if (!src || !src.trim()) return PLACEHOLDER_AVATAR;
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src; // relative / local asset
  }
  if (!url.hostname.endsWith('.supabase.co') || !url.pathname.startsWith(OBJECT_PATH)) return src;

  url.pathname = RENDER_PATH + url.pathname.slice(OBJECT_PATH.length);
  const { width, height, quality, resize } = { ...CARD_IMAGE, ...opts };
  url.searchParams.set('width', String(width));
  url.searchParams.set('height', String(height));
  url.searchParams.set('quality', String(quality));
  url.searchParams.set('resize', resize);
  return url.toString();
}
