# 🎮 Hướng dẫn tạo Commands trong Cursor

## Cách 1: Tạo Commands qua UI (Khuyến nghị)

1. **Mở Command Palette:**
   - Nhấn `Ctrl+Shift+P` (Windows) hoặc `Cmd+Shift+P` (Mac)
   - Hoặc gõ `/` trong chat

2. **Chọn "Create Command"** từ menu Actions

3. **Điền thông tin:**
   - **Name**: Tên command (ví dụ: "Quick Commit")
   - **Command**: Lệnh cần chạy (ví dụ: `powershell -ExecutionPolicy Bypass -File ./quick-commit.ps1`)
   - **Description**: Mô tả ngắn gọn

4. **Lưu command**

## 📋 Danh sách Commands cần tạo

### Git Commands

#### 1. Quick Commit
- **Name**: `Quick Commit`
- **Command**: `powershell -ExecutionPolicy Bypass -File ./quick-commit.ps1`
- **Description**: Commit với message tự động

#### 2. Quick Commit & Push
- **Name**: `Quick Commit & Push`
- **Command**: `powershell -ExecutionPolicy Bypass -File ./quick-commit.ps1 --push`
- **Description**: Commit và push lên GitHub (trigger auto-deploy)

#### 3. Git Status
- **Name**: `Git Status`
- **Command**: `git status`
- **Description**: Xem trạng thái Git

#### 4. Git Pull
- **Name**: `Git Pull`
- **Command**: `git pull origin main`
- **Description**: Pull code từ remote

### Deploy Commands

#### 5. Deploy Production
- **Name**: `Deploy Production`
- **Command**: `powershell -ExecutionPolicy Bypass -File ./deploy-production.ps1`
- **Description**: Deploy lên Vercel production

#### 6. Deploy (Skip Build)
- **Name**: `Deploy Skip Build`
- **Command**: `powershell -ExecutionPolicy Bypass -File ./deploy-production.ps1 --skip-build`
- **Description**: Deploy bỏ qua build test

### Build Commands

#### 7. Build Project
- **Name**: `Build Project`
- **Command**: `npm run build`
- **Description**: Build project để test

#### 8. Start Dev Server
- **Name**: `Start Dev Server`
- **Command**: `npm run dev`
- **Description**: Chạy development server

#### 9. Run Linter
- **Name**: `Run Linter`
- **Command**: `npm run lint`
- **Description**: Chạy ESLint

### Database Commands

#### 10. Generate Prisma Client
- **Name**: `Generate Prisma Client`
- **Command**: `npx prisma generate`
- **Description**: Generate Prisma Client

#### 11. Run Migrations
- **Name**: `Run Migrations`
- **Command**: `npx prisma migrate deploy`
- **Description**: Chạy database migrations

## Cách 2: Sử dụng qua Chat (AI sẽ tự động chạy)

Bạn có thể yêu cầu AI chạy commands trực tiếp:

```
"Chạy quick commit"
"Deploy production"
"Build project"
"Kiểm tra git status"
```

AI sẽ tự động nhận diện và chạy command tương ứng.

## 💡 Tips

- Commands được lưu trong Cursor settings
- Có thể gán keyboard shortcuts cho commands thường dùng
- Commands sẽ chạy trong terminal của Cursor
- Đảm bảo đường dẫn scripts đúng (relative hoặc absolute)
