# Preview Localhost

Mở trình duyệt tích hợp của Cursor để xem ứng dụng đang chạy trên localhost.

## Mô tả
Mở browser panel tích hợp trong Cursor IDE tại địa chỉ localhost để preview ứng dụng Next.js ngay trong editor.

## Command - Tự động kiểm tra và mở Browser

### Cách 1: Sử dụng Script kiểm tra (Khuyến nghị)
```powershell
# Chạy script kiểm tra server và hướng dẫn mở browser
.\.cursor\commands\check-and-open-browser.ps1
```

### Cách 2: Sử dụng Command Palette trong Cursor
```bash
# Bước 1: Mở Command Palette
Ctrl+Shift+P (Windows/Linux) hoặc Cmd+Shift+P (Mac)

# Bước 2: Tìm và chọn
"Simple Browser: Show" hoặc "View: Show Simple Browser"

# Bước 3: Nhập URL
http://localhost:3000
```

### Cách 3: Sử dụng Keyboard Shortcut
```bash
# Nhấn Ctrl+K rồi nhập:
>Simple Browser: Show

# Sau đó nhập URL: http://localhost:3000
```

## Cách sử dụng nhanh

1. **Đảm bảo dev server đang chạy**:
   ```bash
   npm run dev
   ```

2. **Mở browser trong Cursor**:
   - Nhấn `Ctrl+Shift+P` (hoặc `Cmd+Shift+P` trên Mac)
   - Gõ: `Simple Browser`
   - Chọn: `Simple Browser: Show`
   - Nhập: `http://localhost:3000`
   - Nhấn Enter

3. **Browser sẽ hiển thị ngay trong Cursor IDE**

## Access
- Frontend: http://localhost:3000
- API Routes: http://localhost:3000/api/*

## Lưu ý
- ✅ Browser panel hiển thị ngay trong Cursor IDE, không cần mở trình duyệt bên ngoài
- ✅ Port mặc định là 3000, nếu khác thì thay đổi port trong URL
- ✅ Có thể sử dụng với các port khác (VD: 3001, 5555 cho Prisma Studio)
- ✅ Browser panel có thể được đóng/mở bằng Command Palette
- ⚠️ Đảm bảo development server đã được khởi động (`npm run dev`) trước khi mở browser
- 💡 Tip: Có thể bookmark URL trong browser panel để truy cập nhanh sau này