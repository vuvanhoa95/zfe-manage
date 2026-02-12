# Commit Changes

Commit các thay đổi vào Git repository và tự động deploy.

## Mô tả
Commit code changes với message rõ ràng và tự động deploy lên Vercel. Command này giúp bạn commit và deploy code một cách tự động và có tổ chức.

> 💡 **Tip:** Luôn review changes trước khi commit bằng `git status` và `git diff`. Đảm bảo code đã được lint và test trước khi commit.

## 🚀 Chạy Tự Động (Khuyến nghị)

Để tự động commit và deploy, chạy script PowerShell:

```powershell
# Từ thư mục root của project
.\cursor\commands\14-commit-and-deploy.ps1 "feat: mô tả thay đổi"

# Hoặc với options
.\cursor\commands\14-commit-and-deploy.ps1 "fix: sửa lỗi" -SkipLint
.\cursor\commands\14-commit-and-deploy.ps1 "chore: update deps" -SkipBuild

# Hoặc không có message (sẽ hỏi bạn nhập)
.\cursor\commands\14-commit-and-deploy.ps1
```

**Script sẽ tự động:**
1. ✅ Kiểm tra có changes không
2. ✅ Lint code (nếu không skip)
3. ✅ Stage changes
4. ✅ Commit với message
5. ✅ Push lên remote
6. ✅ Test build (nếu không skip)
7. ✅ Deploy lên Vercel production

> 💡 **Tip:** Bạn có thể tạo alias trong PowerShell để chạy nhanh hơn:
> ```powershell
> # Thêm vào $PROFILE
> function Commit-Deploy { & ".\cursor\commands\14-commit-and-deploy.ps1" $args }
> # Sau đó chỉ cần: Commit-Deploy "feat: mô tả"
> ```

## 🔗 Related Files
- **Script:** `.cursor/commands/14-commit-and-deploy.ps1` - Script tự động commit và deploy
- **Lint:** `.cursor/commands/09-lint-code.md` - Lint code trước khi commit
- **Deploy:** `.cursor/commands/12-deploy-production.md` - Deploy lên Vercel production
- **Rules:** Cursor Rules → Git Workflow (§10)

## Commands

### 1. Kiểm tra trạng thái trước khi commit

```bash
git status
git diff
```

### 2. Stage tất cả thay đổi

```bash
git add .
```

Hoặc stage từng file cụ thể:

```bash
git add <file-path>
```

### 3. Commit với message

```bash
git commit -m "feat: mô tả thay đổi"
```

### 4. Commit với message chi tiết (multi-line)

```bash
git commit -m "feat: mô tả ngắn" -m "Mô tả chi tiết về thay đổi này"
```

### 5. Commit format theo Conventional Commits

```bash
# Feature
git commit -m "feat: thêm tính năng mới"

# Bug fix
git commit -m "fix: sửa lỗi xyz"

# Documentation
git commit -m "docs: cập nhật tài liệu"

# Style/Formatting
git commit -m "style: format code"

# Refactor
git commit -m "refactor: refactor code structure"

# Performance
git commit -m "perf: cải thiện performance"

# Test
git commit -m "test: thêm unit tests"

# Chore
git commit -m "chore: update dependencies"
```

### 6. Commit và push cùng lúc

```bash
git commit -m "feat: mô tả thay đổi" && git push
```

### 7. Commit, Push và Auto Deploy

```bash
# Commit, push và deploy tự động
git commit -m "feat: mô tả thay đổi" && git push && vercel --prod
```

Hoặc sử dụng script tự động (xem phần **Auto Deploy Script** bên dưới).

## Workflow Khuyến nghị

1. **Review changes:**
   ```bash
   git status
   git diff
   ```

2. **Lint code (nếu cần):**
   ```bash
   npm run lint
   ```

3. **Stage changes:**
   ```bash
   git add .
   ```

4. **Commit:**
   ```bash
   git commit -m "feat: mô tả rõ ràng về thay đổi"
   ```

5. **Push:**
   ```bash
   git push
   ```

6. **Deploy (nếu cần auto-deploy):**
   ```bash
   vercel --prod
   ```
   
   Hoặc nếu đã setup Vercel Git integration, deploy sẽ tự động chạy khi push lên main branch.

## Lưu ý

- **Luôn viết commit message rõ ràng:** Mô tả ngắn gọn nhưng đầy đủ về thay đổi
- **Sử dụng Conventional Commits:** Giúp dễ dàng generate changelog và versioning
- **Commit thường xuyên:** Commit các thay đổi nhỏ, logic thay vì commit một lần lớn
- **Review trước khi commit:** Luôn kiểm tra `git diff` để đảm bảo không commit nhầm
- **Không commit:** 
  - File `.env` hoặc secrets
  - `node_modules/`
  - Build artifacts không cần thiết
  - Temporary files
- **Commit message nên:**
  - Bắt đầu bằng động từ (feat, fix, docs, etc.)
  - Viết bằng tiếng Việt hoặc tiếng Anh (nhất quán)
  - Mô tả "what" và "why", không chỉ "how"
- **Nếu commit nhầm:** Dùng `git commit --amend` để sửa commit message gần nhất

## Undo Commit

### Sửa commit message gần nhất
```bash
git commit --amend -m "feat: message mới"
```

### Unstage files (giữ lại changes)
```bash
git reset HEAD <file>
```

### Undo commit (giữ lại changes)
```bash
git reset --soft HEAD~1
```

### Undo commit và changes (⚠️ cẩn thận)
```bash
git reset --hard HEAD~1
```

## Auto Deploy sau khi Commit

### Option 1: Vercel Git Integration (Khuyến nghị)

Vercel tự động deploy khi bạn push code lên Git repository. Đây là cách đơn giản và an toàn nhất.

**Setup:**
1. Vào Vercel Dashboard → Project Settings → Git
2. Connect repository (GitHub/GitLab/Bitbucket)
3. Chọn branch để auto-deploy (thường là `main` hoặc `master`)
4. Mỗi lần push lên branch đó, Vercel sẽ tự động deploy

**Workflow:**
```bash
git commit -m "feat: mô tả thay đổi"
git push origin main  # Vercel tự động deploy
```

### Option 2: Script Commit và Deploy

Tạo script để commit, push và deploy trong một lệnh.

**PowerShell Script (`commit-and-deploy.ps1`):**

Tạo file `commit-and-deploy.ps1` ở root:

```powershell
# Commit and Deploy Script
# Usage: .\commit-and-deploy.ps1 "feat: mô tả thay đổi" [--skip-lint] [--skip-build]

param(
    [Parameter(Mandatory=$true)]
    [string]$Message,
    [switch]$SkipLint,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Commit và Deploy Script" -ForegroundColor Cyan
Write-Host ""

# Bước 1: Lint (nếu không skip)
if (-not $SkipLint) {
    Write-Host "🔍 Linting code..." -ForegroundColor Yellow
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Lint failed. Fix errors trước khi commit" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Lint passed" -ForegroundColor Green
}

# Bước 2: Stage changes
Write-Host ""
Write-Host "📦 Staging changes..." -ForegroundColor Yellow
git add .
Write-Host "✅ Changes staged" -ForegroundColor Green

# Bước 3: Commit
Write-Host ""
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Commit failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Committed: $Message" -ForegroundColor Green

# Bước 4: Push
Write-Host ""
Write-Host "📤 Pushing to remote..." -ForegroundColor Yellow
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Pushed to remote" -ForegroundColor Green

# Bước 5: Deploy (nếu không dùng Git integration)
Write-Host ""
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow

# Kiểm tra xem có Vercel CLI không
try {
    vercel --version | Out-Null
    
    # Test build trước (nếu không skip)
    if (-not $SkipBuild) {
        Write-Host "🏗️  Testing build locally..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Build failed. Deploy cancelled" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Build successful" -ForegroundColor Green
    }
    
    # Deploy
    vercel --prod --yes
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Deploy failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "⚠️  Vercel CLI not found. Skipping deploy." -ForegroundColor Yellow
    Write-Host "💡 Nếu đã setup Vercel Git integration, deploy sẽ tự động chạy." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✅ Hoàn thành!" -ForegroundColor Green
```

**Sử dụng:**
```powershell
.\commit-and-deploy.ps1 "feat: thêm tính năng mới"
.\commit-and-deploy.ps1 "fix: sửa lỗi xyz" --skip-lint
.\commit-and-deploy.ps1 "chore: update deps" --skip-build
```

**Bash Script (`commit-and-deploy.sh`):**

Tạo file `commit-and-deploy.sh` ở root:

```bash
#!/bin/bash
# Commit and Deploy Script
# Usage: ./commit-and-deploy.sh "feat: mô tả thay đổi" [--skip-lint] [--skip-build]

set -e

MESSAGE="$1"
SKIP_LINT=false
SKIP_BUILD=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --skip-lint)
        SKIP_LINT=true
        shift
        ;;
        --skip-build)
        SKIP_BUILD=true
        shift
        ;;
    esac
done

if [ -z "$MESSAGE" ]; then
    echo "❌ Commit message is required"
    echo "Usage: ./commit-and-deploy.sh \"feat: mô tả\" [--skip-lint] [--skip-build]"
    exit 1
fi

echo "🚀 Commit và Deploy Script"
echo ""

# Lint
if [ "$SKIP_LINT" = false ]; then
    echo "🔍 Linting code..."
    npm run lint || exit 1
    echo "✅ Lint passed"
fi

# Stage
echo ""
echo "📦 Staging changes..."
git add .
echo "✅ Changes staged"

# Commit
echo ""
echo "💾 Committing changes..."
git commit -m "$MESSAGE" || exit 1
echo "✅ Committed: $MESSAGE"

# Push
echo ""
echo "📤 Pushing to remote..."
git push || exit 1
echo "✅ Pushed to remote"

# Deploy
echo ""
echo "🚀 Deploying to Vercel..."

if command -v vercel &> /dev/null; then
    # Test build
    if [ "$SKIP_BUILD" = false ]; then
        echo "🏗️  Testing build locally..."
        npm run build || exit 1
        echo "✅ Build successful"
    fi
    
    # Deploy
    vercel --prod --yes || exit 1
    echo "✅ Deployed successfully!"
else
    echo "⚠️  Vercel CLI not found. Skipping deploy."
    echo "💡 Nếu đã setup Vercel Git integration, deploy sẽ tự động chạy."
fi

echo ""
echo "✅ Hoàn thành!"
```

**Sử dụng:**
```bash
chmod +x commit-and-deploy.sh
./commit-and-deploy.sh "feat: thêm tính năng mới"
```

### Option 3: Git Hook (Post-Push)

Tạo git hook để tự động deploy sau khi push.

**Tạo file `.git/hooks/post-push` (hoặc `post-receive` nếu dùng server):**

```bash
#!/bin/bash
# Auto deploy sau khi push
# Chỉ deploy khi push lên main branch

branch=$(git rev-parse --abbrev-ref HEAD)

if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
    echo "🚀 Auto deploying to Vercel..."
    vercel --prod --yes
fi
```

**Lưu ý:** Git hooks chỉ chạy trên local repository. Để auto-deploy trên remote, nên dùng Vercel Git integration (Option 1).

### So sánh các Options

| Option | Ưu điểm | Nhược điểm | Khi nào dùng |
|--------|---------|------------|--------------|
| **Vercel Git Integration** | Tự động, an toàn, có build logs | Cần setup ban đầu | ✅ Khuyến nghị cho production |
| **Script Commit+Deploy** | Linh hoạt, có thể customize | Phải nhớ chạy script | Khi cần control nhiều hơn |
| **Git Hook** | Tự động sau push | Chỉ chạy local, phức tạp hơn | Khi cần automation local |

## Lưu ý về Auto Deploy

- **Vercel Git Integration là cách tốt nhất** cho production vì:
  - Tự động chạy trên mỗi push
  - Có build logs và error tracking
  - Hỗ trợ preview deployments cho PRs
  - Không cần Vercel CLI trên local
  
- **Script Commit+Deploy** hữu ích khi:
  - Bạn muốn test build trước khi push
  - Cần deploy ngay lập tức (không đợi Git webhook)
  - Làm việc với nhiều environments

- **Luôn test build local** trước khi deploy để tránh deploy code bị lỗi
