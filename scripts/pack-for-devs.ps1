# Pack Hukum source for developers (excludes node_modules, .next, secrets, uploads).
# Run from repo root:  .\scripts\pack-for-devs.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root "package.json"))) {
  $root = (Get-Location).Path
}

$stamp = Get-Date -Format "yyyyMMdd-HHmm"
$outDir = Join-Path ([IO.Path]::GetTempPath()) "hukum-pack-$stamp"
$zipPath = Join-Path (Split-Path $root -Parent) "Hukum-B2B-handoff-$stamp.zip"

Write-Host "Source: $root"
Write-Host "Staging: $outDir"
Write-Host "Zip: $zipPath"

if (Test-Path $outDir) { Remove-Item -Recurse -Force $outDir }
New-Item -ItemType Directory -Path $outDir | Out-Null

$excludeDirs = @(
  "node_modules", ".next", ".git", ".vercel", "uploads", "logs", "coverage", ".turbo"
)
$excludeFiles = @(".env", ".mongo-dev-uri")

function ShouldSkip([string]$fullPath) {
  $rel = $fullPath.Substring($root.Length).TrimStart("\", "/")
  foreach ($d in $excludeDirs) {
    if ($rel -eq $d -or $rel.StartsWith("$d\") -or $rel.StartsWith("$d/")) { return $true }
  }
  $name = Split-Path $fullPath -Leaf
  if ($excludeFiles -contains $name) { return $true }
  if ($name -like "*.tsbuildinfo") { return $true }
  return $false
}

Get-ChildItem -Path $root -Recurse -Force | ForEach-Object {
  if ($_.PSIsContainer) { return }
  if (ShouldSkip $_.FullName) { return }
  $rel = $_.FullName.Substring($root.Length).TrimStart("\", "/")
  $dest = Join-Path $outDir $rel
  $destParent = Split-Path $dest -Parent
  if (-not (Test-Path $destParent)) {
    New-Item -ItemType Directory -Path $destParent -Force | Out-Null
  }
  Copy-Item -LiteralPath $_.FullName -Destination $dest -Force
}

# Ensure uploads placeholder exists for local storage
$uploadsKeep = Join-Path $outDir "uploads"
if (-not (Test-Path $uploadsKeep)) { New-Item -ItemType Directory -Path $uploadsKeep | Out-Null }
Set-Content -Path (Join-Path $uploadsKeep ".gitkeep") -Value ""

if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path (Join-Path $outDir "*") -DestinationPath $zipPath -CompressionLevel Optimal

Remove-Item -Recurse -Force $outDir
Write-Host ""
Write-Host "Created: $zipPath"
Write-Host "Tell developers: unzip -> cp .env.example .env -> npm ci -> npm run docker:up -> npm run seed -> npm run dev"
