# 🔧 Hướng dẫn khắc phục lỗi kết nối Database

## ❌ Lỗi thường gặp

Khi đăng nhập, bạn có thể gặp lỗi: **"Lỗi kết nối database. Vui lòng kiểm tra cấu hình server."**

## 🔍 Các bước kiểm tra và khắc phục

### 1. Kiểm tra DATABASE_URL

Chạy script kiểm tra:

```bash
npx tsx scripts/test-database-connection.ts
```

Script này sẽ:
- ✅ Kiểm tra DATABASE_URL có được set không
- ✅ Test kết nối database
- ✅ Test query đơn giản
- ✅ Hiển thị lỗi chi tiết nếu có

### 2. Kiểm tra file .env.local

Đảm bảo bạn có file `.env.local` trong thư mục gốc với nội dung:

**Cho SQLite (Local Development):**
```env
DATABASE_URL="file:./prisma/prisma/dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

**Cho PostgreSQL (Production):**
```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-domain.com"
```

### 3. Kiểm tra Database có tồn tại không

**Cho SQLite:**
```bash
# Kiểm tra file database
ls -la prisma/prisma/dev.db

# Nếu không có, tạo database và chạy migrations
npx prisma migrate dev
```

**Cho PostgreSQL:**
```bash
# Kiểm tra kết nối
npx prisma db pull

# Chạy migrations
npx prisma migrate deploy
```

### 4. Generate Prisma Client

Nếu Prisma Client chưa được generate:

```bash
npx prisma generate
```

### 5. Kiểm tra Database Server (cho PostgreSQL)

**Nếu dùng Neon (PostgreSQL):**
- ✅ Kiểm tra connection string có đúng không
- ✅ Kiểm tra có dùng pooled connection không (tốt hơn cho serverless)
- ✅ Kiểm tra SSL mode: `?sslmode=require`

**Nếu dùng local PostgreSQL:**
- ✅ Kiểm tra PostgreSQL server có đang chạy không
- ✅ Kiểm tra port (mặc định: 5432)
- ✅ Kiểm tra username/password

### 6. Các lỗi Prisma thường gặp

| Error Code | Mô tả | Cách khắc phục |
|------------|-------|----------------|
| P1001 | Không thể kết nối đến database server | Kiểm tra DATABASE_URL, firewall, network |
| P1002 | Database server timeout | Kiểm tra network, tăng timeout |
| P1003 | Database không tồn tại | Tạo database mới hoặc chạy migrations |
| P1012 | Schema không khớp | Chạy `npx prisma migrate dev` |
| P1017 | Server đã đóng kết nối | Kiểm tra connection pooling settings |

### 7. Kiểm tra trong Development

Nếu đang chạy local development:

```bash
# 1. Kiểm tra DATABASE_URL
echo $DATABASE_URL

# 2. Test connection
npx tsx scripts/test-database-connection.ts

# 3. Kiểm tra Prisma Client
npx prisma studio
```

### 8. Kiểm tra trong Production (Vercel)

1. Vào Vercel Dashboard → Project → Settings → Environment Variables
2. Kiểm tra `DATABASE_URL` có được set đúng không
3. Kiểm tra có dùng pooled connection không (cho Neon)
4. Redeploy sau khi thay đổi environment variables

### 9. Debug trong Code

Nếu vẫn gặp lỗi, kiểm tra logs:

```bash
# Development
npm run dev

# Xem logs trong console khi đăng nhập
# Lỗi sẽ hiển thị chi tiết trong development mode
```

## 📋 Checklist nhanh

- [ ] DATABASE_URL đã được set trong .env.local
- [ ] Database file tồn tại (SQLite) hoặc server đang chạy (PostgreSQL)
- [ ] Đã chạy `npx prisma migrate dev`
- [ ] Đã chạy `npx prisma generate`
- [ ] Test connection thành công với script
- [ ] NEXTAUTH_SECRET đã được set

## 🆘 Vẫn gặp lỗi?

1. Chạy script test: `npx tsx scripts/test-database-connection.ts`
2. Xem error message chi tiết
3. Kiểm tra logs trong console (development mode)
4. Kiểm tra Prisma documentation: https://www.prisma.io/docs
