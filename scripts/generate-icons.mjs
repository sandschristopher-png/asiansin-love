// Generates the 'ail' brand mark in every format the app needs.
//   node scripts/generate-icons.mjs
//
// The lowercase "ail" is drawn as rounded strokes (Comfortaa-style geometry) instead of text,
// so it renders identically in browsers, iOS, Android and the PNG rasterizer - no font needed.
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const PURPLE = '#6555B8';
const LILAC = '#F3EFFC';

/** The 64x64 mark. `rounded` = tile corners (browser favicon); false = full-bleed (iOS / maskable). */
function markSvg({ rounded }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="${rounded ? 16 : 0}" fill="${LILAC}"/>
  <g fill="none" stroke="${PURPLE}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="23.5" cy="38" r="8"/>
    <path d="M31.5 30v16"/>
    <path d="M40.5 32v14"/>
    <path d="M48.5 18v28"/>
  </g>
  <circle cx="40.5" cy="23.5" r="3.1" fill="${PURPLE}"/>
</svg>
`;
}

const rounded = markSvg({ rounded: true });
const square = markSvg({ rounded: false });

const png = (svg, size) => sharp(Buffer.from(svg), { density: 72 * (size / 64) * 2 }).resize(size, size).png().toBuffer();

/** .ico container holding PNG images (supported by every browser that reads favicon.ico). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

writeFileSync('app/icon.svg', rounded);
writeFileSync('public/icon.svg', rounded);
writeFileSync('public/favicon.svg', rounded);
writeFileSync('app/apple-icon.png', await png(square, 180));
writeFileSync('public/icon-192.png', await png(square, 192));
writeFileSync('public/icon-512.png', await png(square, 512));
writeFileSync('app/favicon.ico', ico([
  { size: 16, data: await png(rounded, 16) },
  { size: 32, data: await png(rounded, 32) },
  { size: 48, data: await png(rounded, 48) },
]));
console.log('icons written');
