# Hướng dẫn cấu hình DATABASE_URL

## Vấn đề hiện tại

Schema Prisma đang dùng `provider="postgresql"`, nhưng DATABASE_URL đang là SQLite (`file:./prisma/dev.db`).

## Giải pháp

### Option 1: Dùng PostgreSQL (Khuyến nghị)

1. **Setup PostgreSQL local:**
   - Cài đặt PostgreSQL: https://www.postgresql.org/download/
   - Tạo database mới:
     ```sql
     CREATE DATABASE zfemanage;
     ```

2. **Cập nhật DATABASE_URL trong `.env` hoặc `.env.local`:**
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/zfemanage"
   ```
   (Thay `postgres`, `password`, `localhost`, `5432`, `zfemanage` bằng thông tin thực tế của bạn)

3. **Chạy migrations:**
   ```bash
   npx prisma migrate dev
   ```

### Option 2: Dùng PostgreSQL trên Cloud (Neon, Supabase, Vercel Postgres)

1. **Tạo database trên cloud provider**
2. **Copy connection string và paste vào `.env`:**
   ```
   DATABASE_URL="postgresql://user:password@host:port/database"
   ```

### Option 3: Quay lại SQLite (Không khuyến nghị - code đang dùng PostgreSQL syntax)

Nếu muốn dùng SQLite, cần:
1. Đổi `provider="sqlite"` trong `schema.prisma`
2. Sửa lại tất cả SQL queries từ PostgreSQL syntax sang SQLite
3. Chạy lại migrations

**⚠️ Lưu ý:** Option 3 sẽ phải sửa nhiều code, không khuyến nghị.

## Kiểm tra DATABASE_URL format

Sau khi cập nhật, kiểm tra format:
```bash
# Mở browser và truy cập:
http://localhost:3009/api/dev/check-database-url
```

Hoặc trong terminal:
```bash
curl http://localhost:3009/api/dev/check-database-url
```

## Format DATABASE_URL hợp lệ

- ✅ `postgresql://user:password@host:port/database`
- ✅ `postgres://user:password@host:port/database`
- ✅ `prisma://host:port/database?api_key=...` (Prisma Accelerate)
- ✅ `prisma+postgres://host:port/database?api_key=...` (Prisma Data Proxy)
- ❌ `file:./prisma/dev.db` (SQLite - không khớp với provider="postgresql")
