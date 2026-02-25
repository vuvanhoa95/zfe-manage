$ErrorActionPreference = "Stop"

param(
  [int]$Port = 3030,
  [switch]$Full
)

function Remove-IfExists {
  param([string]$Path)
  if (Test-Path $Path) {
    Write-Host "Removing: $Path" -ForegroundColor DarkYellow
    Remove-Item -Recurse -Force $Path -ErrorAction SilentlyContinue
  }
}

Write-Host "=== Reset localhost (ZfeManage) ===" -ForegroundColor Cyan
Write-Host "Working dir: $PSScriptRoot" -ForegroundColor Gray

Set-Location $PSScriptRoot

# 1) Clear Next/Turbopack cache (hay bị lỗi 'Failed to open database')
Remove-IfExists ".next"

# 2) Optional: full clean node_modules nếu môi trường bị thiếu package liên tục
if ($Full) {
  Remove-IfExists "node_modules"
}

# 3) Install deps (đảm bảo @prisma/client, puppeteer, chromium, v.v.)
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

# 4) Prisma generate (best-effort). Trên Windows đôi khi bị EPERM do file engine bị lock.
Write-Host "Generating Prisma Client (best-effort)..." -ForegroundColor Cyan
try {
  # Xoá cache prisma client cũ để giảm lỗi rename EPERM
  Remove-IfExists "node_modules\\.prisma\\client"
  npx prisma generate
} catch {
  Write-Host "⚠️ prisma generate failed (often due to locked files). You can rerun later: npx prisma generate" -ForegroundColor Yellow
  Write-Host $_.Exception.Message -ForegroundColor DarkGray
}

# 5) Quick sanity check
Write-Host "Checking @prisma/client..." -ForegroundColor Cyan
npm ls @prisma/client | Out-Host

# 6) Start dev server
Write-Host "Starting dev server on port $Port..." -ForegroundColor Cyan
npm run dev -- -p $Port

