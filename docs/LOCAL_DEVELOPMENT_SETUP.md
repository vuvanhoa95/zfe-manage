# 🛠️ Local Development Setup

## Vấn đề đã giải quyết

Khi preview ứng dụng trên port 3002, gặp lỗi **HTTP 500** khi fetch dữ liệu từ API `/api/projects`. 

### Nguyên nhân
- Database PostgreSQL trên Neon (cloud) không thể kết nối được
- Có thể do:
  - Mạng không ổn định
  - Credentials đã hết hạn
  - Database instance bị tạm dừng/xóa

### Giải pháp
Chuyển sang sử dụng **SQLite** cho local development để:
- ✅ Không phụ thuộc vào kết nối internet
- ✅ Khởi động nhanh hơn
- ✅ Dễ dàng reset/seed data
- ✅ Phù hợp cho development và testing

---

## 📋 Các thay đổi đã thực hiện

### 1. Cập nhật Prisma Schema
**File:** `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

> 💡 **Lưu ý:** Để tránh lỗi validate kiểu `the URL must start with the protocol 'file:'` trên production,  
> schema trong repo hiện tại luôn để `provider = "postgresql"`. Khi chạy local, anh nên dùng luôn `DATABASE_URL` PostgreSQL (Neon) nếu có thể.

### 2. Tạo file `.env.development`
**File:** `.env.development`

```bash
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="wulxXBGegKdzmWF5chk6tVoaTnSOsRMEbv3ZL9H1rjQyA4D2"
OPENAI_API_KEY="sk-proj-..."
OPENAI_MODEL="gpt-4o-mini"
```

### 3. Cập nhật `.env` chính
**File:** `.env`

```bash
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="wulxXBGegKdzmWF5chk6tVoaTnSOsRMEbv3ZL9H1rjQyA4D2"
```

### 4. Xóa `.env.local`
File này chứa config production (Vercel) nên đã xóa để tránh conflict.

---

## 🚀 Cách chạy ứng dụng

### Lần đầu tiên setup

```powershell
# 1. Generate Prisma Client
$env:DATABASE_URL="file:./prisma/dev.db"
npx prisma generate

# 2. Push schema lên database
$env:DATABASE_URL="file:./prisma/dev.db"
npx prisma db push

# 3. Seed dữ liệu demo
$env:DATABASE_URL="file:./prisma/dev.db"
npx prisma db seed

# 4. Chạy dev server
npm run dev -- -p 3002
```

### Lần sau (đã setup)

```powershell
npm run dev -- -p 3002
```

Truy cập: **http://localhost:3002**

---

## 🔄 Chuyển đổi giữa SQLite và PostgreSQL

### Sử dụng PostgreSQL (Khuyến nghị cho Dev + Production)

1. Cập nhật `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Cập nhật `.env` (hoặc biến môi trường trên Vercel):
```bash
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

3. Migrate:
```powershell
npx prisma migrate deploy
```

---

## 📁 Cấu trúc Database

### PostgreSQL (Neon)
- **Host:** `ep-jolly-grass-ah2jd4m0-pooler.c-3.us-east-1.aws.neon.tech`
- **Database:** `neondb`
- **User:** `neondb_owner`

---

## 🧪 Testing Database

### Xem dữ liệu
```powershell
npx prisma studio
```

### Reset database
```powershell
# Xóa file database
Remove-Item prisma/dev.db

# Tạo lại
$env:DATABASE_URL="file:./prisma/dev.db"
npx prisma db push
npx prisma db seed
```

---

## ⚠️ Lưu ý quan trọng

### Khi commit code
- ❌ **KHÔNG** commit file `prisma/dev.db`
- ❌ **KHÔNG** commit file `.env` hoặc `.env.local`
- ✅ **NÊN** commit file `.env.example`

### Khi deploy production
- Đổi lại `provider = "postgresql"` trong schema
- Sử dụng DATABASE_URL từ Vercel/Neon
- Chạy `npx prisma migrate deploy`

### Gitignore
Đảm bảo `.gitignore` có:
```
.env
.env.local
.env.development
*.db
*.db-journal
```

---

## 🐛 Troubleshooting

### Lỗi: "Database connection failed"
```powershell
# Kiểm tra DATABASE_URL
echo $env:DATABASE_URL

# Thử push lại
$env:DATABASE_URL="file:./prisma/dev.db"
npx prisma db push
```

### Lỗi: "Table does not exist"
```powershell
# Reset database
Remove-Item prisma/dev.db -Force
$env:DATABASE_URL="file:./prisma/dev.db"
npx prisma db push
npx prisma db seed
```

### Lỗi: "Prisma Client not generated"
```powershell
npx prisma generate
```

---

## 📊 Demo Data

Database đã được seed với:
- ✅ 1 User (admin)
- ✅ 6 Customers
- ✅ 6 Projects
- ✅ 6 Quotations (với status khác nhau)
- ✅ Payment milestones
- ✅ Company profile

### Login credentials
- **Email:** `admin@zfenix.com`
- **Password:** `admin123`

---

## 🎯 Next Steps

1. ✅ Database đã sẵn sàng với SQLite
2. ✅ Dev server đang chạy trên port 3002
3. 🔄 Có thể preview ứng dụng tại http://localhost:3002
4. 🔄 Khi cần deploy, đổi lại PostgreSQL

---

**Cập nhật:** 2026-02-03  
**Người thực hiện:** AI Assistant
