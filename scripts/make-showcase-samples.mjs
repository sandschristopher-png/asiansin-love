// Draws the illustrated sample members and Moment scenes used by the landing-page showcase screenshots.
//   node scripts/make-showcase-samples.mjs        (writes public/showcase/sample/*.jpg, committed)
// They are original flat illustrations in the brand palette, not photos of anyone: the showcase shows demo data, and
// illustrations make that obvious (and avoid using a real person's picture for an invented member).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.resolve('public/showcase/sample');
fs.mkdirSync(OUT, { recursive: true });

const SKIN = ['#F1D3BF', '#E8C3A5', '#D9A988', '#C98F6B'];
const HAIR = ['#1F1B24', '#2B2230', '#3A2A25'];
const TOP = ['#9A93BC', '#726E97', '#E3B9C6', '#B9CDBE', '#E6D3B3', '#F4F2F8'];
const BG = ['#EAE9F2', '#F6E9EC', '#E9F0EC', '#F3EDE2', '#E6EAF4', '#F1E8F2'];

/** Hair shapes: a layer behind the head and a fringe in front of it. */
const HAIR_STYLE = {
  long: {
    back: 'M182 340 Q176 150 300 148 Q424 150 418 340 L448 690 Q300 720 152 690 Z',
    front: 'M196 310 Q204 186 300 182 Q396 186 404 310 Q350 226 300 232 Q250 226 196 310 Z',
  },
  wavy: {
    back: 'M182 340 Q172 150 300 146 Q428 150 418 340 Q452 420 430 470 Q462 540 436 600 Q458 660 430 700 Q300 726 170 700 Q142 660 164 600 Q138 540 170 470 Q148 420 182 340 Z',
    front: 'M196 312 Q206 184 300 180 Q394 184 404 312 Q352 224 300 230 Q248 224 196 312 Z',
  },
  bob: {
    back: 'M184 340 Q176 152 300 150 Q424 152 416 340 L424 470 Q300 500 176 470 Z',
    front: 'M192 292 Q300 150 408 292 L408 246 Q300 120 192 246 Z',
  },
  ponytail: {
    back: 'M186 340 Q182 156 300 152 Q418 156 414 340 Q440 250 520 300 Q560 420 470 520 Q500 400 414 360 Z',
    front: 'M198 304 Q206 190 300 184 Q394 190 402 304 Q350 232 300 238 Q250 232 198 304 Z',
  },
  bun: {
    back: 'M186 340 Q180 160 300 156 Q420 160 414 340 Q300 230 186 340 Z M300 92 a48 48 0 1 1 -0.1 0 Z',
    front: 'M198 300 Q208 192 300 188 Q392 192 402 300 Q350 236 300 242 Q250 236 198 300 Z',
  },
  bangs: {
    back: 'M186 340 Q178 156 300 152 Q422 156 414 340 L420 450 Q300 478 180 450 Z',
    front: 'M190 300 L190 250 Q300 130 410 250 L410 300 Q300 232 190 300 Z',
  },
};

function avatar({ skin, hair, top, bg, style, nameSeed }) {
  const s = SKIN[skin];
  const h = HAIR[hair];
  const st = HAIR_STYLE[style];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <rect width="600" height="800" fill="${BG[bg]}"/>
  <circle cx="${120 + nameSeed * 37}" cy="${130 + (nameSeed % 3) * 40}" r="${70 + nameSeed * 4}" fill="#ffffff" opacity="0.35"/>
  <path d="${st.back}" fill="${h}"/>
  <path d="M110 800 Q118 560 300 520 Q482 560 490 800 Z" fill="${TOP[top]}"/>
  <rect x="268" y="410" width="64" height="120" rx="26" fill="${s}"/>
  <path d="M268 470 Q300 500 332 470 L332 500 Q300 530 268 500 Z" fill="#000" opacity="0.07"/>
  <ellipse cx="300" cy="330" rx="108" ry="132" fill="${s}"/>
  <ellipse cx="196" cy="346" rx="14" ry="22" fill="${s}"/><ellipse cx="404" cy="346" rx="14" ry="22" fill="${s}"/>
  <path d="${st.front}" fill="${h}"/>
  <path d="M236 318 Q256 308 276 316" stroke="${h}" stroke-width="6" stroke-linecap="round" fill="none"/>
  <path d="M324 316 Q344 308 364 318" stroke="${h}" stroke-width="6" stroke-linecap="round" fill="none"/>
  <ellipse cx="256" cy="344" rx="7.5" ry="10" fill="#2A2230"/><ellipse cx="344" cy="344" rx="7.5" ry="10" fill="#2A2230"/>
  <circle cx="259" cy="340" r="2.6" fill="#fff"/><circle cx="347" cy="340" r="2.6" fill="#fff"/>
  <path d="M296 360 Q290 384 302 388" stroke="#000" stroke-opacity="0.22" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M268 408 Q300 438 332 408" stroke="#A5495A" stroke-width="6" stroke-linecap="round" fill="none"/>
  <circle cx="232" cy="388" r="18" fill="#E58896" opacity="0.28"/><circle cx="368" cy="388" r="18" fill="#E58896" opacity="0.28"/>
</svg>`;
}

const PEOPLE = {
  'mika': { skin: 0, hair: 0, top: 0, bg: 0, style: 'bob', nameSeed: 1 },
  'ploy': { skin: 2, hair: 0, top: 2, bg: 1, style: 'long', nameSeed: 2 },
  'aira': { skin: 1, hair: 2, top: 1, bg: 4, style: 'wavy', nameSeed: 3 },
  'nok': { skin: 2, hair: 1, top: 3, bg: 2, style: 'ponytail', nameSeed: 4 },
  'sofia': { skin: 1, hair: 0, top: 4, bg: 3, style: 'bun', nameSeed: 5 },
  'yuna': { skin: 0, hair: 1, top: 5, bg: 5, style: 'bangs', nameSeed: 6 },
  'bea': { skin: 3, hair: 2, top: 0, bg: 0, style: 'wavy', nameSeed: 7 },
  'lani': { skin: 2, hair: 1, top: 1, bg: 2, style: 'long', nameSeed: 8 },
};

/** Moment scenes, 4:5. */
const SCENES = {
  cafe: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <rect width="800" height="1000" fill="#F3EDE2"/>
  <path d="M120 560 L120 260 Q400 80 680 260 L680 560 Z" fill="#E6EAF4"/><path d="M160 540 L160 280 Q400 130 640 280 L640 540 Z" fill="#CFD6EA"/>
  <rect x="396" y="150" width="8" height="390" fill="#F3EDE2"/><rect x="160" y="400" width="480" height="8" fill="#F3EDE2"/>
  <rect x="0" y="640" width="800" height="360" fill="#C9B79C"/><rect x="0" y="640" width="800" height="16" fill="#B7A387"/>
  <ellipse cx="400" cy="800" rx="240" ry="48" fill="#EFE6D6"/><ellipse cx="400" cy="790" rx="150" ry="30" fill="#FFFFFF"/>
  <path d="M310 600 L490 600 L470 780 Q400 810 330 780 Z" fill="#FFFFFF"/><ellipse cx="400" cy="600" rx="90" ry="22" fill="#6B4A3A"/>
  <path d="M492 640 Q560 640 556 700 Q552 740 478 736" stroke="#FFFFFF" stroke-width="22" fill="none" stroke-linecap="round"/>
  <path d="M370 570 Q350 540 372 510 Q392 482 372 452" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M420 576 Q400 548 420 520 Q440 494 422 466" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="10" fill="none" stroke-linecap="round"/>
  <rect x="640" y="700" width="86" height="120" rx="14" fill="#B6683F"/><path d="M683 700 Q640 600 668 560 Q700 600 683 700 Z M683 700 Q730 620 770 640 Q730 690 683 700 Z" fill="#7FA58B"/>
</svg>`,
  streetfood: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <rect width="800" height="1000" fill="#2E2A45"/>
  <g fill="#FFD9A0" opacity="0.9"><circle cx="120" cy="120" r="14"/><circle cx="260" cy="90" r="14"/><circle cx="400" cy="120" r="14"/><circle cx="540" cy="90" r="14"/><circle cx="680" cy="120" r="14"/></g>
  <path d="M100 160 Q400 100 700 160" stroke="#FFD9A0" stroke-width="3" fill="none"/>
  <path d="M60 330 L740 330 L700 220 L100 220 Z" fill="#E8E3F5"/>
  <g fill="#9A93BC"><path d="M100 220 L188 220 L174 330 L60 330 Z"/><path d="M276 220 L364 220 L364 330 L260 330 Z"/><path d="M452 220 L540 220 L548 330 L444 330 Z"/><path d="M628 220 L700 220 L740 330 L624 330 Z"/></g>
  <rect x="90" y="330" width="620" height="500" fill="#3C3659"/><rect x="60" y="540" width="680" height="40" fill="#C8B79D"/>
  <rect x="90" y="580" width="620" height="250" fill="#8A6F55"/>
  <g stroke="#6B4A3A" stroke-width="10" stroke-linecap="round"><path d="M180 470 L360 520"/><path d="M200 440 L380 490"/><path d="M420 520 L600 470"/><path d="M440 550 L620 500"/></g>
  <g fill="#C67C4E"><circle cx="210" cy="480" r="22"/><circle cx="260" cy="494" r="22"/><circle cx="310" cy="508" r="22"/><circle cx="480" cy="530" r="22"/><circle cx="540" cy="514" r="22"/><circle cx="590" cy="498" r="22"/></g>
  <g fill="#FFFFFF"><circle cx="400" cy="430" r="52"/></g><circle cx="400" cy="430" r="52" fill="#FFD9A0"/><path d="M370 430 Q400 400 430 430" stroke="#2E2A45" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M0 840 L800 840 L800 1000 L0 1000 Z" fill="#26223A"/><ellipse cx="400" cy="905" rx="320" ry="26" fill="#FFD9A0" opacity="0.12"/>
</svg>`,
  viewpoint: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8F88C4"/><stop offset="0.55" stop-color="#E7B7C8"/><stop offset="1" stop-color="#F8DDBF"/></linearGradient></defs>
  <rect width="800" height="1000" fill="url(#sky)"/><circle cx="560" cy="360" r="96" fill="#FFF1D8" opacity="0.9"/>
  <g fill="#5A5688"><rect x="40" y="560" width="90" height="280"/><rect x="140" y="480" width="70" height="360"/><rect x="220" y="600" width="110" height="240"/><rect x="560" y="540" width="100" height="300"/><rect x="670" y="610" width="100" height="230"/></g>
  <path d="M440 840 L440 360 L452 360 L452 300 L472 300 L472 360 L484 360 L484 840 Z" fill="#473F77"/><path d="M462 300 L462 220" stroke="#473F77" stroke-width="6"/><circle cx="462" cy="214" r="10" fill="#E15B6B"/>
  <g fill="#3B3566"><rect x="340" y="520" width="70" height="320"/><rect x="500" y="580" width="60" height="260"/></g>
  <g fill="#FFE7A8" opacity="0.8"><rect x="60" y="600" width="10" height="14"/><rect x="90" y="640" width="10" height="14"/><rect x="160" y="520" width="10" height="14"/><rect x="170" y="580" width="10" height="14"/><rect x="580" y="580" width="10" height="14"/><rect x="620" y="640" width="10" height="14"/><rect x="700" y="660" width="10" height="14"/></g>
  <rect x="0" y="840" width="800" height="160" fill="#3B3566"/><rect x="0" y="800" width="800" height="14" fill="#2E2A45"/>
  <g stroke="#2E2A45" stroke-width="10"><path d="M60 814 L60 900"/><path d="M200 814 L200 900"/><path d="M340 814 L340 900"/><path d="M480 814 L480 900"/><path d="M620 814 L620 900"/><path d="M760 814 L760 900"/></g>
</svg>`,
  riverside: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs><linearGradient id="s2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4C9B8"/><stop offset="1" stop-color="#FBE9CF"/></linearGradient><linearGradient id="w2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9CBE8"/><stop offset="1" stop-color="#9A93BC"/></linearGradient></defs>
  <rect width="800" height="1000" fill="url(#s2)"/><circle cx="400" cy="520" r="120" fill="#FFF3DC"/>
  <path d="M0 540 L120 440 L170 500 L260 410 L340 520 L460 430 L560 520 L660 450 L800 540 L800 600 L0 600 Z" fill="#B9A8D1" opacity="0.8"/>
  <rect x="0" y="600" width="800" height="400" fill="url(#w2)"/>
  <g fill="#FFF3DC" opacity="0.6"><rect x="300" y="620" width="200" height="8" rx="4"/><rect x="330" y="650" width="140" height="8" rx="4"/><rect x="360" y="680" width="80" height="8" rx="4"/></g>
  <path d="M180 760 Q400 840 620 760 L580 820 Q400 880 220 820 Z" fill="#5A5688"/><path d="M400 760 L400 640" stroke="#5A5688" stroke-width="8"/><path d="M400 650 L520 740 L400 740 Z" fill="#FFFFFF"/>
</svg>`,
};

for (const [name, def] of Object.entries(PEOPLE)) {
  await sharp(Buffer.from(avatar(def))).jpeg({ quality: 88 }).toFile(path.join(OUT, `${name}.jpg`));
}
for (const [name, svg] of Object.entries(SCENES)) {
  await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(path.join(OUT, `scene-${name}.jpg`));
}
console.log('wrote', Object.keys(PEOPLE).length, 'portraits and', Object.keys(SCENES).length, 'scenes to public/showcase/sample/');
