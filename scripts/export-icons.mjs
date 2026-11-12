// Exports every app icon from the real Plus Jakarta Sans glyph outline of "M".
//   node scripts/export-icons.mjs
//
// The "M" is read straight from scripts/fonts/PlusJakartaSans-ExtraBold.ttf (Tokotype, SIL OFL,
// see scripts/fonts/PlusJakartaSans-OFL.txt) with opentype.js and written as SVG path data, so no
// browser, OS or <link rel="icon"> ever has to resolve a font: the genuine typeface renders
// everywhere. The mark is the deep-ink "M" on a light tile with a solid brand-purple dot at the
// upper-right shoulder.
//
//   tile    #FAF9FC, border #E8E6F1, corner radius 22% of the tile
//   "M"     #413B5E (Plus Jakarta Sans ExtraBold outline)
//   dot     #8574B7
//
// Every icon is the standalone M except public/google-oauth-logo.png, which is the 512x512 consent
// screen lockup: the M tile above the "Meet in Asia" wordmark (same font, also path outlines) on flat
// white with at least 48px of clear margin on every side.
//
// Outputs are listed in OUTPUTS at the bottom. Re-run after changing a color or the font. This
// replaces the icon outputs of the older export-brand-assets.mjs (the "a" mark): do not run that
// script for app icons any more.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import opentype from 'opentype.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (rel) => path.join(ROOT, rel);

const TILE = '#FAF9FC';
const BORDER = '#E8E6F1';
const INK = '#413B5E';
const PURPLE = '#8574B7';

const fontBuf = readFileSync(out('scripts/fonts/PlusJakartaSans-ExtraBold.ttf'));
const font = opentype.parse(fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength));

/**
 * Geometry of the mark in a 512 canvas. `scale` shrinks the whole mark around the canvas center
 * (maskable icons keep it inside Android's 80% safe zone). The "M" is measured from its real ink
 * bounds, then the pair (M + dot) is centered as one optical unit.
 */
function geometry(scale = 1) {
  const S = 512;
  const glyph = font.charToGlyph('M');
  const probe = glyph.getPath(0, 0, 1000).getBoundingBox();
  const gw = probe.x2 - probe.x1;
  const gh = probe.y2 - probe.y1;

  const mWidth = S * 0.58 * scale; // ink width of the M
  const k = mWidth / gw; // font units -> canvas
  const mHeight = gh * k;
  const r = S * 0.066 * scale; // dot radius
  const gap = S * 0.012 * scale; // clear space between the M and the dot
  // The dot sits above-right of the right stem: its center is one radius plus the gap outside the
  // M's top-right corner, on the diagonal.
  const off = r + gap;

  // Ink box of M + dot together, then center it.
  const unitW = mWidth + off + r - 0; // M left edge .. dot right edge
  const unitH = mHeight + off + r; // dot top .. M bottom
  const left = S / 2 - unitW / 2;
  const top = S / 2 - unitH / 2;

  const mx1 = left; // M ink left
  const mTop = top + off + r; // M ink top (the dot top is `top`)
  const mx2 = mx1 + mWidth;

  const fontSize = 1000 * k;
  const x = mx1 - probe.x1 * k;
  const y = mTop - probe.y1 * k;
  const d = glyph.getPath(x, y, fontSize).toPathData(2);

  // Dot center: just outside the M's top-right corner.
  const cx = mx2 + gap * 0.2 + r * 0.55;
  const cy = mTop - gap - r * 0.55 - r * 0.25;
  return { S, d, dot: { cx: +cx.toFixed(2), cy: +cy.toFixed(2), r: +r.toFixed(2) } };
}

/** The mark's shapes in a 512 box: optional tile, the M outline and the dot. */
function markInner({ bg = 'tile', scale = 1, tileFill = TILE } = {}) {
  const { S, d, dot } = geometry(scale);
  const bgEl =
    bg === 'tile'
      ? `<rect x="6" y="6" width="${S - 12}" height="${S - 12}" rx="${(S * 0.22 - 6).toFixed(2)}" fill="${tileFill}" stroke="${BORDER}" stroke-width="12"/>`
      : bg === 'square'
        ? `<rect width="${S}" height="${S}" fill="${tileFill}"/>`
        : '';
  return `${bgEl}
  <path d="${d}" fill="${INK}"/>
  <circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}" fill="${PURPLE}"/>`;
}

/** 512x512 SVG. bg: tile (rounded, bordered) | square (full bleed) | none. */
function markSvg(opts = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${markInner(opts)}
</svg>
`;
}

/**
 * 512x512 Google OAuth consent-screen logo: flat white square, the M tile centered above the
 * "Meet in Asia" wordmark. Both are font outlines, so nothing depends on installed fonts. The
 * wordmark is scaled to LOCKUP.wordWidth wide; the pair is centered vertically and keeps at least
 * LOCKUP.margin of white on every side (Google scales the square down to 120x120).
 */
const LOCKUP = { tile: 200, gap: 30, wordWidth: 380, margin: 48, tileFill: '#F4F1FA' };
function lockupSvg() {
  const S = 512;
  const opts = { kerning: true, letterSpacing: -0.02 };
  const probe = font.getPath('Meet in Asia', 0, 0, 100, opts).getBoundingBox();
  const size = (100 * LOCKUP.wordWidth) / (probe.x2 - probe.x1);
  const k = size / 100;
  const wordH = (probe.y2 - probe.y1) * k;
  const totalH = LOCKUP.tile + LOCKUP.gap + wordH;
  const tileTop = (S - totalH) / 2;
  const wordTop = tileTop + LOCKUP.tile + LOCKUP.gap;
  const wx = S / 2 - ((probe.x1 + probe.x2) / 2) * k;
  const wy = wordTop - probe.y1 * k;
  const word = font.getPath('Meet in Asia', wx, wy, size, opts).toPathData(2);
  const tx = (S - LOCKUP.tile) / 2;
  const ts = LOCKUP.tile / 512;
  const box = {
    left: Math.min(tx, wx + probe.x1 * k),
    right: Math.max(tx + LOCKUP.tile, wx + probe.x2 * k),
    top: tileTop,
    bottom: wordTop + wordH,
  };
  if (box.left < LOCKUP.margin || S - box.right < LOCKUP.margin || box.top < LOCKUP.margin || S - box.bottom < LOCKUP.margin) {
    throw new Error(`lockup breaks the ${LOCKUP.margin}px margin: ${JSON.stringify(box)}`);
  }
  console.log(`lockup: wordmark font size ${size.toFixed(1)}px, ink height ${wordH.toFixed(1)}px, ink box x ${box.left.toFixed(0)}..${box.right.toFixed(0)} y ${box.top.toFixed(0)}..${box.bottom.toFixed(0)}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <rect width="${S}" height="${S}" fill="#FFFFFF"/>
  <g transform="translate(${tx} ${tileTop.toFixed(2)}) scale(${ts})">
  ${markInner({ bg: 'tile', tileFill: LOCKUP.tileFill })}
  </g>
  <path d="${word}" fill="${INK}"/>
</svg>
`;
}

const png = (svg, w, h = w) =>
  sharp(Buffer.from(svg), { density: Math.ceil((72 * Math.max(w, h)) / 512) * 2 })
    .resize(w, h)
    .png()
    .toBuffer();

/** .ico container holding PNG images (read by every browser that requests favicon.ico). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const tile = markSvg({ bg: 'tile' });
const fullBleed = markSvg({ bg: 'square', scale: 0.92 }); // iOS applies its own corner mask
const maskable = markSvg({ bg: 'square', scale: 0.72 }); // inside Android's 80% safe zone
// Google Cloud's consent screen logo: the M tile above the wordmark on flat white (see lockupSvg).
const oauth = await sharp(await png(lockupSvg(), 512)).flatten({ background: '#FFFFFF' }).png().toBuffer();

const OUTPUTS = [
  // Browser tab: file conventions (app/icon.svg, app/favicon.ico, app/apple-icon.png)
  ['app/icon.svg', tile],
  ['public/favicon.svg', tile],
  ['public/icon.svg', tile],
  [
    'app/favicon.ico',
    ico([
      { size: 16, data: await png(tile, 16) },
      { size: 32, data: await png(tile, 32) },
      { size: 48, data: await png(tile, 48) },
    ]),
  ],
  ['app/apple-icon.png', await png(fullBleed, 180)],
  ['public/apple-touch-icon.png', await png(fullBleed, 180)],
  // PWA manifest
  ['public/icon-192.png', await png(tile, 192)],
  ['public/icon-512.png', await png(tile, 512)],
  ['public/icon-192-maskable.png', await png(maskable, 192)],
  ['public/icon-512-maskable.png', await png(maskable, 512)],
  // Google Cloud Console > OAuth consent screen > App logo (512x512 PNG)
  ['public/google-oauth-logo.png', oauth],
];

for (const [rel, data] of OUTPUTS) {
  writeFileSync(out(rel), data);
  console.log('wrote', rel, typeof data === 'string' ? `${data.length} chars` : `${data.length} bytes`);
}
