# Guarded landing finish: removes the trust pill, tier details and feature row from the hero.
# Phase 1 checks every anchor in memory and aborts with nothing written on any miss.
# Phase 2 writes (UTF-8, no BOM, each file keeps its own line endings).
# Phase 3 confirms the clutter is gone and audits control gradients.
# Phase 4 runs eslint on the landing files and the production build. Safe to re-run.
# Run from the repo root: powershell -ExecutionPolicy Bypass -File scripts\finalize-landing.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$hero = 'components/Hero.tsx'
$landing = 'components/HeroLanding.tsx'
$heroScript = 'scripts/update-hero.ps1'
$edits = New-Object System.Collections.ArrayList

function Get-RepoPath([string]$File) { return [IO.Path]::Combine($root, $File) }
# $Done is text that only exists after the edit; for removals it is text that must be gone.
function Add-Edit([string]$File, [string]$Old, [string]$New) {
  [void]$edits.Add(@{ File = $File; Old = ($Old -replace "`r`n", "`n"); New = ($New -replace "`r`n", "`n"); Gone = $null })
}
function Add-Removal([string]$File, [string]$Old, [string]$Gone) {
  [void]$edits.Add(@{ File = $File; Old = ($Old -replace "`r`n", "`n"); New = ''; Gone = $Gone })
}
function Count-Ordinal([string]$Text, [string]$Find) {
  $n = 0; $i = 0
  while (($i = $Text.IndexOf($Find, $i, [StringComparison]::Ordinal)) -ge 0) { $n++; $i += $Find.Length }
  return $n
}

# Applied to the hero and its generator script, so re-running that script cannot restore this copy.
foreach ($f in @($hero, $heroScript)) {
  Add-Removal $f @'
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D0CDE1] bg-[#E8E6F1]/40 px-3.5 py-1.5 text-xs font-semibold text-[#8574B7]">
              Photo Verified &bull; Real Connections
            </div>

'@ 'Trust badge */}'

  Add-Edit $f '<h1 className="mt-4 text-2xl font-black' '<h1 className="text-2xl font-black'

  Add-Edit $f '              Tired of dating apps overrun by catfishes, GCash begging, and $30 monthly fees just to read a simple message? Asians in Love is a lightweight, verified platform built for genuine cross-border relationships. Free members get 30 daily Sparks and 5 new chats a day; Plus offers expanded access.' '              Asians in Love is a lightweight, verified platform built for genuine cross-border relationships.'

  Add-Removal $f @'

            {/* Value Guarantees / Badges */}
            <div className="mt-7 grid grid-cols-3 gap-2 border-t border-[#E8E6F1] pt-5 text-center sm:text-left">
              <div>
                <p className="text-xs font-bold text-[#413B5E] sm:text-sm">Free to Match &amp; Connect</p>
                <p className="text-[11px] text-[#413B5E]/65">Plus for expanded access</p>
              </div>
              <div className="border-x border-[#E8E6F1] px-1 sm:px-2">
                <p className="text-xs font-bold text-[#413B5E] sm:text-sm">Verified</p>
                <p className="text-[11px] text-[#413B5E]/65">Anti-scam checks</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#413B5E] sm:text-sm">Mobile Web</p>
                <p className="text-[11px] text-[#413B5E]/65">No app install</p>
              </div>
            </div>
'@ 'Value Guarantees'
}

# The generator's preserved-copy list has to match the new copy.
Add-Edit $heroScript "  'Photo Verified &bull; Real Connections', 'Real connections.'," "  'Real connections.',"
Add-Edit $heroScript "  'Tired of dating apps overrun by catfishes, GCash begging, and `$30 monthly fees just to read a simple message? Asians in Love is a lightweight, verified platform built for genuine cross-border relationships. Free members get 30 daily Sparks and 5 new chats a day; Plus offers expanded access.'," "  'Asians in Love is a lightweight, verified platform built for genuine cross-border relationships.',"
Add-Edit $heroScript "'By joining you agree to our Terms', 'Free to Match &amp; Connect', 'Plus for expanded access', 'Verified', 'Anti-scam checks', 'Mobile Web', 'No app install'" "'By joining you agree to our Terms', 'Verified', 'Anti-scam checks'"

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
  if ($e.Gone) {
    # A removal keeps the blank line that follows or precedes its block, as the anchor defines.
    $old = ($e.Old -replace "`n", $buf.Eol)
    if ($e.Old.StartsWith("`n")) { $old = $old.TrimEnd("`r", "`n") }
    $done = (Count-Ordinal $buf.Text $e.Gone) -eq 0
    $new = ''
  } else {
    $new = $e.New.TrimEnd("`n") -replace "`n", $buf.Eol
    $done = (Count-Ordinal $buf.Text $new) -ge 1
  }
  $label = ($e.Old.Trim() -split "`n")[0]
  if ($label.Length -gt 90) { $label = $label.Substring(0, 90) + '...' }
  $hits = Count-Ordinal $buf.Text $old
  if ($done) {
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

# ---------- Phase 3: confirm removals, BOM, control gradients ----------
Write-Host '== Phase 3: confirm removals and audit gradients'
$bad = 0
$forbidden = @('Photo Verified', 'Trust badge', 'Built by an Expat', 'Free members', '30 daily Sparks', '5 new chats', 'expanded access', 'Value Guarantees', 'Tired of dating apps', 'paywall')
foreach ($f in @($hero, $landing)) {
  $path = Get-RepoPath $f
  $text = [IO.File]::ReadAllText($path)
  foreach ($word in $forbidden) {
    if ($text.IndexOf($word, [StringComparison]::OrdinalIgnoreCase) -ge 0) { $bad++; Write-Host "STILL PRESENT ${f}: $word" }
  }
  $b = [IO.File]::ReadAllBytes($path)
  if ($b.Length -ge 3 -and $b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF) { $bad++; Write-Host "BOM $f" }
  $lines = [IO.File]::ReadAllLines($path)
  for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -notmatch 'bg-gradient-|bg-linear-|linear-gradient\(') { continue }
    # Photo scrims and aria-hidden background halos are not controls.
    $decorative = ($lines[$i] -match 'from-black') -or ($lines[$i] -match 'aria-hidden') -or ($i -gt 0 -and $lines[$i - 1] -match 'aria-hidden')
    if (-not $decorative) { $bad++; Write-Host "ROGUE ${f}:$($i + 1) $($lines[$i].Trim())" }
  }
}
Write-Host "Problems: $bad."
if ($bad -gt 0) { Write-Host 'FAILED: clutter, BOM or control gradient found.'; exit 1 }

# ---------- Phase 4: lint and build ----------
Write-Host '== Phase 4: lint and build'
Set-Location -LiteralPath $root
# Windows PowerShell treats anything a native command writes to stderr (build warnings) as an error.
$ErrorActionPreference = 'Continue'
npx eslint components/Hero.tsx components/HeroLanding.tsx app/page.tsx
$lintExit = $LASTEXITCODE
npm run build *> build-output.txt
$buildExit = $LASTEXITCODE
$errors = Select-String -Path build-output.txt -Pattern 'Failed to compile', 'Type error', 'Expected', 'Module parse'
if ($errors) { $errors | ForEach-Object { Write-Host $_.Line } }
Get-Content build-output.txt -Tail 6
if ($lintExit -ne 0) { Write-Host 'LINT FAILED'; exit 1 }
if ($buildExit -ne 0 -or $errors) { Write-Host 'BUILD FAILED'; exit 1 }
Write-Host 'LINT AND BUILD CLEAN'
