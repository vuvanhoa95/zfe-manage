# 🔐 Hướng Dẫn Cập Nhật Tài Khoản Đăng Nhập

## Thông Tin Tài Khoản Mới

- **Email**: `hoavv@zfenix.com`
- **Password**: `Zfenix2026`
- **Role**: `ADMIN`

---

## Cách 1: Sử dụng Neon SQL Editor (Khuyến nghị)

1. **Truy cập Neon Dashboard**: https://console.neon.tech
2. **Chọn project** của bạn
3. **Vào SQL Editor**
4. **Chạy SQL sau**:

```sql
-- Hash password: Zfenix2026
-- Bạn cần hash password trước, hoặc sử dụng script bên dưới

-- Kiểm tra user có tồn tại không
SELECT * FROM users WHERE email = 'hoavv@zfenix.com';

-- Nếu user chưa tồn tại, tạo mới:
INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'hoavv@zfenix.com',
  '$2a$10$YourHashedPasswordHere', -- Cần hash password trước
  'Hoa VV',
  'ADMIN',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "updatedAt" = NOW();
```

**Lưu ý**: Bạn cần hash password trước. Sử dụng tool online hoặc script bên dưới.

---

## Cách 2: Sử dụng API Endpoint (Sau khi đăng nhập với admin cũ)

1. **Đăng nhập** với tài khoản admin cũ: `admin@bimcompany.vn` / `admin`
2. **Gọi API**:

```bash
curl -X POST https://zfe-manage.vercel.app/api/admin/update-user \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "email": "hoavv@zfenix.com",
    "password": "Zfenix2026",
    "name": "Hoa VV",
    "role": "ADMIN"
  }'
```

Hoặc sử dụng Postman/Thunder Client với session cookie.

---

## Cách 3: Sử dụng Vercel CLI (Nếu có quyền)

1. **Pull environment variables**:
```bash
vercel env pull .env.local --environment=production
```

2. **Chạy script** (sau khi fix dependencies):
```bash
npm install
npx prisma generate
npx tsx scripts/update-user.ts
```

---

## Cách 4: Hash Password và Update Trực Tiếp

### Bước 1: Hash Password

Sử dụng Node.js:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Zfenix2026', 10).then(hash => console.log(hash));"
```

Hoặc sử dụng tool online: https://bcrypt-generator.com/

### Bước 2: Update trong Neon SQL Editor

```sql
-- Thay YOUR_HASHED_PASSWORD bằng hash từ bước 1
UPDATE users 
SET 
  password = 'YOUR_HASHED_PASSWORD',
  name = 'Hoa VV',
  role = 'ADMIN',
  "updatedAt" = NOW()
WHERE email = 'hoavv@zfenix.com';

-- Nếu user chưa tồn tại:
INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'hoavv@zfenix.com',
  'YOUR_HASHED_PASSWORD',
  'Hoa VV',
  'ADMIN',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
```

---

## Cách 5: Sử dụng Prisma Studio (Local)

1. **Pull DATABASE_URL** từ Vercel:
```bash
vercel env pull .env.local --environment=production
```

2. **Chạy Prisma Studio**:
```bash
npx prisma studio
```

3. **Mở bảng `users`** và:
   - Tìm user với email `hoavv@zfenix.com`
   - Nếu chưa có, tạo mới
   - Update password (cần hash trước), name, role

---

## ✅ Sau Khi Cập Nhật

1. **Test đăng nhập** với:
   - Email: `hoavv@zfenix.com`
   - Password: `Zfenix2026`

2. **Xác nhận** user có role `ADMIN`

3. **Kiểm tra** các chức năng hoạt động bình thường

---

## 🔒 Lưu Ý Bảo Mật

- ✅ Password được hash bằng bcrypt (10 rounds)
- ✅ Không lưu password dạng plain text
- ✅ Chỉ admin mới có quyền update user
- ✅ Nên đổi password sau lần đăng nhập đầu tiên

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. Database connection string đúng chưa
2. User có quyền ADMIN không
3. Password đã được hash đúng chưa
4. Email đúng format chưa
