// Exports every brand asset from the real Playwrite IT Moderna glyph outlines.
//   node scripts/export-brand-assets.mjs
//
// Source font: scripts/fonts/PlaywriteITModerna-Variable.ttf (google/fonts, SIL OFL - see
// scripts/fonts/OFL.txt). opentype.js reads the glyph outlines directly, so the mark is the
// font's own lowercase "a" as vector paths - no text rendering, no system-font fallback.
//
// Mark   : gradient "a" (#8C71F5 -> #C084FC -> #EC4899) on a #2D264B squircle (rx 128 @ 512).
// Outputs: see OUTPUTS at the bottom. Re-run after changing colors or the font.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import opentype from 'opentype.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (rel) => path.join(ROOT, rel);

const BG = '#2D264B';
const INK = '#2D264B';
const STOPS = ['#8C71F5', '#C084FC', '#EC4899'];

const fontBuf = readFileSync(out('scripts/fonts/PlaywriteITModerna-Variable.ttf'));
const font = opentype.parse(fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength));

const gradientDef = (id, x1 = 0, y1 = 0, x2 = 1, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
      ${STOPS.map((c, i) => `<stop offset="${i / (STOPS.length - 1)}" stop-color="${c}"/>`).join('\n      ')}
    </linearGradient>`;

/**
 * The lowercase "a" as SVG path data, scaled so its ink box is `inkSize` tall/wide (whichever is
 * larger) and centered on (cx, cy) in a `canvas`-sized square. Centering uses the glyph's actual
 * ink bounds (not the em box), which is what makes a script letter look optically centered.
 */
function glyphA({ canvas, inkSize }) {
  const glyph = font.charToGlyph('a');
  const probe = glyph.getPath(0, 0, 1000).getBoundingBox();
  const w = probe.x2 - probe.x1;
  const h = probe.y2 - probe.y1;
  const fontSize = (1000 * inkSize) / Math.max(w, h);
  const scale = fontSize / 1000;
  const x = canvas / 2 - (probe.x1 + w / 2) * scale;
  const y = canvas / 2 - (probe.y1 + h / 2) * scale;
  return glyph.getPath(x, y, fontSize).toPathData(2);
}

/** 512x512 mark. bg: squircle | square | none. fill: gradient | white. inkRatio: glyph size / canvas. */
function markSvg({ bg = 'squircle', fill = 'gradient', inkRatio = 0.6 }) {
  const S = 512;
  const d = glyphA({ canvas: S, inkSize: S * inkRatio });
  const bgEl =
    bg === 'squircle' ? `<rect width="${S}" height="${S}" rx="128" fill="${BG}"/>`
    : bg === 'square' ? `<rect width="${S}" height="${S}" fill="${BG}"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <defs>
    ${gradientDef('g')}
  </defs>
  ${bgEl}
  <path d="${d}" fill="${fill === 'white' ? '#FFFFFF' : 'url(#g)'}"/>
</svg>
`;
}

/** 1024x240 transparent lockup: "asiansin" in deep velvet + ".love" in the gradient. */
function wordmarkSvg() {
  const W = 1024;
  const H = 240;
  const size = 150;
  const opts = { kerning: true, features: { liga: true, rlig: true } };
  const a = font.getPath('asiansin', 0, 0, size, opts);
  const advA = font.getAdvanceWidth('asiansin', size, opts);
  const b = font.getPath('.love', advA, 0, size, opts);
  const boxA = a.getBoundingBox();
  const boxB = b.getBoundingBox();
  const x1 = Math.min(boxA.x1, boxB.x1);
  const x2 = Math.max(boxA.x2, boxB.x2);
  const y1 = Math.min(boxA.y1, boxB.y1);
  const y2 = Math.max(boxA.y2, boxB.y2);
  const scale = Math.min((W * 0.92) / (x2 - x1), (H * 0.86) / (y2 - y1));
  const tx = W / 2 - ((x1 + x2) / 2) * scale;
  const ty = H / 2 - ((y1 + y2) / 2) * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    ${gradientDef('g', 0, 0, 1, 0)}
  </defs>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">
    <path d="${a.toPathData(2)}" fill="${INK}"/>
    <path d="${b.toPathData(2)}" fill="url(#g)"/>
  </g>
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

const squircle = markSvg({ bg: 'squircle' });
const fullBleed = markSvg({ bg: 'square' }); // iOS / PWA apply their own corner mask
const maskable = markSvg({ bg: 'square', inkRatio: 0.48 }); // inside Android's 80% safe zone
const transparent = markSvg({ bg: 'none', inkRatio: 0.8 });
const whiteTransparent = markSvg({ bg: 'none', fill: 'white', inkRatio: 0.8 });
const wordmark = wordmarkSvg();

const OUTPUTS = [
  // Browser tab / favicons (app/favicon.ico, not public/: Next.js rejects both at /favicon.ico)
  ['app/icon.svg', squircle],
  ['public/favicon.svg', squircle],
  ['public/icon.svg', squircle],
  ['app/favicon.ico', ico([
    { size: 16, data: await png(squircle, 16) },
    { size: 32, data: await png(squircle, 32) },
    { size: 48, data: await png(squircle, 48) },
  ])],
  // iOS home screen + PWA manifest
  ['app/apple-icon.png', await png(fullBleed, 180)],
  ['public/apple-touch-icon.png', await png(fullBleed, 180)],
  ['public/icon-192.png', await png(fullBleed, 192)],
  ['public/icon-512.png', await png(fullBleed, 512)],
  ['public/icon-192-maskable.png', await png(maskable, 192)],
  ['public/icon-512-maskable.png', await png(maskable, 512)],
  // Third-party branding
  ['public/google-oauth-logo.png', await png(squircle, 512)],
  ['public/stripe-logo.png', await png(squircle, 512)],
  // Marks + lockup for decks, social, email
  ['public/logo-mark-transparent.png', await png(transparent, 512)],
  ['public/logo-mark-white-transparent.png', await png(whiteTransparent, 512)],
  ['public/logo-wordmark-transparent.png', await png(wordmark, 1024, 240)],
];

for (const [rel, data] of OUTPUTS) {
  writeFileSync(out(rel), data);
  console.log('wrote', rel);
}
console.log(`${OUTPUTS.length} brand assets exported from the Playwrite IT Moderna "a" glyph.`);
