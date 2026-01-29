# Development Guide - ZfeManage

## 📁 Cấu trúc Project

### ZfeManage (Production Code)
Đây là folder **CODE CHÍNH** để build và deploy app. Tất cả code production được viết ở đây.

### quotation-app (Rules & Documentation)
Folder này chứa **RULES, DOCUMENTATION, và REQUIREMENTS** cho development. 
**KHÔNG** viết code production ở đây, chỉ dùng để reference.

## 🔗 Reference Rules từ quotation-app

Khi làm việc với code trong `ZfeManage`, luôn tham khảo:

### Core Rules
- **`.cursorrules`** - Tất cả coding rules và conventions
- **`ARCHITECTURE.md`** - Kiến trúc hệ thống, data flow, patterns
- **`PROJECT_PLAN.md`** - Kế hoạch phát triển theo phases

### Development Guides
- **`DEV_TODO.md`** - TODO list chi tiết cho development
- **`README.md`** - Tổng quan dự án và setup
- **`QUICKSTART.md`** - Hướng dẫn nhanh để bắt đầu
- **`DELIVERY_SUMMARY.md`** - Tóm tắt các tính năng đã deliver

### Documentation
- **`docs/`** - Tài liệu bổ sung về brand, design system, etc.

## 🚀 Setup Development Environment

```bash
# 1. Cài đặt dependencies
cd ZfeManage
npm install

# 2. Setup database
npx prisma generate
npx prisma migrate dev

# 3. Seed dữ liệu demo (tùy chọn)
npm run prisma:seed

# 4. Chạy dev server
npm run dev
```

## 📝 Workflow

1. **Đọc rules** từ `../quotation-app/.cursorrules` trước khi code
2. **Tham khảo** `ARCHITECTURE.md` để hiểu patterns
3. **Code** trong `ZfeManage` theo đúng conventions
4. **Test** và đảm bảo có thể build được
5. **Commit** code vào `ZfeManage`

## 🎯 Key Principles

- **ZfeManage** = Production code (deploy được)
- **quotation-app** = Rules & docs (reference only)
- Luôn tuân theo rules từ `quotation-app` khi code trong `ZfeManage`
