# Preview Localhost

Mở nhanh ứng dụng Next.js của dự án này trên `http://localhost:3009` để anh xem trực tiếp trong Cursor.

> **AI behavior mặc định (đơn giản)**  
> - Dùng Terminal tích hợp của Cursor để:
>   - `cd` vào thư mục dự án web.  
>   - Chạy `npm install` nếu cần.  
>   - Chạy `npm run dev` để khởi động dev server (nếu lỗi, tóm tắt ngắn gọn cho anh).  
> - Không yêu cầu anh gõ thêm lệnh trong terminal.  
> - Sau khi server chạy, anh chỉ cần mở `http://localhost:3009` để xem app.

## Cách dùng ngắn gọn

1. **Gọi command này**  
   - Đợi em chạy xong các bước cần thiết trong Terminal.  
   - Em sẽ báo một trong hai:
     - **OK**: "Dev server đang chạy tại `http://localhost:3009`".  
     - **Lỗi**: Tóm tắt lỗi 1–2 dòng (ví dụ: lỗi Prisma, thiếu env, v.v.).

2. **Mở app trong Cursor**  
   - Nhấn `Ctrl+Shift+P` → gõ `Simple Browser` → chọn `Simple Browser: Show`.  
   - Nhập URL: `http://localhost:3009` → Enter.  
   - App sẽ hiển thị ngay trong panel browser của Cursor.

3. **(Tuỳ chọn) Script hỗ trợ**  
   - Nếu có file `.\.cursor\commands\check-and-open-browser.ps1`, em có thể dùng script này để kiểm tra nhanh localhost và in thêm hướng dẫn, nhưng anh không bắt buộc phải chạy tay.

## Nếu vẫn không xem được

- Anh chỉ cần gửi cho em:
  - Ảnh chụp terminal dev server.  
  - Hoặc đoạn log lỗi chính.  
- Em sẽ phân tích và sửa tiếp (hoặc gợi ý bước hệ thống mà em không tự bấm được, như tắt antivirus/restart máy).