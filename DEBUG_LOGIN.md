# 🐛 Debug Đăng Nhập

## ✅ Đã kiểm tra và OK

1. ✅ User admin tồn tại trong database
2. ✅ Password hash đúng (có thể đăng nhập với `admin`)
3. ✅ Database connection OK
4. ✅ NEXTAUTH_SECRET có trên Vercel
5. ✅ NEXTAUTH_URL có trên Vercel
6. ✅ NextAuth SessionProvider đã được setup

## 🔍 Cách Debug

### Bước 1: Test API Endpoint

Sau khi redeploy, truy cập:
```
https://zfe-manage.vercel.app/api/test-auth
```

Endpoint này sẽ trả về:
- User có tồn tại không
- Password hash có đúng không
- Environment variables có đầy đủ không

### Bước 2: Kiểm tra Function Logs trên Vercel

1. Vào **Vercel Dashboard** → **Deployments**
2. Chọn deployment mới nhất
3. Vào tab **Functions**
4. Tìm function `/api/auth/[...nextauth]`
5. Xem **Logs** để thấy lỗi chi tiết

### Bước 3: Kiểm tra Browser Console

1. Mở https://zfe-manage.vercel.app/login
2. Mở **Developer Tools** (F12)
3. Vào tab **Console**
4. Thử đăng nhập
5. Xem error messages trong console

### Bước 4: Kiểm tra Network Tab

1. Mở **Developer Tools** → **Network**
2. Thử đăng nhập
3. Tìm request đến `/api/auth/callback/credentials`
4. Xem response để biết lỗi chi tiết

## 🔧 Các vấn đề thường gặp

### Lỗi: "NEXTAUTH_SECRET is not set"

**Nguyên nhân**: NEXTAUTH_SECRET chưa được set trên Vercel production

**Giải pháp**:
1. Vào Vercel Dashboard → Settings → Environment Variables
2. Kiểm tra `NEXTAUTH_SECRET` có trong **Production** environment không
3. Nếu không có, thêm vào
4. Redeploy

### Lỗi: "CredentialsSignin"

**Nguyên nhân**: Email/password không đúng hoặc database connection issue

**Giải pháp**:
1. Kiểm tra user trong database (dùng `/api/test-auth`)
2. Kiểm tra DATABASE_URL trên Vercel
3. Kiểm tra Function Logs để xem lỗi chi tiết

### Lỗi: "Cannot connect to database"

**Nguyên nhân**: DATABASE_URL sai hoặc database đang suspend

**Giải pháp**:
1. Kiểm tra DATABASE_URL trên Vercel
2. Kiểm tra database Neon đang Active
3. Thử dùng DATABASE_URL_UNPOOLED nếu pooled connection có vấn đề

### Lỗi: Redirect loop

**Nguyên nhân**: Middleware hoặc NextAuth configuration issue

**Giải pháp**:
1. Kiểm tra `middleware.ts` có đúng không
2. Kiểm tra `NEXTAUTH_URL` có đúng domain không
3. Kiểm tra `pages.signIn` trong authOptions

## 📝 Checklist Debug

- [ ] Test `/api/test-auth` endpoint
- [ ] Kiểm tra Function Logs trên Vercel
- [ ] Kiểm tra Browser Console
- [ ] Kiểm tra Network requests
- [ ] Verify environment variables trên Vercel
- [ ] Verify database connection
- [ ] Test với user khác (nếu có)

## 🚀 Sau khi fix

1. Xóa test endpoint `/api/test-auth` (không cần nữa)
2. Tắt debug mode trong production (đã tự động)
3. Test đăng nhập lại
