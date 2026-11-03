// Generates the app icon in every format the app needs.
//   node scripts/generate-icons.mjs
//
// Mark: a solid white symmetric heart (the same Lucide heart as the sparked Discover button) on
// the brand purple gradient. No wordmark text: launchers already print "Asians in Love" under it.
//   - favicon / app/icon.svg: rounded square (7.5px radius at 32px)
//   - apple-touch / 192 / 512: full-bleed square, opaque (iOS adds its own mask)
//   - maskable 192 / 512: heart kept inside the central 80% safe zone so Android never crops it
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const FROM = '#6555B8';
const TO = '#433682';
// Lucide "heart" path, 24-unit box, bounds x 2..22, y 3..21 (center 12, 12).
const HEART = 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';

/**
 * 64x64 mark. `radius` = tile corner radius (0 = full bleed). `scale` = heart size: 1.85 fills
 * ~58% of the tile; 1.5 keeps the heart's farthest point within the maskable safe circle
 * (radius 0.4 x 64 = 25.6 > 1.5 x 13.45 = 20.2).
 */
function markSvg({ radius, scale }) {
  const tx = 32 - 12 * scale;
  const ty = 32.6 - 12 * scale; // nudged down 0.6 so the heart's visual mass sits on center
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${FROM}"/>
      <stop offset="1" stop-color="${TO}"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="${radius}" fill="url(#g)"/>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale})">
    <path d="${HEART}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
  </g>
</svg>
`;
}

const rounded = markSvg({ radius: 15, scale: 1.85 }); // 7.5px at 32px
const square = markSvg({ radius: 0, scale: 1.85 });
const maskable = markSvg({ radius: 0, scale: 1.5 });

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 72 * (size / 64) * 2 })
    .resize(size, size)
    .flatten({ background: FROM }) // opaque: no transparent pixels on launchers
    .png()
    .toBuffer();
const pngRounded = (svg, size) =>
  sharp(Buffer.from(svg), { density: 72 * (size / 64) * 2 }).resize(size, size).png().toBuffer();

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
writeFileSync('public/apple-touch-icon.png', await png(square, 180));
writeFileSync('public/icon-192.png', await png(square, 192));
writeFileSync('public/icon-512.png', await png(square, 512));
writeFileSync('public/icon-192-maskable.png', await png(maskable, 192));
writeFileSync('public/icon-512-maskable.png', await png(maskable, 512));
writeFileSync('app/favicon.ico', ico([
  { size: 16, data: await pngRounded(rounded, 16) },
  { size: 32, data: await pngRounded(rounded, 32) },
  { size: 48, data: await pngRounded(rounded, 48) },
]));
console.log('icons written');
