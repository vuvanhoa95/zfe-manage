# Reset Database

Reset database về trạng thái ban đầu (⚠️ CẢNH BÁO: Xóa tất cả data).

## Mô tả
Xóa tất cả data và migrations, sau đó tạo lại từ đầu.

## Command

```bash
npx prisma migrate reset
```

## Lưu ý
- ⚠️ **CẢNH BÁO**: Command này sẽ xóa TẤT CẢ data trong database
- Chỉ sử dụng trong development environment
- Sau khi reset, sẽ tự động chạy seed nếu có
- Hữu ích khi cần test migrations từ đầu

## Alternative (Chỉ reset migrations, giữ data)
```bash
# Xóa migrations folder và tạo lại
rm -rf prisma/migrations
npx prisma migrate dev --name init
```
