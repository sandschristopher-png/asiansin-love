// Exports every brand asset from the real Plus Jakarta Sans glyph outlines.
//   node scripts/export-brand-assets.mjs
//
// Source font: scripts/fonts/PlusJakartaSans-ExtraBold.ttf (Tokotype, SIL OFL - see
// scripts/fonts/PlusJakartaSans-OFL.txt), the same family as the font-brand wordmark.
// opentype.js reads the glyph outlines directly, so the mark is the font's own lowercase "a"
// as vector paths - no text rendering, no system-font fallback.
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

const fontBuf = readFileSync(out('scripts/fonts/PlusJakartaSans-ExtraBold.ttf'));
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

/** 1024x240 transparent lockup: "asiansin" in deep velvet + "love" in the gradient (no dot). */
function wordmarkSvg() {
  const W = 1024;
  const H = 240;
  const size = 150;
  // Matches the UI wordmark's tracking-[-0.03em].
  const opts = { kerning: true, letterSpacing: -0.03, features: { liga: true, rlig: true } };
  const a = font.getPath('asiansin', 0, 0, size, opts);
  const advA = font.getAdvanceWidth('asiansin', size, opts);
  const b = font.getPath('love', advA, 0, size, opts);
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

/**
 * 1200x630 Open Graph / Twitter share card: soft lilac canvas, squircle "a" mark, the
 * asiansinlove lockup and the hero line - all drawn from glyph outlines (no system fonts).
 */
function ogSvg() {
  const W = 1200;
  const H = 630;
  const LEFT = 96;
  const MAX_TEXT = W - LEFT * 2;
  const opts = { kerning: true, letterSpacing: -0.03 };

  // Text path at a size that fits MAX_TEXT, left-aligned at LEFT with its baseline at y.
  const line = (text, size, y, fill) => {
    const fit = Math.min(size, (size * MAX_TEXT) / font.getAdvanceWidth(text, size, opts));
    return `<path d="${font.getPath(text, LEFT, y, fit, opts).toPathData(2)}" fill="${fill}"/>`;
  };

  // Wordmark at 104px: "asiansin" ink + "love" gradient.
  const wmSize = 104;
  const wmY = 352;
  const advA = font.getAdvanceWidth('asiansin', wmSize, opts);
  const wmA = font.getPath('asiansin', LEFT, wmY, wmSize, opts).toPathData(2);
  const wmB = font.getPath('love', LEFT + advA, wmY, wmSize, opts).toPathData(2);

  // Mark: 132px squircle with the gradient "a".
  const MARK = 132;
  const markGlyph = glyphA({ canvas: MARK, inkSize: MARK * 0.6 });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.55" stop-color="#FAF8FD"/>
      <stop offset="1" stop-color="#F3EFFC"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#C084FC" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#C084FC" stop-opacity="0"/>
    </radialGradient>
    ${gradientDef('g')}
    ${gradientDef('gx', 0, 0, 1, 0)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1060" cy="120" r="320" fill="url(#glow)"/>
  <circle cx="1150" cy="600" r="240" fill="url(#glow)" opacity="0.6"/>
  <g transform="translate(${LEFT} 92)">
    <rect width="${MARK}" height="${MARK}" rx="${MARK / 4}" fill="${BG}"/>
    <path d="${markGlyph}" fill="url(#g)"/>
  </g>
  <path d="${wmA}" fill="${INK}"/>
  <path d="${wmB}" fill="url(#gx)"/>
  ${line('Real connection, without the guesswork.', 46, 450, INK)}
  ${line('Verified singles across Southeast Asia and beyond.', 30, 508, '#6C637B')}
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
  // Social share card (app/layout.tsx metadata: openGraph + twitter)
  ['public/og-image.png', await png(ogSvg(), 1200, 630)],
];

for (const [rel, data] of OUTPUTS) {
  writeFileSync(out(rel), data);
  console.log('wrote', rel);
}
console.log(`${OUTPUTS.length} brand assets exported from the Plus Jakarta Sans ExtraBold "a" glyph.`);
