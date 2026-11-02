#!/usr/bin/env node
/**
 * Security + trust fixes - 2026-11-02
 *
 * Run from the project root (PowerShell):
 *     node patches\security-2026-11-02\apply.cjs            # apply
 *     node patches\security-2026-11-02\apply.cjs --check    # dry run, changes nothing
 *     npm run build
 *
 * - Every edit is anchored on exact text. If ANY anchor does not match exactly once,
 *   NOTHING is written and the script tells you which one failed.
 * - Each changed file is backed up next to itself as <name>.bak (already gitignored).
 * - Line endings (CRLF / LF) of every file are preserved.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const HERE = __dirname;
const DRY = process.argv.includes('--check');

if (!fs.existsSync(path.join(ROOT, 'package.json')) || !fs.existsSync(path.join(ROOT, 'app'))) {
  console.error('Run this from the project root (the folder that contains package.json and app\\).');
  process.exit(1);
}

const MARKER = path.join(HERE, '.applied');
if (fs.existsSync(MARKER) && !process.argv.includes('--force') && !DRY) {
  console.log('This patch was already applied (marker: ' + MARKER + ').');
  console.log('To apply again, restore the .bak files first, delete the marker, or pass --force.');
  process.exit(0);
}

const norm = (s) => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/^﻿/, '');
const usesCRLF = (raw) => (raw.match(/\r\n/g) || []).length > (raw.match(/(?<!\r)\n/g) || []).length;

const plan = new Map(); // rel -> { original, text, crlf, notes[] }
const errors = [];

function load(rel) {
  if (!plan.has(rel)) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
      errors.push(`${rel}: file not found`);
      return null;
    }
    const raw = fs.readFileSync(full, 'utf8');
    plan.set(rel, { original: raw, text: norm(raw.replace(/^﻿/, '')), crlf: usesCRLF(raw), notes: [], bom: raw.startsWith('﻿') });
  }
  return plan.get(rel);
}

/** edit(file, [{ find, replace, count = 1 }]) */
function edit(rel, edits) {
  const f = load(rel);
  if (!f) return;
  for (const [i, e] of edits.entries()) {
    const find = norm(e.find);
    const count = e.count ?? 1;
    const parts = f.text.split(find);
    const found = parts.length - 1;
    if (found !== count) {
      errors.push(`${rel}: edit #${i + 1} expected ${count} match(es) but found ${found}\n      anchor starts: ${JSON.stringify(find.slice(0, 90))}`);
      continue;
    }
    f.text = parts.join(norm(e.replace));
    f.notes.push(e.note || `edit #${i + 1}`);
  }
}

/** Whole-file replacement from patches/.../files/<rel> */
function replaceFile(rel) {
  const src = path.join(HERE, 'files', rel);
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(src)) { errors.push(`${rel}: replacement missing from patch folder`); return; }
  const exists = fs.existsSync(full);
  const raw = exists ? fs.readFileSync(full, 'utf8') : '';
  plan.set(rel, {
    original: exists ? raw : null,
    text: norm(fs.readFileSync(src, 'utf8')),
    crlf: exists ? usesCRLF(raw) : false,
    bom: false,
    notes: [exists ? 'replaced' : 'created'],
  });
}

// ---------------------------------------------------------------------------
// 1. Whole-file replacements (rewritten routes / helpers)
// ---------------------------------------------------------------------------
[
  'lib/adminSecurity.ts',
  'lib/adminAlerts.ts',
  'app/api/admin/verify/route.ts',
  'app/api/admin/review-photo/route.ts',
  'app/api/verify/location/route.ts',
  'app/api/verify/submit/route.ts',
  'app/api/account/delete/route.ts',
  'app/api/plus/webhook/route.ts',
  'app/api/plus/checkout/route.ts',
  'app/api/plus/passport/route.ts',
  'app/api/messages/quota/route.ts',
  'app/api/users/check-username/route.ts',
].forEach(replaceFile);

// ---------------------------------------------------------------------------
// 2. Anchored edits
// ---------------------------------------------------------------------------

// Verification-token signing key: never use the raw service-role key as an HMAC secret.
edit('lib/verify/token.ts', [{
  find: `export function getSigningSecret(): string {
  const secret = process.env.KYC_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error('KYC_SIGNING_SECRET or SUPABASE_SERVICE_ROLE_KEY not configured');
  }
  return secret;
}`,
  replace: `export function getSigningSecret(): string {
  if (process.env.KYC_SIGNING_SECRET) return process.env.KYC_SIGNING_SECRET;
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) {
    throw new Error('KYC_SIGNING_SECRET or SUPABASE_SERVICE_ROLE_KEY not configured');
  }
  // Purpose-bound key derived from the service key, so the raw key is never used as an HMAC secret.
  // (Set KYC_SIGNING_SECRET to a random string to replace this fallback.)
  return createHmac('sha256', base).update('asiansin-love:kyc-signing:v1').digest('hex');
}`,
}]);

// Root layout: stop hiding Supabase security warnings, allow pinch-zoom, add share metadata.
edit('app/layout.tsx', [
  {
    note: 'remove console.warn suppression',
    find: `// SUPPRESS_NO_LOG_WARN: quiet the repeated Supabase getSession advisory in dev logs
const origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('could be insecure') || msg.includes('supabase.auth.getUser() instead')) return;
  origWarn(...args);
};
`,
    replace: ``,
  },
  {
    note: 'allow pinch-zoom (accessibility)',
    find: `  maximumScale: 1,
  userScalable: false,
`,
    replace: ``,
  },
  {
    note: 'Open Graph / Twitter metadata',
    find: `export const metadata: Metadata = {
  title: 'Asians in Love - Real Connections',
  description: 'Meet genuine singles across Southeast Asia. Safe, real connections with sparks, chats, and meaningful relationships.',
};`,
    replace: `const SITE_TITLE = 'Asians in Love - Real Connections';
const SITE_DESCRIPTION =
  'Meet genuine singles across Southeast Asia. Safe, real connections with sparks, chats, and meaningful relationships.';

export const metadata: Metadata = {
  metadataBase: new URL('https://asiansin.love'),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: 'https://asiansin.love',
    siteName: 'Asians in Love',
    type: 'website',
    locale: 'en_US',
    // TODO: add images: [{ url: '/og.jpg', width: 1200, height: 630 }] once you have a 1200x630 share image.
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};`,
  },
]);

// Middleware: also require login for pages that need an account.
edit('middleware.ts', [
  {
    find: `const PROTECTED_PREFIXES = ['/discover', '/sparks', '/messages', '/profile', '/chat', '/settings'];`,
    replace: `const PROTECTED_PREFIXES = [
  '/discover', '/sparks', '/messages', '/profile', '/chat', '/settings',
  '/favorites', '/notifications', '/verify',
];`,
  },
  {
    find: `    '/settings/:path*',
    '/admin/:path*',`,
    replace: `    '/settings/:path*',
    '/favorites/:path*',
    '/notifications/:path*',
    '/verify/:path*',
    '/admin/:path*',`,
  },
]);

// Photo upload: check real file contents, and write moderation state with the service role.
edit('app/api/photos/upload/route.ts', [
  {
    find: `const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];`,
    replace: `const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** The browser-supplied MIME type is not trusted: check the file's actual leading bytes. */
function matchesImageSignature(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === 'image/png') return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === 'image/webp') return buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
  return false;
}`,
  },
  {
    find: `    const buffer = Buffer.from(arrayBuffer);`,
    replace: `    const buffer = Buffer.from(arrayBuffer);
    if (!matchesImageSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: 'File contents do not match an allowed image format' },
        { status: 400 }
      );
    }`,
  },
  {
    note: 'avatar_status is a protected column: write it with the service role',
    find: `    const { error: profileUpdateError } = await authenticatedClient`,
    replace: `    const { error: profileUpdateError } = await serviceClient`,
  },
]);

// Discover feed: other members' coordinates are rounded (~1 km), never exact.
edit('app/api/discover/route.ts', [{
  find: `          latitude: row.latitude ?? null,
          longitude: row.longitude ?? null,
          location_source: row.location_source || 'self_reported',`,
  replace: `          // Other members' exact coordinates never leave the server: rounded to ~1 km.
          latitude: row.latitude == null || !Number.isFinite(Number(row.latitude)) ? null : Math.round(Number(row.latitude) * 100) / 100,
          longitude: row.longitude == null || !Number.isFinite(Number(row.longitude)) ? null : Math.round(Number(row.longitude) * 100) / 100,
          location_source: row.location_source || 'self_reported',`,
}]);

// Reports: verify the session with the auth server (getUser), not just the cookie (getSession).
edit('app/api/users/report/route.ts', [
  {
    find: `  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });`,
    replace: `  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });`,
  },
  { find: `session.user.id`, replace: `user.id`, count: 3 },
]);

// Verification UI: submissions are now "pending review" instead of instantly verified.
edit('app/verify/page.tsx', [
  {
    find: `  const [result, setResult] = useState<'approved' | 'denied' | null>(null);`,
    replace: `  const [result, setResult] = useState<'approved' | 'denied' | null>(null);
  const [pendingReview, setPendingReview] = useState(false);`,
  },
  {
    find: `      const verified = Boolean(data.verified);
      setResult(verified ? 'approved' : 'denied');
      setSuccess(true);
      if (verified) {
        setTimeout(() => router.push('/discover'), 2400);
      }`,
    replace: `      const verified = Boolean(data.verified);
      const pending = Boolean(data.pending);
      setPendingReview(pending);
      setResult(verified || pending ? 'approved' : 'denied');
      setSuccess(true);
      if (verified || pending) {
        setTimeout(() => router.push('/discover'), pending ? 3500 : 2400);
      }`,
  },
  {
    find: `              <h2 className="text-xl font-medium text-[#1C1924]">You are verified!</h2>
              <p className="text-sm text-[#6C637B] leading-relaxed">
                Your liveness scan passed and your verified badge is now live on your profile.
                Taking you back to Discover...
              </p>`,
    replace: `              <h2 className="text-xl font-medium text-[#1C1924]">
                {pendingReview ? 'Submitted for review' : 'You are verified!'}
              </h2>
              <p className="text-sm text-[#6C637B] leading-relaxed">
                {pendingReview
                  ? 'Thanks! Our team will review your photos and your verified badge will appear on your profile once approved. Taking you back to Discover...'
                  : 'Your liveness scan passed and your verified badge is now live on your profile. Taking you back to Discover...'}
              </p>`,
  },
]);

edit('components/GestureVerifyModal.tsx', [
  {
    find: `      if (res.ok && data.verified) {
        setAppPhase('approved');
        setStatusMessage('Pose verification confirmed! Your profile is verified.');`,
    replace: `      if (res.ok && (data.verified || data.pending)) {
        setAppPhase('approved');
        setStatusMessage(
          data.pending
            ? 'Submitted! Our team will review your photos and your verified badge will appear once approved.'
            : 'Pose verification confirmed! Your profile is verified.'
        );`,
  },
  {
    find: `<CheckCircle2 className="w-4 h-4" /> Identity Verified`,
    replace: `<CheckCircle2 className="w-4 h-4" /> {statusMessage.startsWith('Submitted') ? 'Submitted for review' : 'Identity Verified'}`,
  },
]);

// Chat: when the realtime echo beats the HTTP response, don't show the same message twice.
edit('app/chat/[id]/page.tsx', [{
  find: `                  warning: resData.warning,
                  pending: false,
                }
              : m
          )
        );`,
  replace: `                  warning: resData.warning,
                  pending: false,
                }
              : m
          ).filter((m, i, all) => all.findIndex((x) => x.id === m.id) === i)
        );`,
}]);

edit('components/ChatInterface.tsx', [{
  find: `setMessages((prev) => prev.map((m) => (m.id === tempId ? confirmed : m)));`,
  replace: `setMessages((prev) =>
            prev
              .map((m) => (m.id === tempId ? confirmed : m))
              .filter((m, i, all) => all.findIndex((x) => x.id === m.id) === i)
          );`,
}]);

// Honest copy: no claims the product cannot back up yet.
edit('components/HeroLanding.tsx', [
  {
    find: `GPS and photo verification keep fakes out. Every profile you see is a real person, where they say they are.`,
    replace: `Photo verification and manual profile review help keep fakes out. Report anyone who seems off and our team will act.`,
  },
  { find: `alt="A couple who met on asiansin.love"`, replace: `alt="A happy couple"` },
  { find: `Someone real is waiting.`, replace: `Be one of our first members.` },
]);

// "GPS" badge now means "country confirmed by the server", and the in-browser GPS button no longer self-certifies.
edit('app/profile/page.tsx', [
  {
    find: `                  setLocationSource('gps_verified');
                  setLocationVerifiedAt(new Date().toISOString());`,
    replace: `                  setLocationSource('self_reported');
                  setLocationVerifiedAt(null);`,
  },
  {
    find: `title={locationVerifiedAt ? 'GPS Verified ' + formatVerifiedDate(locationVerifiedAt) : 'GPS Verified'}`,
    replace: `title={locationVerifiedAt ? 'Location confirmed ' + formatVerifiedDate(locationVerifiedAt) : 'Location confirmed'}`,
  },
  {
    find: `                    GPS
                  </span>`,
    replace: `                    Location
                  </span>`,
  },
]);
edit('app/profile/[id]/page.tsx', [{
  find: `                  GPS
                </span>`,
  replace: `                  Location
                </span>`,
}]);

// ---------------------------------------------------------------------------
// 3. SQL migration (copied, never overwritten if it already exists)
// ---------------------------------------------------------------------------
const sqlRel = 'supabase/migrations/20261102_security_hardening.sql';
const sqlSrc = path.join(HERE, '..', '..', sqlRel);
const sqlAlt = path.join(HERE, '20261102_security_hardening.sql');

// ---------------------------------------------------------------------------
if (errors.length) {
  console.error('\nNOTHING WAS CHANGED. These anchors did not match:\n');
  errors.forEach((e) => console.error('  - ' + e));
  console.error('\nThe file probably changed since the patch was written. Send me the file and I will re-anchor it.');
  process.exit(2);
}

let changed = 0;
for (const [rel, f] of plan) {
  const out = f.crlf ? f.text.replace(/\n/g, '\r\n') : f.text;
  if (f.original !== null && out === f.original) { continue; }
  changed++;
  console.log(`${DRY ? '[dry-run] ' : ''}${f.original === null ? 'create ' : 'patch  '} ${rel}  (${f.notes.length} change${f.notes.length === 1 ? '' : 's'})`);
  if (DRY) continue;
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  if (f.original !== null) fs.writeFileSync(full + '.bak', f.original);
  fs.writeFileSync(full, (f.bom ? '﻿' : '') + out);
}

const sqlFrom = fs.existsSync(sqlSrc) ? sqlSrc : fs.existsSync(sqlAlt) ? sqlAlt : null;
const sqlDest = path.join(ROOT, sqlRel);
if (sqlFrom && !fs.existsSync(sqlDest)) {
  changed++;
  console.log(`${DRY ? '[dry-run] ' : ''}create  ${sqlRel}`);
  if (!DRY) { fs.mkdirSync(path.dirname(sqlDest), { recursive: true }); fs.copyFileSync(sqlFrom, sqlDest); }
}

if (!DRY && changed > 0) fs.writeFileSync(MARKER, new Date().toISOString() + '\n');

console.log(`\n${DRY ? 'Dry run: ' : ''}${changed} file(s) ${DRY ? 'would change' : 'changed'}.`);
if (!DRY) {
  console.log(`
Next steps
  1. npm run build
  2. Run supabase\\migrations\\20261102_security_hardening.sql in the Supabase SQL editor
  3. Add ADMIN_ACTION_SECRET (random string) and NEXT_PUBLIC_SITE_URL=https://asiansin.love to your env (local + Vercel)
  4. Re-test: signup -> onboarding -> upload photo -> verify -> send a message -> checkout (Stripe test mode)
`);
}
