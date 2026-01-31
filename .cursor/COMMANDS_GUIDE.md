# 🎮 Cursor Commands Guide

Hướng dẫn sử dụng commands để điều khiển dự án qua Cursor Chat.

## 🚀 Cách sử dụng

Trong Cursor Chat, bạn có thể yêu cầu AI chạy các commands bằng cách:

### Ví dụ 1: Commit nhanh
```
"Chạy quick commit"
"Commit code với message tự động"
"Quick commit và push"
```

### Ví dụ 2: Deploy
```
"Deploy production"
"Deploy lên Vercel"
"Deploy bỏ qua build test"
```

### Ví dụ 3: Build & Test
```
"Build project"
"Chạy linter"
"Kiểm tra git status"
```

## 📋 Danh sách Commands

### 🔧 Git Commands

#### 1. Quick Commit
**Yêu cầu:** "Chạy quick commit" hoặc "Commit code"
**Command:** `.\quick-commit.ps1`
**Mô tả:** Commit với message tự động dựa trên files đã thay đổi

#### 2. Quick Commit & Push
**Yêu cầu:** "Commit và push" hoặc "Push code lên GitHub"
**Command:** `.\quick-commit.ps1 --push`
**Mô tả:** Commit và push lên GitHub, trigger Vercel auto-deploy

#### 3. Commit với message
**Yêu cầu:** "Commit với message: fix login bug"
**Command:** `.\quick-commit.ps1 "your message"`
**Mô tả:** Commit với message tùy chỉnh

#### 4. Git Status
**Yêu cầu:** "Kiểm tra git status" hoặc "Xem thay đổi"
**Command:** `git status`
**Mô tả:** Xem trạng thái Git

#### 5. Git Pull
**Yêu cầu:** "Pull code từ GitHub"
**Command:** `git pull origin main`
**Mô tả:** Pull code mới nhất từ remote

#### 6. Git Log
**Yêu cầu:** "Xem lịch sử commits"
**Command:** `git log --oneline -10`
**Mô tả:** Xem 10 commits gần nhất

### 🚀 Deploy Commands

#### 7. Deploy Production
**Yêu cầu:** "Deploy production" hoặc "Deploy lên Vercel"
**Command:** `.\deploy-production.ps1`
**Mô tả:** Deploy đầy đủ lên Vercel production

#### 8. Deploy Production (Skip Build)
**Yêu cầu:** "Deploy bỏ qua build"
**Command:** `.\deploy-production.ps1 --skip-build`
**Mô tả:** Deploy nhanh, bỏ qua build test local

#### 9. Check Vercel Status
**Yêu cầu:** "Kiểm tra Vercel status"
**Command:** `vercel project ls`
**Mô tả:** Xem trạng thái project trên Vercel

#### 10. Pull Env Variables
**Yêu cầu:** "Pull environment variables"
**Command:** `vercel env pull .env.local`
**Mô tả:** Pull environment variables từ Vercel về local

### 🏗️ Build & Development

#### 11. Build Project
**Yêu cầu:** "Build project" hoặc "Test build"
**Command:** `npm run build`
**Mô tả:** Build project để kiểm tra lỗi

#### 12. Start Dev Server
**Yêu cầu:** "Chạy dev server" hoặc "Start development"
**Command:** `npm run dev`
**Mô tả:** Chạy development server

#### 13. Run Linter
**Yêu cầu:** "Chạy linter" hoặc "Kiểm tra code"
**Command:** `npm run lint`
**Mô tả:** Chạy ESLint để kiểm tra code quality

### 🗄️ Database Commands

#### 14. Generate Prisma Client
**Yêu cầu:** "Generate Prisma Client"
**Command:** `npx prisma generate`
**Mô tả:** Generate Prisma Client sau khi thay đổi schema

#### 15. Run Migrations
**Yêu cầu:** "Chạy migrations"
**Command:** `npx prisma migrate deploy`
**Mô tả:** Chạy database migrations

## 💡 Workflow Examples

### Workflow 1: Commit và Deploy
```
1. "Chạy quick commit với message: add new feature"
2. "Push code lên GitHub"
3. (Vercel tự động deploy)
```

### Workflow 2: Build và Test
```
1. "Build project"
2. "Chạy linter"
3. Nếu OK: "Deploy production"
```

### Workflow 3: Update Database
```
1. "Generate Prisma Client"
2. "Chạy migrations"
3. "Commit với message: update database schema"
```

## ⚠️ Lưu ý

- Commands sẽ chạy trong terminal của Cursor
- Đảm bảo đã cài đặt các dependencies cần thiết
- Một số commands cần quyền truy cập (Vercel login, Git credentials)
- Auto-deploy chỉ trigger khi push lên `main` branch

## 🔗 Related Files

- `quick-commit.ps1` - Script commit tự động
- `deploy-production.ps1` - Script deploy production
- `package.json` - npm scripts
- `QUICK_COMMIT_GUIDE.md` - Hướng dẫn commit chi tiết
