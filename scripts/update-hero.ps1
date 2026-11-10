# Guarded hero update: photo card, mascot and floating badges in components/Hero.tsx.
# Checks the assets and the preserved copy first; any failure aborts with nothing written.
# Then scans for gradients and BOMs, and runs the production build. Safe to re-run.
# Run from the repo root: powershell -ExecutionPolicy Bypass -File scripts\update-hero.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$heroPath = [IO.Path]::Combine($root, 'components', 'Hero.tsx')

# ---------- Phase 1: assets ----------
Write-Host '== Phase 1: assets'
if (-not (Test-Path -LiteralPath $heroPath)) { Write-Host 'MISS: components/Hero.tsx not found. Nothing written.'; exit 1 }
if (Test-Path -LiteralPath ([IO.Path]::Combine($root, 'public', 'images', 'hero-pinay.png'))) {
  $photoSrc = '/images/hero-pinay.png'
  Write-Host 'OK public/images/hero-pinay.png'
} elseif (Test-Path -LiteralPath ([IO.Path]::Combine($root, 'public', 'hero-pinay.png'))) {
  $photoSrc = '/hero-pinay.png'
  Write-Host 'WARN hero-pinay.png is in public/, not public/images/. Using /hero-pinay.png.'
} else {
  Write-Host 'MISS: hero-pinay.png not found in public/images/ or public/. Nothing written.'; exit 1
}
if (-not (Test-Path -LiteralPath ([IO.Path]::Combine($root, 'public', 'korean-finger-heart.png')))) {
  Write-Host 'MISS: public/korean-finger-heart.png not found. Nothing written.'; exit 1
}
Write-Host 'OK public/korean-finger-heart.png'

$hero = @'
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShieldCheck } from 'lucide-react';
import { InstallAppCard } from '@/components/InstallAppCard';

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-white pt-4 pb-10 sm:pt-8 sm:pb-14 lg:py-20">
      {/* Background glow - constrained to prevent mobile horizontal scroll */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[#E8E6F1]/70 blur-3xl sm:h-96 sm:w-96 lg:h-[32rem] lg:w-[32rem]"
      />

      <div className="mx-auto w-full max-w-sm px-4 sm:max-w-2xl sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="flex flex-col items-center text-center lg:flex-row lg:items-center lg:justify-between lg:text-left lg:gap-12">

          {/* Main Content Column */}
          <div className="w-full lg:max-w-xl">

            {/* Headline */}
            <h1 className="text-2xl font-black tracking-tight text-[#413B5E] sm:text-4xl lg:text-[44px] leading-tight sm:leading-tight">
              Real connections.{' '}
              <span className="block sm:whitespace-nowrap text-[#8574B7]">
                Selfie-Verified Profiles.
              </span>{' '}
              Free to Match &amp; Connect.
            </h1>

            {/* Supporting Copy */}
            <p className="mt-3 text-sm leading-relaxed text-[#413B5E]/75 sm:mt-4 sm:text-base lg:text-lg">
              Asians in Love is a lightweight, verified platform built for genuine cross-border relationships.
            </p>

            {/* Mobile-First Action Buttons (Stacked on mobile, row on tablet/desktop) */}
            <div className="mt-6 flex flex-col gap-3 w-full sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[#8574B7] hover:bg-[#534377] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all active:scale-95"
              >
                Join Free in 30 Seconds
              </Link>
              <Link
                href="/discover"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-[#D0CDE1] bg-white px-6 py-3.5 text-sm font-medium text-[#413B5E] shadow-sm transition-all hover:bg-[#E8E6F1]/50 active:scale-95"
              >
                Explore Profiles
              </Link>
            </div>

            <p className="mt-3 text-xs text-[#413B5E]/65">
              Free to join. By joining you agree to our Terms &amp; Privacy Policy.
            </p>
            <div className="flex justify-center lg:justify-start">
              <InstallAppCard variant="hero" />
            </div>

          </div>

          {/* Photo card: overflow-visible so the badges can overlap its edges */}
          <div className="mt-10 w-full max-w-[280px] sm:max-w-xs lg:mt-0 lg:max-w-sm">
            <div className="relative overflow-visible">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-[#D0CDE1] bg-[#E8E6F1]">
                <Image
                  src="__HERO_SRC__"
                  alt="Woman smiling while using her phone on a sofa"
                  fill
                  priority
                  sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 384px"
                  className="object-cover object-center"
                />
              </div>

              {/* Top-right: Spark badge with the mascot */}
              <div className="absolute -top-4 -right-3 sm:-right-6 flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 p-2.5 shadow-md transition-transform duration-200 hover:-translate-y-0.5">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#D0CDE1] bg-white">
                  <Image
                    src="/korean-finger-heart.png"
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover object-top"
                  />
                </div>
                <div className="text-left">
                  <p className="flex items-center gap-1 text-[11px] font-bold text-[#413B5E] whitespace-nowrap">
                    <Heart className="h-3 w-3 fill-[#8574B7] text-[#8574B7]" aria-hidden />
                    Spark
                  </p>
                  <p className="text-[10px] font-medium text-[#413B5E]/70 whitespace-nowrap">3 things in common</p>
                </div>
              </div>

              {/* Bottom-left: verification badge */}
              <div className="absolute -bottom-4 -left-3 sm:-left-6 flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-2xl border border-[#D0CDE1] px-3.5 py-2 shadow-md transition-transform duration-200 hover:-translate-y-0.5">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                <div className="text-left">
                  <p className="text-[11px] font-bold text-[#413B5E] whitespace-nowrap">Verified</p>
                  <p className="text-[10px] font-medium text-[#413B5E]/70 whitespace-nowrap">Anti-scam checks</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
'@

$hero = ($hero -replace "`r`n", "`n").Replace('__HERO_SRC__', $photoSrc).TrimEnd("`n") + "`n"

# ---------- Phase 2: preserved copy ----------
Write-Host '== Phase 2: preserved copy'
$copy = @(
  'Real connections.', 'Selfie-Verified Profiles.', 'Free to Match &amp; Connect.',
  'Asians in Love is a lightweight, verified platform built for genuine cross-border relationships.',
  'Join Free in 30 Seconds', 'Explore Profiles', 'By joining you agree to our Terms', 'Verified', 'Anti-scam checks'
)
foreach ($c in $copy) {
  if (-not $hero.Contains($c)) { Write-Host "MISS: copy changed: $c. Nothing written."; exit 1 }
}
Write-Host "OK $($copy.Count) copy strings preserved"

# ---------- Phase 3: write and scan ----------
Write-Host '== Phase 3: write and scan'
[IO.File]::WriteAllText($heroPath, $hero, $utf8)
Write-Host 'PATCHED components/Hero.tsx'
$b = [IO.File]::ReadAllBytes($heroPath)
if ($b.Length -ge 3 -and $b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF) { Write-Host 'FAILED: BOM found.'; exit 1 }
$rogue = Select-String -LiteralPath $heroPath -Pattern 'bg-gradient-|bg-linear-|linear-gradient\('
if ($rogue) { $rogue | ForEach-Object { Write-Host "ROGUE line $($_.LineNumber): $($_.Line.Trim())" }; Write-Host 'FAILED: gradient found.'; exit 1 }
Write-Host 'OK no BOM, 0 gradients'

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
