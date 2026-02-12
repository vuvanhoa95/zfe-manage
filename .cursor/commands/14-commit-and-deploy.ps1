# Commit and Deploy Script (PowerShell)
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\.cursor\commands\14-commit-and-deploy.ps1 "feat: message" [-SkipLint] [-SkipBuild]

param(
  [Parameter(Mandatory = $false, Position = 0)]
  [string]$Message = "",

  [switch]$SkipLint,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host "== Commit and Deploy ==" -ForegroundColor Cyan

if ([string]::IsNullOrWhiteSpace($Message)) {
  $Message = Read-Host "Enter commit message (e.g. feat: add feature)"
  if ([string]::IsNullOrWhiteSpace($Message)) {
    Write-Host "ERROR: Commit message is required." -ForegroundColor Red
    exit 1
  }
}

Write-Host ""
Write-Host "Checking git changes..." -ForegroundColor Yellow
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
  Write-Host "No changes to commit." -ForegroundColor Yellow
  exit 0
}
Write-Host "Changes detected." -ForegroundColor Green

if (-not $SkipLint) {
  Write-Host ""
  Write-Host "Running lint..." -ForegroundColor Yellow
  npm run lint
  if ($LASTEXITCODE -ne 0) {
    $continue = Read-Host "Lint failed. Continue anyway? (y/n)"
    if ($continue -notin @("y", "Y")) {
      Write-Host "Cancelled." -ForegroundColor Yellow
      exit 1
    }
  } else {
    Write-Host "Lint passed." -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "Staging..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "Committing..." -ForegroundColor Yellow
git commit -m $Message
if ($LASTEXITCODE -ne 0) { throw "git commit failed" }

Write-Host ""
Write-Host "Pushing..." -ForegroundColor Yellow
git push
if ($LASTEXITCODE -ne 0) { throw "git push failed" }

Write-Host ""
Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
try {
  vercel --version | Out-Null

  if (-not $SkipBuild) {
    Write-Host "Testing build..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
      $continue = Read-Host "Build failed. Continue deploy anyway? (y/n)"
      if ($continue -notin @("y", "Y")) {
        Write-Host "Deploy cancelled." -ForegroundColor Yellow
        exit 1
      }
    } else {
      Write-Host "Build OK." -ForegroundColor Green
    }
  }

  vercel --prod --yes
  if ($LASTEXITCODE -ne 0) { throw "vercel deploy failed" }
  Write-Host "Deploy OK." -ForegroundColor Green
} catch {
  Write-Host "Vercel CLI not found or deploy failed. Skipping deploy." -ForegroundColor Yellow
  Write-Host "Tip: Install Vercel CLI: npm i -g vercel" -ForegroundColor Cyan
  Write-Host "Tip: If Git Integration is enabled, Vercel will deploy after push." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
