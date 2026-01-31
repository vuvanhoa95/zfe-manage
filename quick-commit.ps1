# Quick Commit Script for ZfeManage
# Usage: .\quick-commit.ps1 [message] [--push] [--type <type>]
# Examples:
#   .\quick-commit.ps1 "fix login bug"
#   .\quick-commit.ps1 "add new feature" --push
#   .\quick-commit.ps1 --type feat --push

param(
    [string]$Message = "",
    [switch]$Push,
    [ValidateSet("feat", "fix", "chore", "refactor", "docs", "style", "test", "perf")]
    [string]$Type = ""
)

$ErrorActionPreference = "Stop"

# Check Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git not installed" -ForegroundColor Red
    exit 1
}

# Check for changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "No changes to commit" -ForegroundColor Yellow
    exit 0
}

Write-Host "Detected changes:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Analyze changes to auto-detect type
$changedFiles = git diff --cached --name-only
if (-not $changedFiles) {
    $changedFiles = git diff --name-only
}

$autoType = ""
$autoMessage = ""

# Auto-detect type based on file paths
if ($changedFiles -match "\.(tsx?|jsx?)$") {
    if ($changedFiles -match "(component|ui|layout)") {
        $autoType = "feat"
        $autoMessage = "Update components"
    } elseif ($changedFiles -match "(api|route)") {
        $autoType = "feat"
        $autoMessage = "Update API routes"
    } else {
        $autoType = "refactor"
        $autoMessage = "Code refactoring"
    }
} elseif ($changedFiles -match "\.(css|scss|tsx?)$" -and $changedFiles -match "(style|css|tailwind)") {
    $autoType = "style"
    $autoMessage = "Update styles"
} elseif ($changedFiles -match "schema\.prisma|migration") {
    $autoType = "chore"
    $autoMessage = "Update database schema"
} elseif ($changedFiles -match "\.md$|README|DOCS") {
    $autoType = "docs"
    $autoMessage = "Update documentation"
} elseif ($changedFiles -match "package\.json|package-lock\.json") {
    $autoType = "chore"
    $autoMessage = "Update dependencies"
} elseif ($changedFiles -match "\.(test|spec)\.(ts|js)") {
    $autoType = "test"
    $autoMessage = "Update tests"
} else {
    $autoType = "chore"
    $autoMessage = "Update files"
}

# Use specified type or auto-detected
$finalType = if ($Type) { $Type } else { $autoType }

# Create commit message
if ($Message) {
    $commitMessage = if ($finalType) {
        "$finalType`: $Message"
    } else {
        $Message
    }
} else {
    $commitMessage = "$finalType`: $autoMessage"
}

# Add timestamp if message is too short
if ($commitMessage.Length -lt 20) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $commitMessage = "$commitMessage - $timestamp"
}

Write-Host "Commit message: $commitMessage" -ForegroundColor Green
Write-Host ""

# Add all changes
Write-Host "Adding files..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "Committing..." -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "Commit successful!" -ForegroundColor Green
Write-Host ""

# Push if requested
if ($Push) {
    Write-Host "Pushing to remote..." -ForegroundColor Yellow
    $currentBranch = git branch --show-current
    git push origin $currentBranch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Pushed successfully to $currentBranch" -ForegroundColor Green
        Write-Host "Vercel will auto-deploy..." -ForegroundColor Cyan
    } else {
        Write-Host "Push may have failed. Please check." -ForegroundColor Yellow
    }
} else {
    Write-Host "Tip: Add --push flag to auto push to remote" -ForegroundColor Cyan
    Write-Host "Example: .\quick-commit.ps1 your-message --push" -ForegroundColor Gray
}
