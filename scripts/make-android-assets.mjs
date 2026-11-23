// Builds the source art @capacitor/assets needs (assets/) from the brand mark in public/icon.svg, then run
//   npm run cap:assets        (capacitor-assets generate --android, see package.json)
//   node scripts/make-android-assets.mjs && npm run cap:assets
//
// Adaptive icon: a flat #FAF9FC background layer plus the deep-ink "M" and purple dot as a transparent foreground layer,
// kept inside Android's centered safe zone (about 66% of the canvas) so no launcher mask can clip it. The splash is flat
// the light surface (#FAF9FC) with the mark centered; there is no dark variant (the app is light mode only).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.resolve('assets');
fs.mkdirSync(OUT, { recursive: true });

const TILE = '#FAF9FC';
const INK = '#413B5E';
const PURPLE = '#726E97';

// The mark exactly as in public/icon.svg (512 canvas), without the tile behind it.
const M_PATH =
  'M129.67 434.68L70.66 434.68L70.66 151.05L127.76 151.05L220.28 274.02L310.51 151.05L367.62 151.05L367.62 434.68L308.60 434.68L308.60 251.94L222.94 362.35L215.33 362.35L129.67 247.75L129.67 434.68Z';
const DOT = { cx: 387.43, cy: 117.87, r: 33.79 };

// Ink box of M + dot together (x 70.66..421.22, y 84.08..434.68) and its center.
const BOX = { x1: 70.66, y1: DOT.cy - DOT.r, x2: DOT.cx + DOT.r, y2: 434.68 };
const CX = (BOX.x1 + BOX.x2) / 2;
const CY = (BOX.y1 + BOX.y2) / 2;
const BOX_W = BOX.x2 - BOX.x1;

/** The mark as an SVG fragment, sized so its ink box is `target` px wide and centered on a size x size canvas. */
function mark(size, target) {
  const s = target / BOX_W;
  const tx = size / 2 - CX * s;
  const ty = size / 2 - CY * s;
  return `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})"><path d="${M_PATH}" fill="${INK}"/><circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${PURPLE}"/></g>`;
}

const svg = (size, body, background) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ''}${body}</svg>`
  );

const png = (name, buf) => sharp(buf).png().toFile(path.join(OUT, name));

// 1024 adaptive icon layers. @capacitor/assets insets both layers by 16.7% (Android's 66% safe zone), so the mark fills
// 86% of the layer: about 57% of the 108dp launcher canvas, inside the visible circle of every mask.
await png('icon-background.png', svg(1024, '', TILE));
await png('icon-foreground.png', svg(1024, mark(1024, 1024 * 0.86)));
// Full icon (older launchers, store listing): tile and mark together.
await png('icon-only.png', svg(1024, mark(1024, 1024 * 0.58), TILE));
// Splash: the flat light surface (#FAF9FC), the mark about 18% of the width in the middle.
await png('splash.png', svg(2732, mark(2732, 2732 * 0.18), TILE));

console.log('wrote assets/icon-background.png, icon-foreground.png, icon-only.png, splash.png');
