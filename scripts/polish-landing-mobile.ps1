# Guarded landing polish: honest copy, trust badge, palette, control gradient audit.
# Phase 1 checks every anchor in memory and aborts with nothing written on any miss.
# Phase 2 writes (UTF-8, no BOM, each file keeps its own line endings).
# Phase 3 confirms every landing illustration exists and audits control gradients.
# Phase 4 runs eslint on the landing files and the production build. Safe to re-run.
# Run from the repo root: powershell -ExecutionPolicy Bypass -File scripts\polish-landing-mobile.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$hero = 'components/Hero.tsx'
$landing = 'components/HeroLanding.tsx'
$heroScript = 'scripts/update-hero.ps1'
$edits = New-Object System.Collections.ArrayList

function Get-RepoPath([string]$File) { return [IO.Path]::Combine($root, $File) }
function Add-Edit([string]$File, [string]$Old, [string]$New, [bool]$All = $false) {
  [void]$edits.Add(@{ File = $File; Old = ($Old -replace "`r`n", "`n"); New = ($New -replace "`r`n", "`n"); All = $All })
}
function Count-Ordinal([string]$Text, [string]$Find) {
  $n = 0; $i = 0
  while (($i = $Text.IndexOf($Find, $i, [StringComparison]::Ordinal)) -ge 0) { $n++; $i += $Find.Length }
  return $n
}

# ---------- Hero copy (and its generator script, so re-running that cannot undo this) ----------
foreach ($f in @($hero, $heroScript)) {
  Add-Edit $f @'
            {/* Founder Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D0CDE1] bg-[#E8E6F1]/60 px-3 py-1 text-xs font-semibold text-[#413B5E] sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-[#8574B7] animate-pulse" />
              Built by an Expat in the Philippines
            </div>
'@ @'
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D0CDE1] bg-[#E8E6F1]/40 px-3.5 py-1.5 text-xs font-semibold text-[#8574B7]">
              Photo Verified &bull; Real Connections
            </div>
'@

  Add-Edit $f @'
                Zero scam bots.
'@ @'
                Selfie-Verified Profiles.
'@

  Add-Edit $f @'
              No paywalls to chat.
'@ @'
              Free to Match &amp; Connect.
'@

  Add-Edit $f @'
built for genuine cross-border relationships.
            </p>
'@ @'
built for genuine cross-border relationships. Free members get 30 daily Sparks and 5 new chats a day; Plus offers expanded access.
            </p>
'@

  Add-Edit $f '>No chat paywalls</p>' '>Plus for expanded access</p>'

  # Three clean headline lines: never break after "Selfie-".
  Add-Edit $f '<span className="block sm:inline text-[#8574B7]">' '<span className="block sm:whitespace-nowrap text-[#8574B7]">'
  Add-Edit $f 'sm:text-4xl lg:text-5xl leading-tight' 'sm:text-4xl lg:text-[44px] leading-tight'
}

# The generator's preserved-copy list has to match the new copy.
Add-Edit $heroScript "'Built by an Expat in the Philippines', 'Real connections.', 'Zero scam bots.', 'No paywalls to chat.'," "'Photo Verified &bull; Real Connections', 'Real connections.', 'Selfie-Verified Profiles.', 'Free to Match &amp; Connect.',"
Add-Edit $heroScript "built for genuine cross-border relationships.'," "built for genuine cross-border relationships. Free members get 30 daily Sparks and 5 new chats a day; Plus offers expanded access.',"
Add-Edit $heroScript "'No chat paywalls'" "'Plus for expanded access'"

# ---------- Rest of the landing page ----------
Add-Edit $landing "title: 'Zero Bots. Real People.'," "title: 'Proactive Scam & Bot Screening',"
Add-Edit $landing 'text-[#655E72]' 'text-[#413B5E]/75' $true
Add-Edit $landing '#9A93BC' '#8574B7' $true

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
  $hits = Count-Ordinal $buf.Text $old
  if ($e.All) {
    if ($hits -gt 0) {
      $buf.Text = $buf.Text.Replace($old, $new); $buf.Changed = $true
      Write-Host "MATCH $($e.File) (${hits}x): $label"
    } elseif ((Count-Ordinal $buf.Text $new) -ge 1) {
      Write-Host "ALREADY $($e.File): $label"
    } else {
      Write-Host "MISS: $($e.File): $label"; Write-Host 'Aborted. Nothing was written.'; exit 1
    }
    continue
  }
  # Result first: an edit that extends a line keeps its anchor, so the anchor alone would re-apply it.
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

# ---------- Phase 3: illustrations, BOM, control gradients ----------
Write-Host '== Phase 3: illustrations and gradient audit'
$bad = 0
foreach ($img in @('secured.webp', 'intention.webp', 'hero-couple.webp', 'red-flags.webp', 'images/hero-pinay.png', 'korean-finger-heart.png')) {
  if (-not (Test-Path -LiteralPath ([IO.Path]::Combine($root, 'public', $img)))) { $bad++; Write-Host "MISSING public/$img" }
}
foreach ($f in @($hero, $landing)) {
  $path = Get-RepoPath $f
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
if ($bad -gt 0) { Write-Host 'FAILED: missing illustration, BOM or control gradient.'; exit 1 }

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
