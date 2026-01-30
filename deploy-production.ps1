# Deploy Production Script cho ZfeManage
# Usage: .\deploy-production.ps1 [--skip-build] [--skip-seed] [--preview]

param(
    [switch]$SkipBuild,
    [switch]$SkipSeed,
    [switch]$Preview
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Bắt đầu deploy production cho ZfeManage" -ForegroundColor Cyan
Write-Host ""

# Bước 0: Kiểm tra prerequisites
Write-Host "📋 Bước 0: Kiểm tra prerequisites..." -ForegroundColor Yellow

# Kiểm tra Vercel CLI
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✅ Vercel CLI: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI chưa được cài đặt. Chạy: npm i -g vercel" -ForegroundColor Red
    exit 1
}

# Kiểm tra đã login chưa
try {
    vercel whoami | Out-Null
    Write-Host "✅ Đã login vào Vercel" -ForegroundColor Green
} catch {
    Write-Host "❌ Chưa login vào Vercel. Chạy: vercel login" -ForegroundColor Red
    exit 1
}

# Kiểm tra project đã link chưa
if (-not (Test-Path .vercel)) {
    Write-Host "⚠️  Project chưa được link với Vercel. Đang link..." -ForegroundColor Yellow
    vercel link
}

# Bước 1: Pull environment variables
Write-Host ""
Write-Host "📥 Bước 1: Pull environment variables..." -ForegroundColor Yellow
vercel env pull .env.local

if (-not (Test-Path .env.local)) {
    Write-Host "❌ Không thể pull environment variables" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Đã pull environment variables" -ForegroundColor Green

# Bước 2: Install dependencies
Write-Host ""
Write-Host "📦 Bước 2: Install dependencies..." -ForegroundColor Yellow
if (-not (Test-Path node_modules)) {
    npm install
}
Write-Host "✅ Dependencies đã sẵn sàng" -ForegroundColor Green

# Bước 3: Generate Prisma Client
Write-Host ""
Write-Host "🔧 Bước 3: Generate Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lỗi khi generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client đã được generate" -ForegroundColor Green

# Bước 4: Run migrations
Write-Host ""
Write-Host "🗄️  Bước 4: Run database migrations..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lỗi khi chạy migrations" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Migrations đã được apply" -ForegroundColor Green

# Bước 5: Seed database (nếu không skip)
if (-not $SkipSeed) {
    Write-Host ""
    Write-Host "🌱 Bước 5: Seed database..." -ForegroundColor Yellow
    $seed = Read-Host "Bạn có muốn seed database? (y/n)"
    if ($seed -eq "y" -or $seed -eq "Y") {
        npx prisma db seed
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database đã được seed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Seed có thể đã có lỗi (có thể đã có dữ liệu)" -ForegroundColor Yellow
        }
    }
}

# Bước 6: Test build local (nếu không skip)
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "🏗️  Bước 6: Test build locally..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build local thất bại. Vui lòng fix lỗi trước khi deploy" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build local thành công" -ForegroundColor Green
}

# Bước 7: Deploy
Write-Host ""
if ($Preview) {
    Write-Host "🚀 Bước 7: Deploy preview to Vercel..." -ForegroundColor Yellow
    vercel --yes
} else {
    Write-Host "🚀 Bước 7: Deploy production to Vercel..." -ForegroundColor Yellow
    vercel --prod --yes
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deploy thất bại" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deploy thành công!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Checklist sau khi deploy:" -ForegroundColor Cyan
Write-Host "  [ ] Kiem tra Build Logs tren Vercel Dashboard"
Write-Host "  [ ] Kiem tra Function Logs"
Write-Host "  [ ] Test dang nhap"
Write-Host "  [ ] Test cac features chinh"
Write-Host ""
