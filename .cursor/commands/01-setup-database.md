# Setup Database

Thiết lập và khởi tạo database cho dự án.

## Mô tả
Chạy migrations, generate Prisma client, và seed database với dữ liệu mẫu.

## Commands

```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
```

## Lưu ý
- Đảm bảo đã cấu hình `DATABASE_URL` trong file `.env`
- File seed được định nghĩa trong `package.json` -> `prisma.seed`
- Migration sẽ tạo database schema từ `prisma/schema.prisma`
