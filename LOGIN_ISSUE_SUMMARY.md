# 🐛 Tóm Tắt Vấn Đề Đăng Nhập

## ❌ Lỗi hiện tại

- **Console log**: "Vui lòng nhập đầy đủ email và mật khẩu"
- **Network**: POST `/api/auth/callback/credentials` → **401 Unauthorized**
- **Trạng thái**: Vẫn ở trang login, không redirect

## 🔍 Nguyên nhân có thể

### 1. NextAuth không nhận được credentials
- Form submit nhưng NextAuth không nhận được `email` và `password`
- Có thể do cách NextAuth xử lý form data

### 2. Database connection issue trên production
- DATABASE_URL có thể không đúng trên Vercel
- Database Neon có thể đang suspend
- Connection pooling issue

### 3. NEXTAUTH_SECRET issue
- Secret không đúng hoặc thiếu
- Secret không được deploy đúng cách

## ✅ Đã làm

1. ✅ Thêm debug logging trong `lib/auth.ts`
2. ✅ Cải thiện error handling
3. ✅ Deploy code mới lên Vercel

## 🔧 Cách debug

### Bước 1: Xem Function Logs trên Vercel

1. Vào **Vercel Dashboard**: https://vercel.com/dashboard
2. Chọn project **zfe-manage**
3. Vào **Deployments** → Chọn deployment mới nhất
4. Vào **Functions** → Tìm `/api/auth/[...nextauth]`
5. Xem **Logs** tab
6. Tìm các dòng có:
   - "Authorize called with:"
   - "Missing credentials:"
   - Database errors
   - Prisma errors

### Bước 2: Kiểm tra Environment Variables

1. Vào **Settings** → **Environment Variables**
2. Kiểm tra:
   - `DATABASE_URL` có đúng connection string từ Neon không
   - `NEXTAUTH_SECRET` có giá trị không
   - `NEXTAUTH_URL` có đúng domain không

### Bước 3: Test Database Connection

Truy cập test endpoint (nếu đã tạo):
```
https://zfe-manage.vercel.app/api/test-auth
```

Hoặc kiểm tra trên Neon Dashboard:
1. Vào Neon Dashboard → SQL Editor
2. Chạy: `SELECT * FROM users WHERE email = 'admin@bimcompany.vn';`
3. Kiểm tra user có tồn tại không

## 🚀 Giải pháp đề xuất

### Giải pháp 1: Kiểm tra NextAuth credentials format

Có thể NextAuth cần credentials ở format khác. Thử update `lib/auth.ts`:

```typescript
async authorize(credentials) {
    // Log để debug
    console.log('Credentials received:', {
        email: credentials?.email,
        password: credentials?.password ? '***' : undefined,
        allKeys: Object.keys(credentials || {})
    });
    
    // ... rest of code
}
```

### Giải pháp 2: Kiểm tra DATABASE_URL trên Vercel

Đảm bảo DATABASE_URL trên Vercel đúng với Neon connection string:
- Có `?sslmode=require` ở cuối
- Dùng pooled connection nếu có thể

### Giải pháp 3: Test với curl/Postman

Test API trực tiếp:

```bash
curl -X POST https://zfe-manage.vercel.app/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@bimcompany.vn&password=admin&csrfToken=..."
```

## 📋 Checklist Debug

- [ ] Xem Function Logs trên Vercel
- [ ] Kiểm tra Environment Variables
- [ ] Test database connection
- [ ] Kiểm tra user trong database
- [ ] Test với curl/Postman
- [ ] Kiểm tra NextAuth configuration

## 💡 Gợi ý tiếp theo

Sau khi xem Function Logs, sẽ biết chính xác lỗi ở đâu:
- Nếu không thấy "Authorize called with:" → NextAuth không nhận được credentials
- Nếu thấy "Missing credentials" → Form không submit đúng
- Nếu thấy database error → Database connection issue
- Nếu thấy "User not found" → User chưa được seed

---

**Hãy xem Function Logs trên Vercel để biết chính xác lỗi!**
