# Helper script để AI chạy commands
# Usage: .\run-command.ps1 <command-name> [args...]

param(
    [Parameter(Mandatory=$true)]
    [string]$CommandName,
    
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Args
)

$ErrorActionPreference = "Stop"

# Command mappings
$commands = @{
    "quick-commit" = {
        if ($Args -contains "--push") {
            & .\quick-commit.ps1 --push
        } else {
            $message = $Args -join " "
            if ($message) {
                & .\quick-commit.ps1 $message
            } else {
                & .\quick-commit.ps1
            }
        }
    }
    "deploy" = {
        if ($Args -contains "--skip-build") {
            & .\deploy-production.ps1 --skip-build
        } else {
            & .\deploy-production.ps1
        }
    }
    "build" = {
        npm run build
    }
    "dev" = {
        npm run dev
    }
    "lint" = {
        npm run lint
    }
    "git-status" = {
        git status
    }
    "git-pull" = {
        git pull origin main
    }
    "git-log" = {
        git log --oneline -10
    }
    "prisma-generate" = {
        npx prisma generate
    }
    "prisma-migrate" = {
        npx prisma migrate deploy
    }
    "vercel-status" = {
        vercel project ls
    }
    "vercel-env-pull" = {
        vercel env pull .env.local
    }
}

# Execute command
if ($commands.ContainsKey($CommandName)) {
    Write-Host "Running command: $CommandName" -ForegroundColor Cyan
    & $commands[$CommandName]
} else {
    Write-Host "Unknown command: $CommandName" -ForegroundColor Red
    Write-Host "Available commands:" -ForegroundColor Yellow
    $commands.Keys | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    exit 1
}
