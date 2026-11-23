/**
 * Captures the three landing-page showcase screenshots into public/showcase/ (390x844 CSS px at 2x, no browser chrome):
 *   discover.png   the Discover grid
 *   spot-map.png   /moments/map with member pins on the Meet in Asia map palette
 *   moments.png    the Moments feed with a location-pinned post
 *
 *   npm run showcase:capture
 *
 * It drives the real pages of a local development server (it uses http://localhost:3000 when one is running, otherwise it starts
 * `npm run dev` and stops it afterwards). The signed-in state is a demo: a cookie lets the dev server skip the sign-in redirect
 * (proxy.ts, development only), a made-up Supabase session is set, and every API and Supabase call is answered with the invented
 * data in scripts/showcase-data.ts. Nothing reaches a real account or database. Needs Microsoft Edge or Google Chrome installed
 * (playwright-core drives the installed browser, so there is no browser download). The map tiles need internet access.
 *
 * Node runs this file directly (type stripping), so it sticks to erasable TypeScript.
 */
import { chromium, type Browser, type BrowserContext, type Page, type Route } from 'playwright-core';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { VIEWER_ID, discoverProfiles, feedMoments, mapMoments, viewer, viewerRow } from './showcase-data.ts';

const BASE = (process.env.SHOWCASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const OUT = path.resolve('public/showcase');
const VIEWPORT = { width: 390, height: 844 };

function envValue(name: string): string {
  if (process.env[name]) return String(process.env[name]);
  for (const file of ['.env.local', '.env']) {
    if (!fs.existsSync(file)) continue;
    const m = fs.readFileSync(file, 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'));
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return '';
}

async function reachable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/login`, { signal: AbortSignal.timeout(4000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

/** Uses a running dev server, or starts one. Returns what to stop at the end (null when the server was already running). */
async function ensureServer(): Promise<ChildProcess | null> {
  if (await reachable()) return null;
  if (new URL(BASE).hostname !== 'localhost') throw new Error(`No server answers at ${BASE}`);
  console.log('Starting `npm run dev`...');
  const child = spawn('npm', ['run', 'dev'], { shell: true, stdio: 'ignore' });
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (await reachable()) return child;
    await new Promise((r) => setTimeout(r, 2000));
  }
  child.kill();
  throw new Error('The dev server did not start in 3 minutes.');
}

function stopServer(child: ChildProcess | null) {
  if (!child?.pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
  else child.kill();
}

function b64url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

/** A made-up Supabase session. supabase-js only checks its expiry on the client, it never verifies the signature. */
function demoSession() {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24 * 30;
  const token = [
    b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    b64url(JSON.stringify({ sub: VIEWER_ID, role: 'authenticated', aud: 'authenticated', exp, email: 'demo@meetin.asia' })),
    'demo-signature',
  ].join('.');
  return {
    access_token: token,
    token_type: 'bearer',
    expires_in: exp - now,
    expires_at: exp,
    refresh_token: 'demo-refresh-token',
    user: { id: VIEWER_ID, aud: 'authenticated', role: 'authenticated', email: 'demo@meetin.asia', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
  };
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
};

function json(route: Route, body: unknown, status = 200, extra: Record<string, string> = {}) {
  return route.fulfill({ status, contentType: 'application/json', headers: { ...CORS, ...extra }, body: JSON.stringify(body) });
}

async function mock(context: BrowserContext) {
  // Anything else under /api answers {} so a page never waits on the network.
  await context.route(/\/api\//, (route) => json(route, {}));
  await context.route(/\/api\/discover/, (route) => json(route, { viewer, favoriteIds: [], sparkedIds: [], profiles: discoverProfiles }));
  await context.route(/\/api\/moments\/fresh/, (route) => json(route, { latest: null }));
  await context.route(/\/api\/moments(\?.*)?$/, (route) => {
    const map = new URL(route.request().url()).searchParams.get('map') === '1';
    return json(route, { moments: map ? mapMoments : feedMoments, nextCursor: null });
  });
  // The database and sign-in service: the demo viewer, and nothing else.
  await context.route(/supabase\.co\//, (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const url = new URL(request.url());
    if (url.pathname.startsWith('/auth/v1/user')) return json(route, demoSession().user);
    if (url.pathname.startsWith('/auth/v1/')) return json(route, demoSession());
    if (url.pathname.startsWith('/rest/v1/rpc/')) return json(route, {});
    if (url.pathname.startsWith('/rest/v1/')) {
      const table = url.pathname.split('/')[3];
      const single = (request.headers()['accept'] || '').includes('vnd.pgrst.object');
      if (table === 'profiles') return json(route, single ? viewerRow : [viewerRow]);
      return single ? json(route, { code: 'PGRST116', details: 'The result contains 0 rows', message: 'no rows' }, 406) : json(route, []);
    }
    return json(route, {});
  });
}

async function launch(): Promise<Browser> {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      // try the next installed browser
    }
  }
  throw new Error('Install Microsoft Edge or Google Chrome (playwright-core drives an installed browser).');
}

async function settle(page: Page, extraMs: number) {
  // Dev-only overlays (Next's build indicator) must not appear in the picture.
  await page.addStyleTag({ content: 'nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-tools-button] { display: none !important; }' }).catch(() => {});
  // The pictures in view have loaded.
  await page
    .waitForFunction(
      () => [...document.images].filter((i) => i.getBoundingClientRect().top < window.innerHeight).every((i) => i.complete && i.naturalWidth > 0),
      undefined,
      { timeout: 30_000 }
    )
    .catch(() => {});
  await page.waitForTimeout(extraMs);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await ensureServer();
  const browser = await launch();
  try {
    const supabaseUrl = envValue('NEXT_PUBLIC_SUPABASE_URL') || 'https://placeholder-project.supabase.co';
    const ref = new URL(supabaseUrl).hostname.split('.')[0];
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      locale: 'en-US',
      timezoneId: 'Asia/Manila',
      colorScheme: 'light',
    });
    const host = new URL(BASE).hostname;
    await context.addCookies([
      { name: 'ail_showcase', value: '1', domain: host, path: '/' },
      { name: 'ail_returning', value: '1', domain: host, path: '/' },
      // @supabase/ssr keeps the session in a cookie: "base64-" plus the base64url JSON.
      { name: `sb-${ref}-auth-token`, value: `base64-${b64url(JSON.stringify(demoSession()))}`, domain: host, path: '/' },
    ]);
    // First-run prompts the demo member has already dealt with (the notification sheet would cover the screens).
    await context.addInitScript(() => {
      try {
        localStorage.setItem('mia_notif_prompt_reset_v1', '1');
        localStorage.setItem('mia_notif_prompt_dismissed', '1');
      } catch {
        // storage unavailable: nothing to preset
      }
    });
    await mock(context);
    const page = await context.newPage();
    page.setDefaultTimeout(120_000);

    const shot = async (file: string) => {
      const target = path.join(OUT, file);
      await page.screenshot({ path: target, type: 'png' });
      console.log('wrote', path.relative(process.cwd(), target));
    };

    // 1. Discover
    await page.goto(`${BASE}/discover`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
    await page.getByText('Ploy').first().waitFor({ timeout: 120_000 });
    await settle(page, 2000);
    await shot('discover.png');

    // 2. Spot map: wait for the pins, then for the tiles and the palette fade-in
    await page.goto(`${BASE}/moments/map`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
    await page.locator('.ail-pin').first().waitFor({ timeout: 120_000 });
    await settle(page, 12_000);
    // Collapse the attribution to its "i" button (it opens expanded on a first view and would sit over the tab bar).
    await page.evaluate(() => {
      document.querySelectorAll('.maplibregl-ctrl-attrib').forEach((el) => {
        el.classList.remove('maplibregl-compact-show');
        el.removeAttribute('open');
      });
    });
    await page.waitForTimeout(400);
    await shot('spot-map.png');

    // 3. Moments feed
    await page.goto(`${BASE}/moments`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
    await page.getByText('Café Lupe, Poblacion').first().waitFor({ timeout: 120_000 });
    await settle(page, 2500);
    // Scroll the app's column so the first post, its spot pill and caption sit in view.
    await page.evaluate(() => {
      const column = document.querySelector('main')?.parentElement;
      column?.scrollTo({ top: 200, behavior: 'instant' as ScrollBehavior });
    });
    await page.waitForTimeout(600);
    await shot('moments.png');
  } finally {
    await browser.close();
    stopServer(server);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
