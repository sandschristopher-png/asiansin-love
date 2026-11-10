# Guarded release script: Spark allowance, Discover fast cache, card chip lock, haptics.
# Phase 1 checks every anchor in memory and aborts with nothing written on any miss.
# Phase 2 writes (UTF-8, no BOM, each file keeps its own line endings).
# Phase 3 scans for gradients on interactive controls. Phase 4 runs the production build.
# Safe to re-run: an edit whose result is already in place reports ALREADY.
# Run from the repo root: powershell -ExecutionPolicy Bypass -File scripts\apply-discover-release.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$edits = New-Object System.Collections.ArrayList
$created = New-Object System.Collections.ArrayList

function Add-Edit([string]$File, [string]$Old, [string]$New) {
  [void]$edits.Add(@{ File = $File; Old = ($Old -replace "`r`n", "`n"); New = ($New -replace "`r`n", "`n") })
}
function Add-NewFile([string]$File, [string]$Content) {
  [void]$created.Add(@{ File = $File; Content = (($Content -replace "`r`n", "`n").TrimEnd("`n") + "`n") })
}
function Count-Ordinal([string]$Text, [string]$Find) {
  $n = 0; $i = 0
  while (($i = $Text.IndexOf($Find, $i, [StringComparison]::Ordinal)) -ge 0) { $n++; $i += $Find.Length }
  return $n
}

# ---------- New files ----------
Add-NewFile 'lib/haptics.ts' @'
/**
 * Named haptic triggers. Android/desktop Chrome only (iOS Safari has no Vibration API) and silent
 * when the member turned haptics off in Settings (lib/utils/haptics.ts).
 */
import { hapticsEnabled } from '@/lib/utils/haptics';

function vibrate(pattern: number | number[]): void {
  if (typeof window === 'undefined' || !('vibrate' in navigator) || !hapticsEnabled()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw outside a user gesture; feedback is optional.
  }
}

/** Category pill click, tab switch. */
export const hapticLight = () => vibrate(10);
/** Sparking a profile, button confirmation. */
export const hapticMedium = () => vibrate(25);
/** Hitting the daily Spark quota. */
export const hapticWarning = () => vibrate([30, 40, 30]);
/** Mutual match unlock. */
export const hapticSuccess = () => vibrate([40, 60, 80]);
'@

Add-NewFile 'components/SparkLimitModal.tsx' @'
'use client';

import { AILPlusModal } from '@/components/AILPlusModal';
import { FREE_DAILY_SPARKS } from '@/lib/plusPlans';

/** Shown when /api/spark answers 429 QUOTA_EXCEEDED: the Plus sheet, titled for the daily limit. */
export function SparkLimitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AILPlusModal
      open={open}
      onClose={onClose}
      title={`You've used today's ${FREE_DAILY_SPARKS} Sparks`}
      returnPath="/discover"
    />
  );
}

export default SparkLimitModal;
'@

Add-NewFile 'supabase/migrations/20261119_spark_allowance.sql' @'
-- Daily Spark allowance, called by app/api/spark/route.ts. Safe to re-run.
-- Free members: 30 outbound Sparks per rolling 24 hours (lib/plusPlans.ts FREE_DAILY_SPARKS shows
-- the same number in the UI). Plus members and women are exempt.
-- "Plus" matches isPlusProfile in lib/plus.ts, so comped Day 1 members are exempt too.
create or replace function public.get_spark_allowance(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_daily_cap constant integer := 30;
  v_gender text;
  v_is_plus boolean;
  v_used integer;
begin
  -- Members may only read their own allowance; service-role calls have no auth.uid().
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select
    lower(trim(coalesce(p.gender, ''))),
    coalesce(p.plus_expires_at > now(), false)
      or coalesce(p.is_plus, false)
      or coalesce(p.is_premium, false)
      or (
        lower(coalesce(p.subscription_status, '')) in ('active', 'trialing')
        and (p.current_period_end is null or p.current_period_end >= now())
      )
  into v_gender, v_is_plus
  from public.profiles p
  where p.id = p_user_id;

  if coalesce(v_is_plus, false) or v_gender = 'female' then
    return jsonb_build_object('allowed', true, 'unlimited', true, 'remaining', 999);
  end if;

  select count(*)::integer
  into v_used
  from public.sparks s
  where s.sender_id = p_user_id
    and s.created_at > now() - interval '24 hours';

  return jsonb_build_object(
    'allowed', v_used < v_daily_cap,
    'unlimited', false,
    'used', v_used,
    'remaining', greatest(v_daily_cap - v_used, 0)
  );
end;
$$;

revoke all on function public.get_spark_allowance(uuid) from public, anon;
grant execute on function public.get_spark_allowance(uuid) to authenticated, service_role;
'@

# ---------- Task 1: quota ----------
Add-Edit 'lib/plusPlans.ts' @'
/** Free vs Plus daily Spark allowance (enforced in /api/spark). */
export const FREE_DAILY_SPARKS = 20;
/** Fair-use ceiling for Plus (anti-bot only; no real member sends this many in a day). */
export const PLUS_DAILY_SPARK_FAIR_USE = 500;
'@ @'
/** Free daily Sparks, for display. Enforced by public.get_spark_allowance: keep the two in sync. */
export const FREE_DAILY_SPARKS = 30;
'@

Add-Edit 'app/api/spark/route.ts' @'
import { isPlusProfile } from '@/lib/plus'
import { FREE_DAILY_SPARKS, PLUS_DAILY_SPARK_FAIR_USE } from '@/lib/plusPlans'
'@ @'
import { FREE_DAILY_SPARKS } from '@/lib/plusPlans'
'@

Add-Edit 'app/api/spark/route.ts' @'
    // Anti-spam barrier: cap outbound sparks per rolling 24h window
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: sparksLast24h } = await supabase
      .from('sparks')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .gte('created_at', twentyFourHoursAgo)

    // Free: 20 Sparks / 24h. Plus: unlimited (a fair-use ceiling only stops scripted abuse).
    const { data: me } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    const plus = isPlusProfile(me)
    const DAILY_SPARK_CAP = plus ? PLUS_DAILY_SPARK_FAIR_USE : FREE_DAILY_SPARKS
    if ((sparksLast24h ?? 0) >= DAILY_SPARK_CAP) {
      return NextResponse.json(
        {
          error: plus
            ? 'You have sent a lot of Sparks today. Take a break and try again later.'
            : `You've used your ${FREE_DAILY_SPARKS} Sparks for today. Plus members get unlimited Sparks.`,
          code: plus ? 'SPARK_FAIR_USE' : 'SPARK_LIMIT_FREE',
        },
        { status: 429 }
      )
    }
'@ @'
    // The rolling 24h allowance lives in one place: public.get_spark_allowance (free: 30; Plus
    // members and women are exempt). If the check itself fails, the Spark still goes through.
    const { data: allowance, error: allowanceError } = await supabase.rpc('get_spark_allowance', { p_user_id: user.id })
    if (allowanceError) console.error('[api/spark] allowance check failed:', allowanceError.message)
    if (!allowanceError && allowance?.allowed === false) {
      return NextResponse.json(
        {
          error: `You've used your ${FREE_DAILY_SPARKS} Sparks for today. Plus members get unlimited Sparks.`,
          code: 'QUOTA_EXCEEDED',
        },
        { status: 429 }
      )
    }
'@

Add-Edit 'components/AILPlusModal.tsx' 'send 20 Sparks a day.' 'send 30 Sparks a day.'
Add-Edit 'components/AILPlusModal.tsx' '(free: 20 a day)' '(free: 30 a day)'

Add-Edit 'app/discover/page.tsx' @'
import { PlusBadge } from '@/components/ui/PlusBadge';
import dynamic from 'next/dynamic';
'@ @'
import { PlusBadge } from '@/components/ui/PlusBadge';
import { hapticWarning } from '@/lib/haptics';
import dynamic from 'next/dynamic';
'@

Add-Edit 'app/discover/page.tsx' @'
const AILPlusModal = dynamic(() => import('@/components/AILPlusModal').then((m) => m.AILPlusModal), { ssr: false });
'@ @'
const AILPlusModal = dynamic(() => import('@/components/AILPlusModal').then((m) => m.AILPlusModal), { ssr: false });
const SparkLimitModal = dynamic(() => import('@/components/SparkLimitModal').then((m) => m.SparkLimitModal), { ssr: false });
'@

Add-Edit 'app/discover/page.tsx' @'
  const [sparkLimitNotice, setSparkLimitNotice] = useState<string | null>(null);
'@ @'
  const [sparkLimitNotice, setSparkLimitNotice] = useState<string | null>(null);
  const [sparkLimitOpen, setSparkLimitOpen] = useState(false);
'@

Add-Edit 'app/discover/page.tsx' @'
          persistCardAction(supabase, id, 'like', true);
          setSparkLimitNotice(data?.error || 'Spark limit reached - try again later.');
'@ @'
          persistCardAction(supabase, id, 'like', true);
          if (res.status === 429 && data?.code === 'QUOTA_EXCEEDED') {
            hapticWarning();
            setSparkLimitNotice(null);
            setSparkLimitOpen(true);
            return;
          }
          setSparkLimitNotice(data?.error || 'Spark limit reached - try again later.');
'@

Add-Edit 'app/discover/page.tsx' @'
      {plusModalOpen && (
'@ @'
      {sparkLimitOpen && <SparkLimitModal open onClose={() => setSparkLimitOpen(false)} />}
      {plusModalOpen && (
'@

# ---------- Task 2: fast cache ----------
Add-Edit 'app/discover/page.tsx' @'
import React, { useState, useEffect, useMemo, Suspense } from 'react';
'@ @'
import React, { useState, useEffect, useLayoutEffect, useMemo, Suspense } from 'react';
'@

Add-Edit 'app/discover/page.tsx' @'
let memoryDiscoverCache: { profiles: ProfileItem[] } | null = null;
function clearDiscoverCache() {
  memoryDiscoverCache = null;
}
function getInitialDiscoverFeed(): ProfileItem[] {
  return memoryDiscoverCache?.profiles?.length ? memoryDiscoverCache.profiles.slice() : [];
}
'@ @'
let memoryDiscoverCache: { profiles: ProfileItem[] } | null = null;
// Same server-filtered feed, surviving a reload in this tab: paints at once, then revalidates.
// Default feed only, capped so it stays well inside the sessionStorage quota.
const DISCOVER_CACHE_KEY = 'ail_discover_fast_cache_v1';
const DISCOVER_CACHE_MAX = 48;
function readDiscoverSessionCache(): ProfileItem[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(DISCOVER_CACHE_KEY) || 'null');
    return Array.isArray(parsed?.profiles) ? parsed.profiles : [];
  } catch {
    return [];
  }
}
function writeDiscoverSessionCache(profiles: ProfileItem[]) {
  try {
    if (profiles.length === 0) sessionStorage.removeItem(DISCOVER_CACHE_KEY);
    else sessionStorage.setItem(DISCOVER_CACHE_KEY, JSON.stringify({ profiles: profiles.slice(0, DISCOVER_CACHE_MAX), timestamp: Date.now() }));
  } catch {}
}
function clearDiscoverCache() {
  memoryDiscoverCache = null;
  try { sessionStorage.removeItem(DISCOVER_CACHE_KEY); } catch {}
}
function getInitialDiscoverFeed(): ProfileItem[] {
  if (memoryDiscoverCache?.profiles?.length) return memoryDiscoverCache.profiles.slice();
  return typeof window === 'undefined' ? [] : readDiscoverSessionCache();
}
'@

Add-Edit 'app/discover/page.tsx' @'
  const initialFeed = getInitialDiscoverFeed();
  const [profiles, setProfiles] = useState<ProfileItem[]>(() => initialFeed);
'@ @'
  const [profiles, setProfiles] = useState<ProfileItem[]>(getInitialDiscoverFeed);
'@

Add-Edit 'app/discover/page.tsx' @'
  const [isLoading, setIsLoading] = useState(() => initialFeed.length === 0);
'@ @'
  const [isLoading, setIsLoading] = useState(() => profiles.length === 0);
'@

Add-Edit 'app/discover/page.tsx' @'
          if (Array.isArray(payload.profiles)) {
            setCardActions((prev) => reconcileSparks(prev, payload.profiles));
            setProfiles(payload.profiles);
          }
'@ @'
          if (Array.isArray(payload.profiles)) {
            setCardActions((prev) => reconcileSparks(prev, payload.profiles));
            setProfiles(payload.profiles);
            writeDiscoverSessionCache(payload.profiles);
          }
'@

Add-Edit 'app/discover/page.tsx' @'
        if (Array.isArray(payload.profiles)) {
          setCardActions((prev) => reconcileSparks(prev, payload.profiles));
          setProfiles(payload.profiles);
        }
'@ @'
        if (Array.isArray(payload.profiles)) {
          setCardActions((prev) => reconcileSparks(prev, payload.profiles));
          setProfiles(payload.profiles);
          if (feedUrlRef.current === '/api/discover') writeDiscoverSessionCache(payload.profiles);
        }
'@

Add-Edit 'app/discover/page.tsx' @'
  const [authState, setAuthState] = useState<'loading' | 'member'>('loading');
  useEffect(() => {
'@ @'
  const [authState, setAuthState] = useState<'loading' | 'member'>('loading');
  // A cached feed paints before the network check; the getUser check below still redirects.
  useLayoutEffect(() => {
    if (memoryDiscoverCache?.profiles?.length || readDiscoverSessionCache().length > 0) setAuthState('member');
  }, []);
  useEffect(() => {
'@

Add-Edit 'app/discover/page.tsx' 'priority={cardIdx < 2}' 'priority={cardIdx < 4}'

Add-Edit 'lib/hardSignOut.ts' @'
    doomed.forEach((k) => localStorage.removeItem(k));
  }
'@ @'
    doomed.forEach((k) => localStorage.removeItem(k));
  }
  // A signed-out tab must not paint the previous member's feed.
  try { sessionStorage.removeItem('ail_discover_fast_cache_v1'); } catch {}
'@

# ---------- Task 3: chip height lock ----------
Add-Edit 'app/discover/page.tsx' @'
                      {(() => {
                        const common = sharedTraits(viewerTraits, profile);
                        if (!profile.replyPace && common.length === 0) return null;
                        return (
                          <div className="mt-1 flex flex-col items-start gap-1 min-w-0">
                            <RhythmPill field="reply_pace" value={profile.replyPace} variant="glass" />
                            <InCommonCard items={common} compact />
                          </div>
                        );
                      })()}
'@ @'
                      {/* Always rendered at one height, so names line up across both columns. */}
                      {(() => {
                        const common = sharedTraits(viewerTraits, profile);
                        return (
                          <div className="mt-1 h-6 pr-7 flex items-center gap-1.5 overflow-hidden whitespace-nowrap min-w-0">
                            <RhythmPill field="reply_pace" value={profile.replyPace} variant="glass" className="min-w-0" />
                            <InCommonCard items={common} compact />
                          </div>
                        );
                      })()}
'@

Add-Edit 'components/profile/RhythmBadges.tsx' '<span>{opt.label}</span>' '<span className="truncate">{opt.label}</span>'
Add-Edit 'components/profile/RhythmBadges.tsx' '<span className="inline-flex items-center whitespace-nowrap bg-black/40 backdrop-blur-md' '<span className="block min-w-0 truncate whitespace-nowrap bg-black/40 backdrop-blur-md'

# ---------- Task 4: haptics ----------
Add-Edit 'components/SparkHeartButton.tsx' @'
import { Heart } from 'lucide-react';
'@ @'
import { Heart } from 'lucide-react';
import { hapticMedium } from '@/lib/haptics';
'@

Add-Edit 'components/SparkHeartButton.tsx' 'spring pop + 12 ms haptic' 'spring pop + 25 ms haptic'

Add-Edit 'components/SparkHeartButton.tsx' @'
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(12);
          } catch {
            // vibration is best-effort
          }
        }
        onSpark();
'@ @'
        hapticMedium();
        onSpark();
'@

# ---------- Phase 1: verify everything in memory ----------
Write-Host '== Phase 1: verify anchors'
$buffers = @{}
foreach ($e in $edits) {
  if (-not $buffers.ContainsKey($e.File)) {
    $path = Join-Path $root $e.File
    if (-not (Test-Path -LiteralPath $path)) { Write-Host "MISS: file not found: $($e.File)"; exit 1 }
    $text = [IO.File]::ReadAllText($path)
    $buffers[$e.File] = @{ Text = $text; Eol = $(if ($text.Contains("`r`n")) { "`r`n" } else { "`n" }); Changed = $false }
  }
  $buf = $buffers[$e.File]
  $old = $e.Old.TrimEnd("`n") -replace "`n", $buf.Eol
  $new = $e.New.TrimEnd("`n") -replace "`n", $buf.Eol
  $label = ($e.Old.Trim() -split "`n")[0]
  # Result first: an edit that only adds lines keeps its anchor, so the anchor alone would re-apply it.
  $hits = Count-Ordinal $buf.Text $old
  if ((Count-Ordinal $buf.Text $new) -ge 1) {
    Write-Host "ALREADY $($e.File): $label"
  } elseif ($hits -eq 1) {
    $at = $buf.Text.IndexOf($old, [StringComparison]::Ordinal)
    $buf.Text = $buf.Text.Substring(0, $at) + $new + $buf.Text.Substring($at + $old.Length)
    $buf.Changed = $true
    Write-Host "MATCH $($e.File): $label"
  } else {
    Write-Host "MISS: $($e.File) ($hits matches): $label"
    Write-Host 'Aborted. Nothing was written.'
    exit 1
  }
}

# ---------- Phase 2: write ----------
Write-Host '== Phase 2: write'
foreach ($f in $buffers.Keys) {
  if ($buffers[$f].Changed) {
    [IO.File]::WriteAllText((Join-Path $root $f), $buffers[$f].Text, $utf8)
    Write-Host "PATCHED $f"
  }
}
foreach ($c in $created) {
  $path = Join-Path $root $c.File
  if ((Test-Path -LiteralPath $path) -and (([IO.File]::ReadAllText($path) -replace "`r`n", "`n") -eq $c.Content)) {
    Write-Host "ALREADY $($c.File)"
  } else {
    [IO.File]::WriteAllText($path, $c.Content, $utf8)
    Write-Host "CREATED $($c.File)"
  }
}

# ---------- Phase 3: gradient scan ----------
Write-Host '== Phase 3: gradients other than photo scrims'
$audited = @('app\discover\page.tsx', 'components\Navbar.tsx', 'app\favorites\page.tsx')
$roguePrimary = 0; $rogueOther = 0
foreach ($dir in @('app', 'components')) {
  Get-ChildItem -LiteralPath (Join-Path $root $dir) -Recurse -File | Where-Object { $_.Extension -eq '.tsx' } | ForEach-Object {
    $rel = $_.FullName.Substring($root.Length + 1)
    $n = 0
    foreach ($line in [IO.File]::ReadAllLines($_.FullName)) {
      $n++
      if ($line -match 'bg-gradient-|bg-linear-|linear-gradient\(' -and $line -notmatch 'from-black') {
        if ($audited -contains $rel) { $roguePrimary++; Write-Host "ROGUE ${rel}:$n $($line.Trim())" }
        else { $rogueOther++; Write-Host "REVIEW ${rel}:$n" }
      }
    }
  }
}
Write-Host "Audited files (Discover, Navbar, Favorites): $roguePrimary rogue. Elsewhere, to review: $rogueOther."
if ($roguePrimary -gt 0) { Write-Host 'FAILED: gradient found in an audited file.'; exit 1 }

# ---------- Phase 4: build ----------
Write-Host '== Phase 4: build'
Set-Location -LiteralPath $root
# Windows PowerShell treats anything a native command writes to stderr (build warnings) as an error.
$ErrorActionPreference = 'Continue'
npm run build *> build-output.txt
$buildExit = $LASTEXITCODE
$errors = Select-String -Path build-output.txt -Pattern 'Failed to compile', 'Type error', 'Expected', 'Module parse'
if ($errors) { $errors | ForEach-Object { Write-Host $_.Line } }
Get-Content build-output.txt -Tail 6
if ($buildExit -ne 0 -or $errors) { Write-Host 'BUILD FAILED'; exit 1 }
Write-Host 'BUILD CLEAN'
