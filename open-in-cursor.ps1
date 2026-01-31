# Script để mở dự án trong Cursor
# Sử dụng: .\open-in-cursor.ps1

$projectPath = $PSScriptRoot

# Các vị trí có thể có Cursor
$cursorPaths = @(
    "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe",
    "$env:APPDATA\Cursor\Cursor.exe",
    "C:\Program Files\Cursor\Cursor.exe",
    "C:\Program Files (x86)\Cursor\Cursor.exe"
)

$cursorExe = $null
foreach ($path in $cursorPaths) {
    if (Test-Path $path) {
        $cursorExe = $path
        Write-Host "Found Cursor at: $path" -ForegroundColor Green
        break
    }
}

if ($null -eq $cursorExe) {
    Write-Host "Cursor not found. Please install Cursor or update the path in this script." -ForegroundColor Red
    Write-Host "You can also manually open Cursor and use File > Open Folder" -ForegroundColor Yellow
    exit 1
}

# Mở dự án trong Cursor
Write-Host "Opening project in Cursor: $projectPath" -ForegroundColor Cyan
Start-Process -FilePath $cursorExe -ArgumentList $projectPath
