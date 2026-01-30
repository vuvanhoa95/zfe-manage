# Fix Deployment Issues - Giao diện không đúng

## Vấn đề đã phát hiện

1. **NEXTAUTH_URL chưa đúng**: Trong `.env.local` có giá trị placeholder `https://your-app-name.vercel.app`
2. **Build cache**: Đã clear và deploy lại với `--force`

## Các bước cần làm

### 1. Cập nhật NEXTAUTH_URL trên Vercel Dashboard

1. Vào **Vercel Dashboard**: https://vercel.com/zfenixs-projects/zfe-manage
2. Vào **Settings** → **Environment Variables**
3. Tìm `NEXTAUTH_URL` và cập nhật thành:
   ```
   https://zfe-manage.vercel.app
   ```
4. Đảm bảo chọn **Production** environment
5. Click **Save**

### 2. Kiểm tra các Environment Variables khác

Đảm bảo các biến sau đã được set đúng trên Vercel:

- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `NEXTAUTH_SECRET` - Secret key (đã có)
- ⚠️ `NEXTAUTH_URL` - **Cần update thành**: `https://zfe-manage.vercel.app`
- ⚠️ `OPENAI_API_KEY` - (Nếu dùng AI Assistant)
- ⚠️ `OPENAI_MODEL` - (Mặc định: `gpt-4o-mini`)

### 3. Redeploy sau khi update Environment Variables

Sau khi update `NEXTAUTH_URL`, cần redeploy:

```powershell
cd ZfeManage
vercel --prod --yes
```

Hoặc trên Vercel Dashboard:
- Vào **Deployments**
- Click **⋯** trên deployment mới nhất
- Chọn **Redeploy**

### 4. Kiểm tra các vấn đề khác có thể ảnh hưởng

#### A. Static Files không load
- Kiểm tra các file trong `public/` có được deploy không
- Kiểm tra đường dẫn ảnh/logo có đúng không

#### B. CSS/Tailwind không load
- Kiểm tra `globals.css` có được import đúng không
- Kiểm tra Tailwind config

#### C. API Routes không hoạt động
- Kiểm tra Function Logs trên Vercel Dashboard
- Kiểm tra database connection

#### D. Authentication không hoạt động
- Kiểm tra `NEXTAUTH_SECRET` và `NEXTAUTH_URL`
- Kiểm tra cookies/session settings

## Quick Fix Script

Chạy script sau để update và redeploy:

```powershell
cd ZfeManage

# 1. Pull env vars mới nhất
vercel env pull .env.local

# 2. Kiểm tra NEXTAUTH_URL
Get-Content .env.local | Select-String "NEXTAUTH_URL"

# 3. Redeploy
vercel --prod --yes
```

## Verify Deployment

Sau khi redeploy, kiểm tra:

1. ✅ **Build Logs**: Không có lỗi
2. ✅ **Function Logs**: API routes hoạt động
3. ✅ **Login Page**: https://zfe-manage.vercel.app/login
4. ✅ **Dashboard**: Sau khi login thành công
5. ✅ **Static Assets**: Images, CSS load đúng

## Troubleshooting

### Lỗi: "NEXTAUTH_URL is not set"
- Update `NEXTAUTH_URL` trên Vercel Dashboard
- Redeploy

### Lỗi: "Cannot connect to database"
- Kiểm tra `DATABASE_URL` trên Vercel
- Kiểm tra database đang chạy

### Lỗi: "404 Not Found" cho static files
- Kiểm tra file có trong `public/` không
- Kiểm tra đường dẫn trong code

### Giao diện khác localhost
- Clear browser cache
- Kiểm tra CSS có được load không
- Kiểm tra console errors trong browser DevTools
