// Generates public/og-image.png (1200x630), the social share card used by app/layout.tsx.
//   node scripts/generate-og-image.mjs
//
// Same approach as generate-icons.mjs: an SVG rasterized with sharp. The 'ail' mark is drawn as
// strokes; the text uses whatever sans-serif font the machine provides.
import sharp from 'sharp';

const PURPLE = '#6555B8';
const LILAC = '#F3EFFC';
const INK = '#1C1924';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F9F8FC"/>
      <stop offset="1" stop-color="${LILAC}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1080" cy="80" r="220" fill="${PURPLE}" opacity="0.08"/>
  <circle cx="1140" cy="560" r="160" fill="${PURPLE}" opacity="0.06"/>

  <!-- 'ail' mark -->
  <g transform="translate(96 96) scale(2.6)">
    <rect width="64" height="64" rx="16" fill="${LILAC}" stroke="${PURPLE}" stroke-opacity="0.25" stroke-width="1"/>
    <g fill="none" stroke="${PURPLE}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="23.5" cy="38" r="8"/>
      <path d="M31.5 30v16"/>
      <path d="M40.5 32v14"/>
      <path d="M48.5 18v28"/>
    </g>
    <circle cx="40.5" cy="23.5" r="3.1" fill="${PURPLE}"/>
  </g>

  <g font-family="'Plus Jakarta Sans', 'Segoe UI', Helvetica, Arial, sans-serif">
    <text x="96" y="340" font-size="64" font-weight="800" fill="${INK}">Asians in Love</text>
    <text x="96" y="410" font-size="34" font-weight="600" fill="${PURPLE}">Intentional dating for singles in Asia &amp; beyond</text>
    <text x="96" y="470" font-size="26" font-weight="500" fill="#524B5E">Gesture-verified profiles · Voice intros · Community reputation</text>
    <text x="96" y="560" font-size="26" font-weight="700" fill="${PURPLE}">asiansin.love</text>
  </g>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile('public/og-image.png');
console.log('wrote public/og-image.png');
