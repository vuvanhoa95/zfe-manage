# ⚡ Cập Nhật User Nhanh

## Thông Tin Mới
- **Email**: `hoavv@zfenix.com`
- **Password**: `Zfenix2026`

## Cách Nhanh Nhất: Neon SQL Editor

1. Vào https://console.neon.tech
2. Chọn project → SQL Editor
3. Chạy SQL:

```sql
-- Hash password trước tại: https://bcrypt-generator.com/
-- Password: Zfenix2026
-- Sau đó copy hash và paste vào dưới

UPDATE users 
SET 
  password = 'PASTE_HASHED_PASSWORD_HERE',
  name = 'Hoa VV',
  role = 'ADMIN',
  "updatedAt" = NOW()
WHERE email = 'hoavv@zfenix.com';

-- Nếu chưa có user, chạy:
INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'hoavv@zfenix.com',
  'PASTE_HASHED_PASSWORD_HERE',
  'Hoa VV',
  'ADMIN',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'hoavv@zfenix.com');
```

4. Hash password tại: https://bcrypt-generator.com/
   - Password: `Zfenix2026`
   - Rounds: `10`
   - Copy hash và paste vào SQL

5. Chạy SQL và test đăng nhập!
