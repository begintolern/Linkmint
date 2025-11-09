# tools\scan-problem-files.ps1
# Purpose: find files likely causing Next build/runtime errors.

$ErrorActionPreference = "SilentlyContinue"
$Root = (Get-Location).Path

Write-Host "Scanning in $Root`n"

function Get-TsFiles {
  Get-ChildItem -Recurse -File -Include *.ts,*.tsx | Where-Object {
    $_.FullName -notmatch "\\node_modules\\"
  }
}

$files = Get-TsFiles

# 1) Imports of next/headers
$nextHeaders = @()
foreach ($f in $files) {
  $m = Select-String -Path $f.FullName -Pattern 'from\s+"next/headers"|from\s+\'next/headers\''
  if ($m) { $nextHeaders += $f.FullName }
}
$nextHeaders = $nextHeaders | Sort-Object -Unique

# 2) Direct calls to headers() / cookies() / draftMode()
$hdrCalls = @()
foreach ($f in $files) {
  $m = Select-String -Path $f.FullName -Pattern '\bheaders\(\)|\bcookies\(\)|\bdraftMode\('
  if ($m) { $hdrCalls += $f.FullName }
}
$hdrCalls = $hdrCalls | Sort-Object -Unique

# 3) Client-only hooks in files that are NOT client components
function Is-ClientComponent([string]$path) {
  $lines = Get-Content $path -Encoding UTF8 | Where-Object { $_.Trim() -ne "" } | Select-Object -First 3
  foreach ($ln in $lines) {
    if ($ln -match '^\s*["'']use client["'']\s*;?$') { return $true }
  }
  return $false
}

$clientOnlyHooks = @()
$clientHookPattern = '\buseState\b|\buseEffect\b|\buseLayoutEffect\b|\buseRouter\b|\buseSearchParams\b|\busePathname\b'
foreach ($f in $files) {
  $m = Select-String -Path $f.FullName -Pattern $clientHookPattern
  if ($m) {
    if (-not (Is-ClientComponent $f.FullName)) {
      $clientOnlyHooks += $f.FullName
    }
  }
}
$clientOnlyHooks = $clientOnlyHooks | Sort-Object -Unique

# 4) SessionProvider usage without client boundary
$sessionProvider = @()
foreach ($f in $files) {
  $m = Select-String -Path $f.FullName -Pattern '<\s*SessionProvider\b'
  if ($m) {
    if (-not (Is-ClientComponent $f.FullName)) {
      $sessionProvider += $f.FullName
    }
  }
}
$sessionProvider = $sessionProvider | Sort-Object -Unique

# 5) API routes that use headers()/cookies() but forgot force-dynamic
$apiUsingHeadersNoDynamic = @()
foreach ($f in $files | Where-Object { $_.FullName -match "\\app\\api\\" }) {
  $usesHdr = (Select-String -Path $f.FullName -Pattern '\bheaders\(\)|\bcookies\(\)|from\s+["'']next/headers["'']')
  if ($usesHdr) {
    $hasDynamic = (Select-String -Path $f.FullName -Pattern 'export\s+const\s+dynamic\s*=\s*["'']force-dynamic["'']|export\s+const\s+fetchCache\s*=\s*["'']force-no-store["'']|export\s+const\s+revalidate\s*=\s*0')
    if (-not $hasDynamic) {
      $apiUsingHeadersNoDynamic += $f.FullName
    }
  }
}
$apiUsingHeadersNoDynamic = $apiUsingHeadersNoDynamic | Sort-Object -Unique

# 6) Quick recent-changes list (last 2 days)
$recentChanged = git log --since="2 days ago" --name-only --pretty=format: | `
  Where-Object { $_ -and ($_ -match '\.tsx?$') } | Sort-Object -Unique

# Emit markdown report
$report = @()
$report += "# Linkmint Build Risk Scan"
$report += ""
$report += "Scanned: $Root"
$report += ""

function Section($title, $items) {
  $report += "## $title"
  if ($items -and $items.Count -gt 0) {
    foreach ($i in $items) { $report += "- $i" }
  } else {
    $report += "_None found_"
  }
  $report += ""
}

Section "Files importing **next/headers**" $nextHeaders
Section "Files calling **headers()/cookies()/draftMode()**" $hdrCalls
Section "Files using client-only hooks WITHOUT 'use client'" $clientOnlyHooks
Section "Files using **SessionProvider** WITHOUT 'use client'" $sessionProvider
Section "API routes using headers/cookies but missing **force-dynamic**" $apiUsingHeadersNoDynamic
Section "Files changed in the last 2 days" $recentChanged

$outPath = Join-Path $Root "tools\scan-report.md"
$report | Set-Content -Encoding UTF8 $outPath
Write-Host "`nReport written to $outPath"
