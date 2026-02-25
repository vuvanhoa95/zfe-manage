param(
    [string]$Url = "http://localhost:3009",
    [int]$MaxAttempts = 30
)

$attempt = 0
$serverReady = $false

Write-Host ""
Write-Host "=== Kiểm tra Development Server ($Url) ===" -ForegroundColor Cyan

# 1) Kiểm tra nhanh port trước (Windows)
try {
    $uri = [System.Uri]$Url
    $port = if ($uri.Port -ne 0) { $uri.Port } else { 80 }

    Write-Host "→ Kiểm tra port $port..." -ForegroundColor DarkCyan
    $netstatResult = netstat -ano | Select-String ":$port"

    if (-not $netstatResult) {
        Write-Host "⚠ Port $port hiện chưa có process nào lắng nghe." -ForegroundColor Yellow
        Write-Host "   → Có thể dev server chưa được khởi động (npm run dev)." -ForegroundColor Yellow
    } else {
        Write-Host "✓ Port $port đang được một process sử dụng." -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Không thể kiểm tra port bằng netstat (bỏ qua bước này)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "→ Thử kết nối đến $Url (tối đa $MaxAttempts giây)..." -ForegroundColor DarkCyan

# 2) Đợi server khởi động (tối đa MaxAttempts giây)
while ($attempt -lt $MaxAttempts -and -not $serverReady) {
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop
        $serverReady = $true
        Write-Host ""
        Write-Host "✓ Server đang chạy tại $Url" -ForegroundColor Green
    } catch {
        $attempt++
        if ($attempt -lt $MaxAttempts) {
            Start-Sleep -Seconds 1
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
}

Write-Host ""

if ($serverReady) {
    Write-Host ""
    Write-Host "=== Tự động mở Browser (hệ điều hành) ===" -ForegroundColor Cyan
    try {
        Start-Process $Url
        Write-Host "✓ Đã mở browser tại $Url" -ForegroundColor Green
        Write-Host ""
        Write-Host "💡 Để mở trong Cursor IDE Simple Browser panel:" -ForegroundColor Cyan
        Write-Host "   1. Nhấn Ctrl+Shift+P" -ForegroundColor Yellow
        Write-Host "   2. Gõ: Simple Browser" -ForegroundColor Yellow
        Write-Host "   3. Chọn: Simple Browser: Show" -ForegroundColor Yellow
        Write-Host "   4. Nhập URL: $Url" -ForegroundColor Yellow
    } catch {
        Write-Host "✗ Không thể mở browser tự động" -ForegroundColor Red
        Write-Host "   Vui lòng mở thủ công: $Url" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Không thể kết nối đến $Url sau $MaxAttempts giây" -ForegroundColor Red
    Write-Host ""
    Write-Host "=== Gợi ý tự fix nhanh ===" -ForegroundColor Cyan
    Write-Host "1) Kiểm tra dev server:" -ForegroundColor Yellow
    Write-Host "   - Đảm bảo đang chạy trong thư mục project" -ForegroundColor White
    Write-Host "   - Chạy lệnh: npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "2) Nếu vẫn không được:" -ForegroundColor Yellow
    Write-Host "   - Kiểm tra log lỗi trong terminal (lỗi build, lỗi TypeScript, lỗi env...)" -ForegroundColor White
    Write-Host "   - Kiểm tra port đang dùng:" -ForegroundColor White
    Write-Host "       netstat -ano | findstr :$port" -ForegroundColor DarkGray
    Write-Host "   - Nếu port bị chiếm bởi process lạ → kill process hoặc đổi port:" -ForegroundColor White
    Write-Host "       `$env:PORT=3001; npm run dev" -ForegroundColor DarkGray
    Write-Host "   - Sau đó thử lại URL tương ứng, ví dụ: http://localhost:3001" -ForegroundColor White
    Write-Host ""
    Write-Host "3) Nếu vẫn lỗi, hãy chụp log terminal và kết quả netstat để gửi cho AI với lệnh /debug." -ForegroundColor Yellow
}

$null