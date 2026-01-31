# 🎮 Cursor Commands - ZfeManage

Folder này chứa các custom commands cho dự án ZfeManage.

## 📋 Danh sách Commands (theo thứ tự)

### 🔧 Git Commands (1-4)
- `/1-commit` - Commit tự động với message thông minh và push (trigger auto-deploy)
- `/2-status` - Xem trạng thái Git
- `/3-pull` - Pull code từ remote
- `/4-log` - Xem lịch sử commits

### 🏗️ Build & Development (5-8)
- `/5-dev` - Chạy dev server
- `/6-open` - Mở localhost:3000 trong browser
- `/7-build` - Build project
- `/8-lint` - Chạy ESLint

### 🚀 Deploy Commands (9-12)
- `/9-deploy` - Deploy lên Vercel production
- `/10-deploy-fast` - Deploy bỏ qua build test (nhanh)
- `/11-vercel` - Kiểm tra trạng thái Vercel
- `/12-env` - Pull environment variables từ Vercel

### 🗄️ Database Commands (13-14)
- `/13-generate` - Generate Prisma Client
- `/14-migrate` - Chạy database migrations

## 🚀 Cách sử dụng

Trong Cursor Chat, gõ `/` và chọn command từ danh sách, hoặc gõ trực tiếp:
- `/1-commit` - Commit và push tự động (trigger auto-deploy)
- `/5-dev` - Chạy dev server
- `/9-deploy` - Deploy production

## 💡 Quick Reference

**Workflow thường dùng:**
1. `/5-dev` - Chạy dev server
2. `/6-open` - Mở browser xem
3. Code xong → `/1-commit` - Commit và push tự động (trigger Vercel auto-deploy)
4. `/9-deploy` - Deploy production (nếu cần, thường không cần vì auto-deploy)

**Database:**
- `/13-generate` - Sau khi thay đổi schema
- `/14-migrate` - Chạy migrations

## ⚠️ Lưu ý

- Commands sẽ chạy trong terminal của Cursor
- Một số commands cần quyền truy cập (Vercel login, Git credentials)
- Auto-deploy chỉ trigger khi push lên `main` branch
- `/1-commit` sẽ tự động commit VÀ push (trigger auto-deploy)
- Nếu gặp lỗi kết nối khi push, commit vẫn thành công và có thể push thủ công sau