$url = "http://localhost:3009"
$maxAttempts = 30
$attempt = 0
$serverReady = $false

Write-Host ""
Write-Host "=== Dang kiem tra Development Server ===" -ForegroundColor Cyan

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop
        $serverReady = $true
        Write-Host ""
        Write-Host "OK: Server dang chay tai $url" -ForegroundColor Green
    } catch {
        $attempt++
        if ($attempt % 3 -eq 0) {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
        Start-Sleep -Seconds 1
    }
}

Write-Host ""

if ($serverReady) {
    Write-Host ""
    Write-Host "=== Tu dong mo Browser ===" -ForegroundColor Cyan
    try {
        Start-Process $url
        Write-Host "OK: Da mo browser tai $url" -ForegroundColor Green
    } catch {
        Write-Host "Khong the mo browser tu dong" -ForegroundColor Red
        Write-Host "Vui long mo thu cong: $url" -ForegroundColor Yellow
    }
} else {
    Write-Host "LOI: Khong the ket noi den $url sau $maxAttempts giay" -ForegroundColor Red
}
