# Script tự động mở browser khi server sẵn sàng
$url = "http://localhost:3009"
$maxAttempts = 60
$attempt = 0
$serverReady = $false

Write-Host ""
Write-Host "=== Đang đợi Development Server khởi động ===" -ForegroundColor Cyan

# Đợi server khởi động (tối đa 60 giây)
while ($attempt -lt $maxAttempts -and -not $serverReady) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop
        $serverReady = $true
        Write-Host ""
        Write-Host "✓ Server đã sẵn sàng tại $url" -ForegroundColor Green
    } catch {
        $attempt++
        if ($attempt % 5 -eq 0) {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
        Start-Sleep -Seconds 1
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
        Write-Host "   Nhấn Ctrl+Shift+P → Gõ 'Simple Browser' → Chọn 'Simple Browser: Show' → Nhập: $url" -ForegroundColor Yellow
    } catch {
        Write-Host "✗ Không thể mở browser tự động" -ForegroundColor Red
        Write-Host "   Vui lòng mở thủ công: $url" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Server chưa sẵn sàng sau $maxAttempts giây" -ForegroundColor Red
    Write-Host "   Vui lòng kiểm tra lại development server" -ForegroundColor Yellow
}
