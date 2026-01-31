# Script setup Auto-Deploy cho ZfeManage
# Usage: .\setup-auto-deploy.ps1 -GitHubUsername "USERNAME" [-RepoName "zfe-manage"]
#    Hoặc: .\setup-auto-deploy.ps1 -GitHubRepo "https://github.com/USERNAME/REPO.git"

param(
    [Parameter(ParameterSetName="ByUsername")]
    [string]$GitHubUsername,
    
    [Parameter(ParameterSetName="ByUsername")]
    [string]$RepoName = "zfe-manage",
    
    [Parameter(ParameterSetName="ByUrl", Mandatory=$true)]
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
try {
    $currentRemote = git remote get-url origin 2>$null
    if ($currentRemote -and $LASTEXITCODE -eq 0) {
        Write-Host "⚠️  Đã có remote: $currentRemote" -ForegroundColor Yellow
        $overwrite = Read-Host "Ban co muon thay doi remote? (y/n)"
        if ($overwrite -ne "y" -and $overwrite -ne "Y") {
            Write-Host "❌ Huy setup" -ForegroundColor Red
            exit 0
        }
        git remote remove origin
        Write-Host "✅ Đã xóa remote cũ" -ForegroundColor Green
    }
} catch {
    # Không có remote, tiếp tục
}

# Bước 3: Thêm GitHub remote
Write-Host ""
Write-Host "📋 Bước 3: Thêm GitHub remote..." -ForegroundColor Yellow
if ($PSCmdlet.ParameterSetName -eq "ByUsername") {
    $GitHubRepo = "https://github.com/$GitHubUsername/$RepoName.git"
}
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
Write-Host "Dam bao ban da tao repository tren GitHub va co quyen push!" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Ban co muon push code ngay bay gio? (y/n)"
if ($confirm -eq "y" -or $confirm -eq "Y") {
    Write-Host "Đang push code..." -ForegroundColor Cyan
    git push -u origin $currentBranch
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Đã push code lên GitHub thành công!" -ForegroundColor Green
    } else {
        Write-Host "Loi khi push code. Kiem tra:" -ForegroundColor Red
        Write-Host "  1. Repository da duoc tao tren GitHub chua?" -ForegroundColor Yellow
        Write-Host "  2. Ban co quyen push khong?" -ForegroundColor Yellow
        Write-Host "  3. GitHub credentials da duoc setup chua?" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Bo qua push. Ban co the push sau bang:" -ForegroundColor Yellow
    Write-Host "  git push -u origin $currentBranch" -ForegroundColor Cyan
}

# Bước 6: Hướng dẫn link với Vercel
Write-Host ""
Write-Host "📋 Bước 6: Link GitHub với Vercel" -ForegroundColor Yellow
Write-Host ""
Write-Host "Bay gio ban can:" -ForegroundColor Cyan
Write-Host "  1. Vao Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "  2. Vao project zfe-manage" -ForegroundColor White
Write-Host "  3. Vao Settings -> Git" -ForegroundColor White
Write-Host "  4. Click Connect Git Repository" -ForegroundColor White
Write-Host "  5. Chon GitHub va repository cua ban" -ForegroundColor White
Write-Host "  6. Click Connect" -ForegroundColor White
Write-Host ""
Write-Host "✅ Sau khi link xong, moi lan ban push code, Vercel se tu dong deploy!" -ForegroundColor Green
Write-Host ""
