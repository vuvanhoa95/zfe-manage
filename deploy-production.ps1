# Deploy Production Script cho ZfeManage
# Usage: .\deploy-production.ps1 [--skip-build] [--skip-seed] [--preview] [--auto-commit] [--auto-push]

param(
    [switch]$SkipBuild,
    [switch]$SkipSeed,
    [switch]$Preview,
    [switch]$AutoCommit,
    [switch]$AutoPush
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Bắt đầu deploy production cho ZfeManage" -ForegroundColor Cyan
Write-Host ""

# Bước 0: Kiểm tra prerequisites
Write-Host "📋 Bước 0: Kiểm tra prerequisites..." -ForegroundColor Yellow

# Kiểm tra Git (nếu cần auto commit)
if ($AutoCommit -or $AutoPush) {
    try {
        $gitVersion = git --version 2>&1
        Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Git chưa được cài đặt. Không thể auto commit." -ForegroundColor Red
        exit 1
    }
}

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

# Bước 6.5: Auto commit (nếu được bật)
if ($AutoCommit -or $AutoPush) {
    Write-Host ""
    Write-Host "📝 Bước 6.5: Kiểm tra và commit changes..." -ForegroundColor Yellow
    
    # Kiểm tra có thay đổi chưa commit không
    $status = git status --porcelain
    if ($status) {
        Write-Host "📋 Phát hiện thay đổi chưa commit:" -ForegroundColor Cyan
        git status --short
        
        # Tạo commit message với timestamp
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "Auto commit before deploy - $timestamp"
        
        if ($AutoCommit) {
            $confirm = Read-Host "Bạn có muốn commit các thay đổi này? (y/n)"
            if ($confirm -eq "y" -or $confirm -eq "Y") {
                git add .
                git commit -m $commitMessage
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Đã commit thành công" -ForegroundColor Green
                } else {
                    Write-Host "⚠️  Commit có thể đã thất bại hoặc không có gì để commit" -ForegroundColor Yellow
                }
            }
        } else {
            # Auto commit không cần xác nhận
            git add .
            git commit -m $commitMessage
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Đã auto commit thành công" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Không có thay đổi để commit" -ForegroundColor Yellow
            }
        }
        
        # Auto push nếu được bật
        if ($AutoPush) {
            Write-Host ""
            Write-Host "📤 Đang push lên remote..." -ForegroundColor Yellow
            $currentBranch = git branch --show-current
            git push origin $currentBranch
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Đã push thành công lên $currentBranch" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Push có thể đã thất bại. Kiểm tra lại." -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "✅ Không có thay đổi để commit" -ForegroundColor Green
    }
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
Write-Host "  [ ] Kiểm tra Build Logs trên Vercel Dashboard"
Write-Host "  [ ] Kiểm tra Function Logs"
Write-Host "  [ ] Test đăng nhập"
Write-Host "  [ ] Test các tính năng chính"
Write-Host ""
