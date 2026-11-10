# Guarded release script: chat icebreakers and first-message off-platform shield.
# Phase 1 checks every anchor in memory and aborts with nothing written on any miss.
# Phase 2 writes (UTF-8, no BOM, each file keeps its own line endings).
# Phase 3 scans the touched files for BOMs and control gradients. Phase 4 runs the production build.
# Safe to re-run: an edit whose result is already in place reports ALREADY.
# Run from the repo root: powershell -ExecutionPolicy Bypass -File scripts\apply-chat-enhancements.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$chatPage = 'app/chat/[id]/page.tsx'
$edits = New-Object System.Collections.ArrayList
$created = New-Object System.Collections.ArrayList

function Get-RepoPath([string]$File) { return [IO.Path]::Combine($root, $File) }
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
Add-NewFile 'lib/safety/shield.ts' @'
/**
 * Spots a first message trying to move the chat off the app. Advisory only: it decides whether to
 * show a reminder under the bubble and never blocks or changes delivery. Whole-word matching, so
 * "big: deal" or "online app" do not count.
 */
const OFF_PLATFORM_KEYWORDS = [
  'whatsapp',
  'telegram',
  'viber',
  'wechat',
  'line id',
  'line app',
  'skype',
  'instagram',
  'ig:',
  'wa.me',
  't.me',
];

const KEYWORD_RE = new RegExp(
  `(?<![a-z0-9])(?:${OFF_PLATFORM_KEYWORDS.map((k) => k.replace(/[.]/g, '\\.').replace(/ /g, '\\s+')).join('|')})(?![a-z0-9])`,
  'i'
);

/** 7+ digits, optionally international and spaced: +63 917 123 4567, (02) 555-1234. */
const PHONE_RE = /(?<!\d)\+?\d(?:[\s().-]{0,2}\d){6,}(?!\d)/;

export function inspectFirstMessageSafety(text: string): {
  isSuspicious: boolean;
  reason?: 'OFF_PLATFORM_KEYWORD' | 'PHONE_NUMBER';
} {
  if (typeof text !== 'string' || !text) return { isSuspicious: false };
  if (KEYWORD_RE.test(text)) return { isSuspicious: true, reason: 'OFF_PLATFORM_KEYWORD' };
  if (PHONE_RE.test(text)) return { isSuspicious: true, reason: 'PHONE_NUMBER' };
  return { isSuspicious: false };
}
'@

Add-NewFile 'components/chat/TraitIcebreakers.tsx' @'
'use client';

import React from 'react';

function cleanTraits(traits: unknown): string[] {
  if (!Array.isArray(traits)) return [];
  const byKey = new Map<string, string>();
  for (const t of traits) {
    if (typeof t !== 'string' || !t.trim()) continue;
    const key = t.trim().toLowerCase();
    if (!byKey.has(key)) byKey.set(key, t.trim());
  }
  return Array.from(byKey.values());
}

/** Shared-interest pills on an empty thread; one tap drafts an opener. Renders nothing without traits. */
export function TraitIcebreakers({
  myTraits,
  theirTraits,
  theirName,
  onSelectPrompt,
}: {
  myTraits: string[];
  theirTraits: string[];
  theirName: string;
  onSelectPrompt: (messageText: string) => void;
}) {
  const theirs = cleanTraits(theirTraits);
  const mine = new Set(cleanTraits(myTraits).map((t) => t.toLowerCase()));
  const common = theirs.filter((t) => mine.has(t.toLowerCase()));
  const hasCommon = common.length > 0;
  const shown = hasCommon ? common.slice(0, 3) : theirs.slice(0, 2);
  if (shown.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#D0CDE1] bg-[#E8E6F1]/30 backdrop-blur-md p-4 text-center shadow-xs">
      <p className="text-xs font-bold text-[#413B5E]">
        {hasCommon ? 'You Both Have in Common' : `Ask ${theirName?.trim() || 'Them'} About`}
      </p>
      <p className="mt-1 text-[11px] text-[#413B5E]/70">Tap one to start the conversation.</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {shown.map((trait) => (
          <button
            key={trait}
            type="button"
            onClick={() =>
              onSelectPrompt(
                hasCommon
                  ? `I noticed we both love ${trait}! How long have you been into that?`
                  : `I saw on your profile that you enjoy ${trait}. What got you into it?`
              )
            }
            className="inline-flex items-center gap-1.5 border border-[#D0CDE1] bg-white px-3 py-1.5 text-xs font-semibold text-[#413B5E] shadow-2xs hover:border-[#8574B7] hover:bg-[#8574B7]/5 active:scale-95 transition-all cursor-pointer rounded-full"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8574B7]" aria-hidden />
            {trait}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TraitIcebreakers;
'@

Add-NewFile 'components/chat/FirstMessageShield.tsx' @'
'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

/** Educational reminder under a first message that mentions an outside app or number. */
export function FirstMessageShield({ senderName }: { senderName: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-left shadow-2xs my-2 max-w-sm mx-auto">
      <div className="flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs font-bold text-amber-900">Safety Reminder: Off-Platform Contact</p>
          <p className="mt-0.5 text-[11px] leading-snug text-amber-800">
            {senderName} mentioned an external app or number. Commercial accounts and scammers often rush to move
            conversations off-platform. For your safety, we recommend getting to know each other on asiansin.love first.
          </p>
          <Link href="/safety" className="mt-1 inline-block text-[11px] font-semibold text-[#8574B7] hover:underline">
            Read Safety Blueprint &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FirstMessageShield;
'@

# ---------- Chat page ----------
Add-Edit $chatPage @'
import { ChatSafetyBanner } from '@/components/chat/ChatSafetyBanner';
'@ @'
import { ChatSafetyBanner } from '@/components/chat/ChatSafetyBanner';
import { TraitIcebreakers } from '@/components/chat/TraitIcebreakers';
import { FirstMessageShield } from '@/components/chat/FirstMessageShield';
import { inspectFirstMessageSafety } from '@/lib/safety/shield';
import { isPlusProfile } from '@/lib/plus';
'@

Add-Edit $chatPage @'
  const [sharedInterests, setSharedInterests] = useState<string[]>([]);
'@ @'
  const [sharedInterests, setSharedInterests] = useState<string[]>([]);
  const [myTraits, setMyTraits] = useState<string[]>([]);
  const [theirTraits, setTheirTraits] = useState<string[]>([]);
'@

# plus_enabled and membership_tier are not columns on profiles: the whole query failed, so the
# viewer's interests, reputation and Plus status never loaded in chat.
Add-Edit $chatPage @'
          .select('is_plus, plus_enabled, membership_tier, interests, languages, reputation_score')
'@ @'
          .select('is_plus, is_premium, subscription_status, current_period_end, plus_expires_at, interests, languages, reputation_score')
'@

Add-Edit $chatPage @'
      if (myProf && (myProf.is_plus || myProf.plus_enabled || ['12m', '6m', '3m', '1m'].includes(myProf.membership_tier))) {
'@ @'
      if (isPlusProfile(myProf)) {
'@

Add-Edit $chatPage @'
        setSharedInterests(shared);
'@ @'
        setSharedInterests(shared);
        setMyTraits(myInterests);
        setTheirTraits(theirInterests.filter((t) => typeof t === 'string' && t.trim().length > 0));
'@

# Icebreakers take the place of the older starter chips when the member has traits to show.
Add-Edit $chatPage @'
                {(starterChips.length > 0 || icebreakerPrompt) && (
'@ @'
                {theirTraits.length > 0 ? (
                  <div className="pt-3 max-w-[320px] mx-auto">
                    <TraitIcebreakers
                      myTraits={myTraits}
                      theirTraits={theirTraits}
                      theirName={targetInfo.name}
                      onSelectPrompt={(text) => {
                        setInputText(text);
                        const el = textareaRef.current;
                        el?.focus(); // inside the tap, so the mobile keyboard opens
                        requestAnimationFrame(() => {
                          if (!el) return;
                          el.style.height = 'auto';
                          el.style.height = Math.min(el.scrollHeight, 108) + 'px';
                        });
                      }}
                    />
                  </div>
                ) : (starterChips.length > 0 || icebreakerPrompt) && (
'@

Add-Edit $chatPage @'
                  (Boolean(msg.wasMasked) || !validateBio(msg.text || '').ok);
'@ @'
                  (Boolean(msg.wasMasked) || !validateBio(msg.text || '').ok);
                // First message received in the thread. The API masks contact details before the
                // client sees them, so a masked message counts as well as a scanner hit.
                const showFirstMessageShield =
                  !isMe &&
                  idx < EARLY_THREAD_MESSAGES &&
                  !msg.hasAudio &&
                  !messages.slice(0, idx).some((m) => m.sender !== 'me') &&
                  (Boolean(msg.wasMasked) || inspectFirstMessageSafety(msg.text || '').isSuspicious);
'@

Add-Edit $chatPage @'
                      {earlyContact && (
'@ @'
                      {showFirstMessageShield && <FirstMessageShield senderName={targetInfo.name} />}

                      {earlyContact && !showFirstMessageShield && (
'@

# ---------- Phase 1: verify everything in memory ----------
Write-Host '== Phase 1: verify anchors'
$buffers = @{}
foreach ($e in $edits) {
  if (-not $buffers.ContainsKey($e.File)) {
    $path = Get-RepoPath $e.File
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
    [IO.File]::WriteAllText((Get-RepoPath $f), $buffers[$f].Text, $utf8)
    Write-Host "PATCHED $f"
  }
}
foreach ($c in $created) {
  $path = Get-RepoPath $c.File
  $dir = Split-Path -Parent $path
  if (-not (Test-Path -LiteralPath $dir)) { [void][IO.Directory]::CreateDirectory($dir) }
  if ((Test-Path -LiteralPath $path) -and (([IO.File]::ReadAllText($path) -replace "`r`n", "`n") -eq $c.Content)) {
    Write-Host "ALREADY $($c.File)"
  } else {
    [IO.File]::WriteAllText($path, $c.Content, $utf8)
    Write-Host "CREATED $($c.File)"
  }
}

# ---------- Phase 3: BOM and gradient scan ----------
Write-Host '== Phase 3: BOM and gradient scan of touched files'
$bad = 0
$touched = @($chatPage) + @($created | ForEach-Object { $_.File })
foreach ($f in $touched) {
  $path = Get-RepoPath $f
  $b = [IO.File]::ReadAllBytes($path)
  if ($b.Length -ge 3 -and $b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF) { $bad++; Write-Host "BOM $f" }
  $n = 0
  foreach ($line in [IO.File]::ReadAllLines($path)) {
    $n++
    if ($line -match 'bg-gradient-|bg-linear-|linear-gradient\(' -and $line -notmatch 'from-black') {
      $bad++; Write-Host "ROGUE ${f}:$n $($line.Trim())"
    }
  }
}
Write-Host "Touched files: $($touched.Count). Problems: $bad."
if ($bad -gt 0) { Write-Host 'FAILED: BOM or control gradient found.'; exit 1 }

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
