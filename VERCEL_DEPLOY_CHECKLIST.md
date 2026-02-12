# Vercel Deploy Checklist - Kiểm tra lỗi deploy

## 🔍 Các lỗi thường gặp và cách fix

### 1. **Lỗi Build - Module not found**

**Triệu chứng:**
```
Module not found: Can't resolve './AIAssistant'
Module not found: Can't resolve '@/lib/email/send'
```

**Đã fix:**
- ✅ Đã commit tất cả các file thiếu:
  - `components/quotation/AIAssistant.tsx`
  - `components/quotation/VoiceInput.tsx`
  - `lib/email/send.ts`
  - `lib/email/client.ts`
  - `lib/email/templates/*.tsx`
  - `lib/quotation-number.ts`

### 2. **Lỗi Build - Import sai**

**Triệu chứng:**
```
Module not found: Can't resolve 'react-email'
Module not found: Can't resolve '@react-email/components'
```

**Đã fix:**
- ✅ Sửa import: `import { render } from '@react-email/render'`
- ✅ Cài đặt package: `@react-email/render@^2.0.4`

### 3. **Lỗi TypeScript - Params type**

**Triệu chứng:**
```
Property 'id' is missing in type 'Promise<{ id: string }>'
```

**Đã fix:**
- ✅ Sửa tất cả route handlers để dùng: `{ params: Promise<{ id: string }> | { id: string } }`

### 4. **Lỗi TypeScript - Missing fields**

**Triệu chứng:**
```
Property 'theme' does not exist on type 'QuotationFormData'
Property 'templateId' does not exist on type 'QuotationFormData'
```

**Đã fix:**
- ✅ Thêm các field vào `QuotationFormData`:
  - `theme?: string`
  - `templateId?: string`
  - `media?: any[]`
  - `sectionOrder?: string[]`

### 5. **Lỗi Runtime - Missing API keys**

**Triệu chứng:**
```
Missing credentials. Please pass an `apiKey`
```

**Đã fix:**
- ✅ Sửa OpenAI client để không throw error khi build
- ✅ Sửa Resend client để không throw error khi build

## 📋 Environment Variables cần thiết trên Vercel

Đảm bảo các biến sau đã được set trên Vercel Dashboard:

### Bắt buộc:
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `NEXTAUTH_SECRET` - Secret key cho NextAuth
- ✅ `NEXTAUTH_URL` - URL của app (ví dụ: `https://zfe-manage.vercel.app`)

### Tùy chọn (cho các tính năng):
- ⚠️ `RESEND_API_KEY` - Cho email sending (nếu không có, email sẽ fail nhưng app vẫn chạy)
- ⚠️ `RESEND_FROM_EMAIL` - Email sender
- ⚠️ `OPENAI_API_KEY` - Cho AI features (nếu không có, AI features sẽ không hoạt động)
- ⚠️ `NEXT_PUBLIC_APP_URL` - Public URL của app
- ⚠️ `NEXT_PUBLIC_COMPANY_NAME` - Tên công ty

## 🔧 Cách kiểm tra lỗi trên Vercel

1. **Vào Vercel Dashboard**: https://vercel.com/dashboard
2. **Chọn project**: `zfe-manage`
3. **Vào tab "Deployments"**
4. **Click vào deployment mới nhất**
5. **Xem "Build Logs"** để tìm lỗi cụ thể

## 🚀 Các bước deploy lại

1. **Kiểm tra Environment Variables:**
   ```bash
   # Trên Vercel Dashboard → Settings → Environment Variables
   # Đảm bảo có đủ các biến bắt buộc
   ```

2. **Redeploy:**
   ```bash
   git push origin main
   # Vercel sẽ tự động trigger build
   ```

3. **Hoặc deploy thủ công:**
   ```bash
   vercel --prod
   ```

## 📝 Nếu vẫn lỗi

Vui lòng cung cấp:
1. **Build log từ Vercel** (copy toàn bộ error message)
2. **Lỗi cụ thể** (dòng nào, file nào)
3. **Environment variables** đã set (ẩn sensitive data)

## ✅ Build đã thành công local

Build local đã pass:
- ✅ TypeScript compilation: Passed
- ✅ Static pages: 39/39 generated
- ✅ All routes: Compiled successfully

Nếu Vercel vẫn lỗi, có thể do:
- Environment variables thiếu
- Database connection issues
- Prisma generate issues trên Vercel
