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

# Check if we're in a Git repository
try {
    $null = git rev-parse --git-dir 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Not a Git repository. Please run this script in a Git repository." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error checking Git repository: $_" -ForegroundColor Red
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

# Analyze changes to auto-detect type and create detailed message
$changedFiles = git diff --cached --name-only
if (-not $changedFiles) {
    $changedFiles = git diff --name-only
}

# Get file status (added, modified, deleted)
$fileStatus = git status --porcelain

$autoType = ""
$autoMessage = ""
$changeDetails = @()

# Categorize files
$components = @()
$apiRoutes = @()
$styles = @()
$docs = @()
$database = @()
$config = @()
$tests = @()
$other = @()

foreach ($file in $changedFiles) {
    $statusLine = $fileStatus | Where-Object { $_ -match [regex]::Escape($file) }
    $status = if ($statusLine) { $statusLine.Substring(0, 2).Trim() } else { "M" }
    $statusText = switch ($status) {
        "A" { "added" }
        "M" { "updated" }
        "D" { "deleted" }
        "R" { "renamed" }
        default { "changed" }
    }
    
    $fileName = Split-Path -Leaf $file
    
    if ($file -match "components?/|ui/|layout/") {
        $components += "$fileName ($statusText)"
    } elseif ($file -match "api/|route\.ts") {
        $apiRoutes += "$fileName ($statusText)"
    } elseif ($file -match "\.(css|scss)$|tailwind|globals\.css") {
        $styles += "$fileName ($statusText)"
    } elseif ($file -match "\.md$|README|DOCS|\.cursor/commands/") {
        $docs += "$fileName ($statusText)"
    } elseif ($file -match "schema\.prisma|migration") {
        $database += "$fileName ($statusText)"
    } elseif ($file -match "package\.json|package-lock\.json|tsconfig|next\.config") {
        $config += "$fileName ($statusText)"
    } elseif ($file -match "\.(test|spec)\.(ts|js)") {
        $tests += "$fileName ($statusText)"
    } else {
        $other += "$fileName ($statusText)"
    }
}

# Determine type and create message
if ($components.Count -gt 0) {
    $autoType = "feat"
    $changeDetails += "Components: $($components -join ', ')"
    $autoMessage = "Update components"
} elseif ($apiRoutes.Count -gt 0) {
    $autoType = "feat"
    $changeDetails += "API Routes: $($apiRoutes -join ', ')"
    $autoMessage = "Update API routes"
} elseif ($styles.Count -gt 0) {
    $autoType = "style"
    $changeDetails += "Styles: $($styles -join ', ')"
    $autoMessage = "Update styles"
} elseif ($database.Count -gt 0) {
    $autoType = "chore"
    $changeDetails += "Database: $($database -join ', ')"
    $autoMessage = "Update database schema"
} elseif ($docs.Count -gt 0) {
    $autoType = "docs"
    $changeDetails += "Documentation: $($docs -join ', ')"
    $autoMessage = "Update documentation"
} elseif ($config.Count -gt 0) {
    $autoType = "chore"
    $changeDetails += "Config: $($config -join ', ')"
    $autoMessage = "Update configuration"
} elseif ($tests.Count -gt 0) {
    $autoType = "test"
    $changeDetails += "Tests: $($tests -join ', ')"
    $autoMessage = "Update tests"
} else {
    $autoType = "chore"
    $changeDetails += "Files: $($other -join ', ')"
    $autoMessage = "Update files"
}

# Add other categories if present
if ($components.Count -eq 0 -and $apiRoutes.Count -gt 0) {
    $changeDetails += "API Routes: $($apiRoutes -join ', ')"
}
if ($styles.Count -gt 0 -and $autoType -ne "style") {
    $changeDetails += "Styles: $($styles -join ', ')"
}
if ($docs.Count -gt 0 -and $autoType -ne "docs") {
    $changeDetails += "Documentation: $($docs -join ', ')"
}

# Use specified type or auto-detected
$finalType = if ($Type) { $Type } else { $autoType }

# Create commit message with detailed description
if ($Message) {
    $commitMessage = if ($finalType) {
        "$finalType`: $Message"
    } else {
        $Message
    }
} else {
    $commitMessage = "$finalType`: $autoMessage"
}

# Add detailed changes to message body
if ($changeDetails.Count -gt 0) {
    $detailsText = $changeDetails -join "`n"
    # Limit details to avoid too long message
    if ($detailsText.Length -gt 200) {
        $detailsText = $detailsText.Substring(0, 200) + "..."
    }
    $commitMessage = "$commitMessage`n`n$detailsText"
}

# Add file count summary
$fileCount = $changedFiles.Count
$addedCount = ($fileStatus | Where-Object { $_ -match "^A" }).Count
$modifiedCount = ($fileStatus | Where-Object { $_ -match "^ M|^M " }).Count
$deletedCount = ($fileStatus | Where-Object { $_ -match "^D" }).Count

$summary = "Total: $fileCount files"
if ($addedCount -gt 0) { $summary += ", +$addedCount added" }
if ($modifiedCount -gt 0) { $summary += ", ~$modifiedCount modified" }
if ($deletedCount -gt 0) { $summary += ", -$deletedCount deleted" }

# Build commit message
$commitTitle = if ($Message) {
    if ($finalType) {
        "$finalType`: $Message"
    } else {
        $Message
    }
} else {
    "$finalType`: $autoMessage"
}

# Build detailed description for commit body
$commitBody = @()

# Add change details
if ($changeDetails.Count -gt 0) {
    foreach ($detail in $changeDetails) {
        # Limit each detail line length
        if ($detail.Length -gt 100) {
            $detail = $detail.Substring(0, 100) + "..."
        }
        $commitBody += $detail
    }
}

# Add summary
if ($fileCount -gt 0) {
    $commitBody += ""
    $commitBody += $summary
}

# Create full commit message
$fullCommitMessage = $commitTitle
if ($commitBody.Count -gt 0) {
    $fullCommitMessage += "`n`n" + ($commitBody -join "`n")
}

# Display commit message preview
Write-Host "Commit message:" -ForegroundColor Green
Write-Host "  $commitTitle" -ForegroundColor Cyan
if ($changeDetails.Count -gt 0) {
    Write-Host "  Details:" -ForegroundColor Gray
    foreach ($detail in $changeDetails) {
        Write-Host "    - $detail" -ForegroundColor Gray
    }
}
if ($fileCount -gt 0) {
    Write-Host "  $summary" -ForegroundColor Gray
}
Write-Host ""

# Add all changes
Write-Host "Adding files..." -ForegroundColor Yellow
git add .

# Commit using temporary file to avoid encoding issues
Write-Host "Committing..." -ForegroundColor Yellow
$tempFile = [System.IO.Path]::GetTempFileName()
try {
    # Write commit message to temp file with UTF-8 encoding
    [System.IO.File]::WriteAllText($tempFile, $fullCommitMessage, [System.Text.Encoding]::UTF8)
    git commit -F $tempFile
} finally {
    if (Test-Path $tempFile) {
        Remove-Item $tempFile -Force
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "Commit successful!" -ForegroundColor Green
Write-Host ""

# Push if requested
if ($Push) {
    Write-Host "Pushing to remote..." -ForegroundColor Yellow
    
    # Check remote connection first
    try {
        $remoteUrl = git remote get-url origin 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "No remote 'origin' configured. Skipping push." -ForegroundColor Yellow
            Write-Host "Commit successful, but not pushed." -ForegroundColor Cyan
            exit 0
        }
        Write-Host "Remote: $remoteUrl" -ForegroundColor Gray
    } catch {
        Write-Host "Could not check remote. Skipping push." -ForegroundColor Yellow
        Write-Host "Commit successful, but not pushed." -ForegroundColor Cyan
        exit 0
    }
    
    $currentBranch = git branch --show-current
    Write-Host "Pushing to origin/$currentBranch..." -ForegroundColor Yellow
    
    # Try to push with error handling
    try {
        git push origin $currentBranch 2>&1 | Out-String
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Pushed successfully to $currentBranch" -ForegroundColor Green
            Write-Host "Vercel will auto-deploy..." -ForegroundColor Cyan
        } else {
            Write-Host "Push failed. This might be due to:" -ForegroundColor Red
            Write-Host "  - Network connection issues" -ForegroundColor Yellow
            Write-Host "  - VPN blocking connection" -ForegroundColor Yellow
            Write-Host "  - Authentication problems" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "You can try pushing manually: git push origin $currentBranch" -ForegroundColor Cyan
            Write-Host "Commit was successful, you can push later." -ForegroundColor Green
            exit 0
        }
    } catch {
        Write-Host "Error during push: $_" -ForegroundColor Red
        Write-Host "Commit was successful. You can push manually later." -ForegroundColor Yellow
        Write-Host "Command: git push origin $currentBranch" -ForegroundColor Gray
        exit 0
    }
} else {
    Write-Host "Tip: Add --push flag to auto push to remote" -ForegroundColor Cyan
    Write-Host "Example: .\quick-commit.ps1 your-message --push" -ForegroundColor Gray
}
