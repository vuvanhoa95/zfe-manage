# 🚨 HƯỚNG DẪN CHUYỂN SANG POSTGRESQL - BẮT BUỘC CHO PRODUCTION

## ⚠️ VẤN ĐỀ NGHIÊM TRỌNG

**SQLite trên Vercel KHÔNG THỂ PERSIST DỮ LIỆU!**

- SQLite file-based database trên Vercel lưu trong `/tmp` (ephemeral storage)
- Mỗi lần deploy/restart, `/tmp` sẽ bị reset → **MẤT TOÀN BỘ DỮ LIỆU**
- Code cũ đã xóa database mỗi lần production start (đã được sửa)
- **PHẢI** chuyển sang PostgreSQL ngay để bảo vệ dữ liệu!

---

## 📋 BƯỚC 1: TẠO POSTGRESQL DATABASE

### Option 1: Neon (Recommended - Free tier tốt)

1. Đăng ký tại https://neon.tech
2. Tạo project mới
3. Copy connection string (sẽ có format: `postgresql://user:password@host/database?sslmode=require`)

### Option 2: Vercel Postgres

1. Vào Vercel Dashboard → Project → Storage
2. Tạo Vercel Postgres database
3. Copy connection string từ Vercel

### Option 3: Supabase

1. Đăng ký tại https://supabase.com
2. Tạo project mới
3. Copy connection string từ Settings → Database

---

## 📋 BƯỚC 2: CẬP NHẬT SCHEMA

### 2.1. Cập nhật `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"  // ← Đổi từ "sqlite" sang "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2.2. Cập nhật `DATABASE_URL` trên Vercel

1. Vào Vercel Dashboard → Project → Settings → Environment Variables
2. Thêm/Update `DATABASE_URL`:
   - Format: `postgresql://user:password@host:port/database?sslmode=require`
   - Hoặc dùng pooled connection (Neon): `postgresql://user:password@host/database?sslmode=require&pgbouncer=true`

### 2.3. Cập nhật `DATABASE_URL` local (`.env.local`)

```bash
# Development - vẫn dùng SQLite
DATABASE_URL="file:./prisma/dev.db"

# Production - dùng PostgreSQL (pull từ Vercel)
# vercel env pull .env.local
```

---

## 📋 BƯỚC 3: MIGRATE DATABASE

### 3.1. Tạo migration mới

```bash
# Tạo migration để chuyển từ SQLite sang PostgreSQL
npx prisma migrate dev --name migrate_to_postgresql
```

**Lưu ý**: Migration này sẽ:
- Tạo lại tất cả tables với PostgreSQL syntax
- Giữ nguyên cấu trúc dữ liệu
- **KHÔNG** mất dữ liệu nếu đã có trong PostgreSQL

### 3.2. Deploy migrations lên production

```bash
# Pull DATABASE_URL từ Vercel
vercel env pull .env.local

# Chạy migrations
npx prisma migrate deploy
```

---

## 📋 BƯỚC 4: MIGRATE DỮ LIỆU (Nếu có dữ liệu cũ)

### 4.1. Export dữ liệu từ SQLite (nếu có)

```bash
# Export từ SQLite local
npx prisma db pull  # Nếu cần
```

### 4.2. Import vào PostgreSQL

Có thể dùng script hoặc tool để migrate dữ liệu:

```bash
# Option 1: Dùng Prisma Studio
npx prisma studio

# Option 2: Dùng SQL dump (nếu có)
pg_restore -d $DATABASE_URL backup.sql
```

---

## 📋 BƯỚC 5: VERIFY

### 5.1. Test connection

```bash
# Test connection
npx prisma db pull
```

### 5.2. Test trên production

1. Deploy lên Vercel
2. Test đăng nhập
3. Test tạo dữ liệu mới
4. **Reload trang** - dữ liệu phải còn (không bị mất)

---

## 📋 BƯỚC 6: CLEANUP

### 6.1. Xóa code SQLite production (sau khi verify)

Sau khi đã verify PostgreSQL hoạt động tốt, có thể:
- Xóa function `ensureProductionSqliteDbReady()` trong `lib/prisma.ts`
- Hoặc giữ lại nhưng thêm check để cảnh báo nếu vẫn dùng SQLite

### 6.2. Update documentation

- Cập nhật README.md
- Cập nhật deployment docs
- Thông báo team về thay đổi

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Backup trước khi migrate**: Luôn backup database trước khi thay đổi
2. **Test trên staging**: Test kỹ trên staging trước khi deploy production
3. **Pooled connection**: Dùng pooled connection cho serverless (Neon có sẵn)
4. **Connection limits**: PostgreSQL có connection limits - dùng connection pooling
5. **SSL required**: Production PostgreSQL yêu cầu SSL (`?sslmode=require`)

---

## 🚨 NẾU GẶP LỖI

### Lỗi: "Connection refused"
- Kiểm tra `DATABASE_URL` có đúng không
- Kiểm tra firewall/network settings
- Kiểm tra SSL mode

### Lỗi: "Too many connections"
- Dùng pooled connection
- Kiểm tra connection pooling settings

### Lỗi: "Migration failed"
- Kiểm tra migrations có conflict không
- Backup và rollback nếu cần
- Test migrations trên local trước

---

## ✅ CHECKLIST

- [ ] Đã tạo PostgreSQL database (Neon/Vercel/Supabase)
- [ ] Đã cập nhật `prisma/schema.prisma` → `provider = "postgresql"`
- [ ] Đã set `DATABASE_URL` trên Vercel (PostgreSQL connection string)
- [ ] Đã chạy migrations: `npx prisma migrate deploy`
- [ ] Đã test connection
- [ ] Đã test trên production (tạo dữ liệu → reload → dữ liệu còn)
- [ ] Đã backup database
- [ ] Đã thông báo team

---

**Sau khi hoàn thành, dữ liệu sẽ được bảo vệ và không bị mất khi deploy!**
