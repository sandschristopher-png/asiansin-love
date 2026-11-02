# Security + trust fixes (2026-11-02)

## Run it (PowerShell, from the project root)

```powershell
cd $HOME\asiansin-love
node .\patches\security-2026-11-02\apply.cjs --check   # dry run: lists what would change, writes nothing
node .\patches\security-2026-11-02\apply.cjs           # applies; backs each changed file up as <file>.bak
npm run build
```

If any anchor does not match exactly, **nothing is written** and the script names the one that failed.
Roll back a file with `Copy-Item -LiteralPath '.\app\layout.tsx.bak' -Destination '.\app\layout.tsx' -Force`
(use `-LiteralPath` for paths containing `[id]`).

## Order that avoids breakage
1. Apply the code patch, `npm run build`, deploy.
2. **Then** run `supabase\migrations\20261102_security_hardening.sql` in the Supabase SQL editor.
   (The new code works with or without the SQL; the old code does not work with the SQL.)

## New environment variables (local `.env.local` **and** Vercel)
| Name | Value |
|---|---|
| `ADMIN_ACTION_SECRET` | any long random string (signs Telegram approve/reject links) |
| `NEXT_PUBLIC_SITE_URL` | `https://asiansin.love` (links in Telegram messages point here) |
| `KYC_SIGNING_SECRET` | optional: another random string for verification tokens |

Generate one in PowerShell: `[Convert]::ToBase64String((1..48 | % { Get-Random -Max 256 }) -as [byte[]])`

Also confirm in Supabase > Storage that the `verifications` bucket is **private** (the SQL forces it).

## What changed
**Database (SQL)**: members can no longer edit `is_admin`, `is_plus`, `is_verified`, `verification_status`,
`avatar_status`, `reputation_*`, `travel_*`, `location_verified_at` (or self-award `gps_verified`);
age is derived from birthdate and 18+ is enforced; moderation/admin functions are service-role only;
members can't insert messages directly or see quarantined ones (also over Realtime); profiles require login;
`verifications` bucket private.

**Code**: signed + expiring + confirm-click admin links (`lib/adminSecurity.ts`, `lib/adminAlerts.ts`,
`api/admin/verify`, `api/admin/review-photo`) that actually write with the service role and handle gallery
photos; photo verification now goes to **pending + Telegram review** instead of instant badge
(`api/verify/submit`, `verify/page.tsx`, `GestureVerifyModal.tsx`); location check requires login and the
country must match (`api/verify/location`); Stripe webhook handles plan tier with fallbacks and returns 500 so
Stripe retries on DB failure (`api/plus/webhook`, `api/plus/checkout`); account deletion cancels Stripe
subscriptions first; `getSession` -> `getUser` in reports; photo upload checks real file bytes; discover rounds
other members' coordinates; chat duplicate-bubble race; username check works (`GET`) and no longer needs
public profile reads; honest homepage copy; zoom allowed; Open Graph tags; middleware covers more pages;
removed the code that hid Supabase's own security warnings.
