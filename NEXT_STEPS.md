# 🚀 BƯỚC TIẾP THEO - Setup Database

## ✅ Đã hoàn thành

1. ✅ Link project `zfe-manage` với Vercel
2. ✅ Pull environment variables (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
3. ✅ Cập nhật migration_lock.toml từ SQLite sang PostgreSQL

## 📋 Các bước tiếp theo

### Bước 1: Đảm bảo Database Neon đang Active

1. Vào **Neon Dashboard**: https://console.neon.tech
2. Chọn project **ZfeData**
3. Kiểm tra trạng thái database:
   - ✅ **Active** (màu xanh) = OK
   - ⚠️ **Suspend** (màu vàng/xám) = Cần wake up
4. Nếu bị Suspend:
   - Click vào database
   - Click nút **"Resume"** hoặc **"Wake up"**
   - Đợi vài giây để database khởi động

### Bước 2: Tạo Migrations mới cho PostgreSQL

**Vấn đề**: Migrations cũ dùng SQLite syntax (`AUTOINCREMENT`), cần tạo mới cho PostgreSQL.

**Giải pháp**: Tạo migrations mới từ schema hiện tại.

Chạy lệnh sau trong terminal (ở thư mục `quotation-app`):

```powershell
npx prisma migrate dev --name init_postgresql
```

**Lệnh này sẽ:**
- Tạo migration mới với PostgreSQL syntax đúng
- Apply migration vào database
- Tạo tất cả tables trong database

**Nếu lỗi "Can't reach database":**
- Đảm bảo database đang Active trên Neon Dashboard
- Thử lại sau vài giây

### Bước 3: Seed Database (Tạo User Admin)

Sau khi migrations thành công, chạy:

```powershell
npx prisma db seed
```

**Lệnh này sẽ tạo:**
- User admin: `admin@bimcompany.vn` / password: `admin`
- Company profile mặc định
- Catalog items
- Demo data (nếu có)

### Bước 4: Verify trên Neon Dashboard

1. Vào Neon Dashboard → SQL Editor
2. Chạy query để kiểm tra user đã tạo:

```sql
SELECT email, name, role FROM users;
```

Bạn sẽ thấy:
```
email                  | name        | role
-----------------------|-------------|-------
admin@bimcompany.vn   | Admin User  | ADMIN
```

### Bước 5: Redeploy trên Vercel

1. Vào **Vercel Dashboard**: https://vercel.com/dashboard
2. Chọn project **zfe-manage**
3. Vào tab **Deployments**
4. Click **"..."** (3 chấm) → **Redeploy**
5. Chọn **"Use existing Build Cache"** → **Redeploy**

### Bước 6: Test Đăng Nhập

1. Truy cập: https://zfe-manage.vercel.app/login
2. Nhập thông tin:
   - **Email**: `admin@bimcompany.vn`
   - **Password**: `admin`
3. Click **Đăng nhập**

**Kết quả mong đợi:**
- ✅ Đăng nhập thành công
- ✅ Redirect về dashboard (`/`)

---

## 🐛 Troubleshooting

### Lỗi: "Can't reach database server"

**Nguyên nhân**: Database đang bị suspend hoặc chưa wake up

**Giải pháp**:
1. Vào Neon Dashboard
2. Đảm bảo database đang **Active**
3. Nếu Suspend, click **Resume**
4. Đợi vài giây rồi thử lại

### Lỗi: "Migration failed - AUTOINCREMENT"

**Nguyên nhân**: Migrations cũ dùng SQLite syntax

**Giải pháp**:
- Đã xử lý bằng cách tạo migrations mới với `npx prisma migrate dev`

### Lỗi: "User already exists" khi seed

**Giải pháp**:
- Không sao, user đã tồn tại
- Có thể bỏ qua hoặc xóa user cũ trong Neon dashboard nếu cần

### Lỗi đăng nhập: "Invalid credentials"

**Kiểm tra**:
1. User đã được tạo chưa (Bước 4)
2. `NEXTAUTH_SECRET` đã được thêm vào Vercel chưa
3. Redeploy đã hoàn tất chưa

---

## ✅ Checklist Hoàn Thành

- [ ] Database Neon đang **Active**
- [ ] Tạo migrations mới: `npx prisma migrate dev --name init_postgresql`
- [ ] Seed database: `npx prisma db seed`
- [ ] Verify user trên Neon Dashboard
- [ ] Redeploy trên Vercel
- [ ] Test đăng nhập thành công

---

## 📞 Cần hỗ trợ?

Nếu gặp lỗi ở bước nào, copy toàn bộ error message và gửi cho mình để hỗ trợ!
