import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Site-wide social card (WhatsApp, Facebook, iMessage, Telegram, X): 1200x630, brand copy on the
 * left, the landing hero photo on the right. Generated once at build time (no request data).
 * Delivered as JPEG so the photo half stays well under the 300 KB that WhatsApp previews need;
 * falls back to the PNG from ImageResponse if sharp is unavailable.
 *
 * Copy rules: every claim must hold in the live app (verification is a free selfie check, not
 * mandatory; screening reduces scams, it does not promise zero).
 */

export const alt = 'Meet in Asia - Real connections, selfie-verified profiles';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/jpeg';

const INK = '#413B5E';
const PURPLE = '#8574B7';
const BODY = '#475569';
const LINE = '#D0CDE1';

const PHOTO_WIDTH = 520;

// Landing hero (green top, pink phone), read once at module scope.
const heroSrc = `data:image/png;base64,${await readFile(join(process.cwd(), 'public/images/hero-pinay.png'), 'base64')}`;

type FontSpec = { name: string; weight: 400 | 600; family: string };
const FONT_SPECS: FontSpec[] = [
  { name: 'Jakarta', weight: 600, family: 'Plus+Jakarta+Sans:wght@600' },
  { name: 'Inter', weight: 400, family: 'Inter:wght@400' },
  { name: 'Inter', weight: 600, family: 'Inter:wght@600' },
];

/** Brand fonts as TTF from Google Fonts (ImageResponse cannot read woff2); [] on any failure. */
async function loadFonts() {
  try {
    return await Promise.all(
      FONT_SPECS.map(async (f) => {
        const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${f.family}`)).text();
        const url = css.match(/src: url\((.+?\.ttf)\)/)?.[1];
        if (!url) throw new Error('no ttf url');
        const data = await (await fetch(url)).arrayBuffer();
        return { name: f.name, data, weight: f.weight, style: 'normal' as const };
      })
    );
  } catch {
    return [];
  }
}

function Chip({ children }: { children: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '9px 14px',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        border: `1px solid ${LINE}`,
        fontSize: 17,
        fontWeight: 600,
        color: INK,
      }}
    >
      {children}
    </div>
  );
}

export default async function Image() {
  const fonts = await loadFonts();
  const heading = fonts.length ? 'Jakarta' : 'sans-serif';

  const png = new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: '#FFFFFF', fontFamily: fonts.length ? 'Inter' : 'sans-serif' }}>
        {/* Left: wordmark, headline, proof points */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 1200 - PHOTO_WIDTH,
            height: '100%',
            padding: '56px 48px 52px 64px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', fontFamily: heading, fontSize: 38, fontWeight: 600, letterSpacing: -0.8 }}>
              <span style={{ color: INK }}>Meet in&nbsp;</span>
              <span style={{ color: PURPLE }}>Asia</span>
            </div>
            <div
              style={{
                display: 'flex',
                padding: '6px 11px',
                borderRadius: 6,
                backgroundColor: 'rgba(133, 116, 183, 0.15)',
                color: PURPLE,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Selfie-Verified
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', fontFamily: heading, fontSize: 54, fontWeight: 600, lineHeight: 1.12, letterSpacing: -1.2 }}>
              <span style={{ color: INK }}>Real connections.</span>
              <span style={{ color: PURPLE }}>Verified profiles.</span>
            </div>
            <div style={{ display: 'flex', fontSize: 23, lineHeight: 1.45, color: BODY, maxWidth: 520 }}>
              The dating community connecting travelers with real singles across Southeast Asia.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Chip>Free live selfie verification</Chip>
              <Chip>Visiting Soon trips</Chip>
            </div>
            <div style={{ display: 'flex', fontSize: 19, fontWeight: 600, color: PURPLE }}>meetin.asia</div>
          </div>
        </div>

        {/* Right: hero photo, full height, centred crop */}
        <div style={{ display: 'flex', width: PHOTO_WIDTH, height: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={heroSrc} width={PHOTO_WIDTH} height={630} style={{ width: PHOTO_WIDTH, height: 630, objectFit: 'cover' }} />
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );

  // PNG of a photo runs to several hundred KB; re-encode as JPEG to stay well under 300 KB.
  try {
    const { default: sharp } = await import('sharp');
    const jpeg = await sharp(Buffer.from(await png.arrayBuffer()))
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toBuffer();
    return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
  } catch {
    return png;
  }
}
