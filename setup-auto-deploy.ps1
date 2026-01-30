# Script setup Auto-Deploy cho ZfeManage
# Usage: .\setup-auto-deploy.ps1 -GitHubRepo "https://github.com/USERNAME/REPO.git"

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubRepo
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setup Auto-Deploy cho ZfeManage" -ForegroundColor Cyan
Write-Host ""

# Bước 1: Kiểm tra Git
Write-Host "📋 Bước 1: Kiểm tra Git..." -ForegroundColor Yellow
if (-not (Test-Path .git)) {
    Write-Host "❌ Không phải Git repository" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Git repository OK" -ForegroundColor Green

# Bước 2: Kiểm tra remote hiện tại
Write-Host ""
Write-Host "📋 Bước 2: Kiểm tra Git remote..." -ForegroundColor Yellow
$currentRemote = git remote get-url origin 2>$null
if ($currentRemote) {
    Write-Host "⚠️  Đã có remote: $currentRemote" -ForegroundColor Yellow
    $overwrite = Read-Host "Bạn có muốn thay đổi remote? (y/n)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Hủy setup" -ForegroundColor Red
        exit 0
    }
    git remote remove origin
    Write-Host "✅ Đã xóa remote cũ" -ForegroundColor Green
}

# Bước 3: Thêm GitHub remote
Write-Host ""
Write-Host "📋 Bước 3: Thêm GitHub remote..." -ForegroundColor Yellow
git remote add origin $GitHubRepo
Write-Host "✅ Đã thêm remote: $GitHubRepo" -ForegroundColor Green

# Bước 4: Kiểm tra branch
Write-Host ""
Write-Host "📋 Bước 4: Kiểm tra branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "✅ Current branch: $currentBranch" -ForegroundColor Green

# Bước 5: Push code lên GitHub
Write-Host ""
Write-Host "📋 Bước 5: Push code lên GitHub..." -ForegroundColor Yellow
Write-Host "⚠️  Đảm bảo bạn đã tạo repository trên GitHub và có quyền push!" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Bạn có muốn push code ngay bây giờ? (y/n)"
if ($confirm -eq "y" -or $confirm -eq "Y") {
    Write-Host "Đang push code..." -ForegroundColor Cyan
    git push -u origin $currentBranch
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Đã push code lên GitHub thành công!" -ForegroundColor Green
    } else {
        Write-Host "❌ Lỗi khi push code. Kiểm tra:" -ForegroundColor Red
        Write-Host "  1. Repository đã được tạo trên GitHub chưa?" -ForegroundColor Yellow
        Write-Host "  2. Bạn có quyền push không?" -ForegroundColor Yellow
        Write-Host "  3. GitHub credentials đã được setup chưa?" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "⏭️  Bỏ qua push. Bạn có thể push sau bằng:" -ForegroundColor Yellow
    Write-Host "  git push -u origin $currentBranch" -ForegroundColor Cyan
}

# Bước 6: Hướng dẫn link với Vercel
Write-Host ""
Write-Host "📋 Bước 6: Link GitHub với Vercel" -ForegroundColor Yellow
Write-Host ""
Write-Host "👉 Bây giờ bạn cần:" -ForegroundColor Cyan
Write-Host "  1. Vào Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "  2. Vào project 'zfe-manage'" -ForegroundColor White
Write-Host "  3. Vào Settings → Git" -ForegroundColor White
Write-Host "  4. Click 'Connect Git Repository'" -ForegroundColor White
Write-Host "  5. Chọn GitHub và repository của bạn" -ForegroundColor White
Write-Host "  6. Click 'Connect'" -ForegroundColor White
Write-Host ""
Write-Host "✅ Sau khi link xong, mỗi lần bạn push code, Vercel sẽ tự động deploy!" -ForegroundColor Green
Write-Host ""
