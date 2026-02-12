# Kiểm tra server và tự động mở browser
$url = "http://localhost:3000"
$maxAttempts = 30
$attempt = 0
$serverReady = $false

Write-Host ""
Write-Host "=== Kiểm tra Development Server ===" -ForegroundColor Cyan

# Đợi server khởi động (tối đa 30 giây)
while ($attempt -lt $maxAttempts -and -not $serverReady) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop
        $serverReady = $true
        Write-Host "✓ Server đang chạy tại $url" -ForegroundColor Green
    } catch {
        $attempt++
        if ($attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 1
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
}

Write-Host ""

if ($serverReady) {
    Write-Host ""
    Write-Host "=== Tự động mở Browser ===" -ForegroundColor Cyan
    try {
        Start-Process $url
        Write-Host "✓ Đã mở browser tại $url" -ForegroundColor Green
        Write-Host ""
        Write-Host "💡 Tip: Để mở trong Cursor IDE Simple Browser panel:" -ForegroundColor Cyan
        Write-Host "   1. Nhấn Ctrl+Shift+P" -ForegroundColor Yellow
        Write-Host "   2. Gõ: Simple Browser" -ForegroundColor Yellow
        Write-Host "   3. Chọn: Simple Browser: Show" -ForegroundColor Yellow
        Write-Host "   4. Nhập URL: $url" -ForegroundColor Yellow
    } catch {
        Write-Host "✗ Không thể mở browser tự động" -ForegroundColor Red
        Write-Host "   Vui lòng mở thủ công: $url" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Server chưa chạy tại $url sau $maxAttempts giây" -ForegroundColor Red
    Write-Host ""
    Write-Host "=== Khởi động Development Server ===" -ForegroundColor Cyan
    Write-Host "Vui lòng chạy lệnh sau:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Sau khi server chạy, quay lại và chạy lại command này." -ForegroundColor Yellow
}
