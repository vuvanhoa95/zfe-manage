# Deploy Production Script cho ZfeManage
# Usage: .\deploy-production.ps1 [-SkipBuild] [-SkipSeed] [-Preview] [-AutoCommit] [-AutoPush]

param(
    [switch]$SkipBuild,
    [switch]$SkipSeed,
    [switch]$Preview,
    [switch]$AutoCommit,
    [switch]$AutoPush
)

$ErrorActionPreference = "Stop"

Write-Host "=== ZfeManage Deployment Tool ===" -ForegroundColor Cyan

# Step 0: Prerequisites Check
Write-Host "Step 0: Checking prerequisites..." -ForegroundColor Yellow

# Helper function to check if a command exists
function Test-Command($CommandName) {
    if (Get-Command $CommandName -ErrorAction SilentlyContinue) {
        return $true
    }
    return $false
}

$UseNpxVercel = $false
if (Test-Command "vercel") {
    $v = vercel --version
    Write-Host "Vercel CLI: $v" -ForegroundColor Green
} elseif (Test-Command "npx") {
    Write-Host "Vercel CLI not found in path, trying with npx..." -ForegroundColor Yellow
    try {
        $v = npx vercel --version 2>&1
        $UseNpxVercel = $true
        Write-Host "Vercel CLI (npx): $v" -ForegroundColor Green
    } catch {
        Write-Host "Vercel CLI not found even with npx. Run: npm i -g vercel" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Node/NPM not found. Please install Node.js." -ForegroundColor Red
    exit 1
}

# Define the vercel command to use
$VercelCmd = if ($UseNpxVercel) { "npx vercel" } else { "vercel" }

# Step 1: Pull environment variables
Write-Host "`nStep 1: Pulling environment variables from Vercel..." -ForegroundColor Yellow
$pullResult = Invoke-Expression "$VercelCmd env pull .env.local"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error pulling env vars. Please run: vercel login" -ForegroundColor Red
    exit 1
}
Write-Host "Environment variables pulled successfully." -ForegroundColor Green

# Step 2: Install dependencies
Write-Host "`nStep 2: Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path node_modules)) {
    Write-Host "node_modules not found. Installing..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "node_modules exists." -ForegroundColor Green
}

# Step 3: Generate Prisma Client
Write-Host "`nStep 3: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Prisma generation failed." -ForegroundColor Red
    exit 1
}
Write-Host "Prisma Client generated." -ForegroundColor Green

# Step 4: Run migrations
Write-Host "`nStep 4: Running database migrations (Prisma)..." -ForegroundColor Yellow
Write-Host "Warning: This may affect the production database." -ForegroundColor DarkYellow
$confirm = Read-Host "Is the database backed up and are you ready to deploy migrations? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Deployment aborted by user." -ForegroundColor Gray
    exit 0
}

npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "Database migration failed." -ForegroundColor Red
    exit 1
}
Write-Host "Migrations applied successfully." -ForegroundColor Green

# Step 5: Seed database
if (-not $SkipSeed) {
    Write-Host "`nStep 5: Seeding database (Optional)..." -ForegroundColor Yellow
    $seedConfirm = Read-Host "Do you want to run seeds? (y/n)"
    if ($seedConfirm -eq "y" -or $seedConfirm -eq "Y") {
        npx prisma db seed
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Seed might have issues (usually because data exists)." -ForegroundColor Yellow
        } else {
            Write-Host "Database seeded." -ForegroundColor Green
        }
    }
}

# Step 6: Test build local
if (-not $SkipBuild) {
    Write-Host "`nStep 6: Testing production build locally..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Local build failed. Fix errors before deploying!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Local build succeeded." -ForegroundColor Green
}

# Step 6.5: Auto commit/push
if ($AutoCommit -or $AutoPush) {
    Write-Host "`nStep 6.5: Managing Git changes..." -ForegroundColor Yellow
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMsg = "Auto-commit before deploy: $timestamp"
        
        if ($AutoCommit) {
            Write-Host "Commiting changes: $commitMsg" -ForegroundColor Cyan
            git add .
            git commit -m $commitMsg
        }
        
        if ($AutoPush) {
            $branch = git branch --show-current
            Write-Host "Pushing to $branch..." -ForegroundColor Cyan
            git push origin $branch
        }
    }
}

# Step 7: Push the deploy to Vercel Cloud
Write-Host "`nStep 7: Deploying to Vercel (Production)..." -ForegroundColor Yellow
$deployFlags = if ($Preview) { "--yes" } else { "--prod --yes" }
Invoke-Expression "$VercelCmd $deployFlags"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Vercel deployment process failed." -ForegroundColor Red
    exit 1
}

Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
Write-Host "Final checks:"
Write-Host "[ ] Check Vercel Dashboard for logs"
Write-Host "[ ] Check functions are running correctly"
Write-Host "[ ] Test login and database actions"
