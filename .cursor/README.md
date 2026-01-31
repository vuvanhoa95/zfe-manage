# Cursor AI Configuration

## 📋 Rules Reference

Khi làm việc với code trong `ZfeManage`, AI sẽ tự động đọc và áp dụng rules từ:

**`../quotation-app/.cursorrules`**

File này chứa tất cả:
- Coding conventions
- TypeScript rules
- API patterns
- Database guidelines
- UI/UX standards
- Brand guidelines (ZFENIX)
- Best practices

## 🎮 Custom Commands

Folder `.cursor/commands/` chứa các custom commands có thể chạy qua Cursor Chat.

### 📁 Commands Location:
- `.cursor/commands/*.md` - Mỗi file `.md` là một command

### 🚀 Cách sử dụng Commands:

**Cách 1: Dùng slash commands**
Trong Cursor Chat, gõ `/` và chọn command:
- `/quick-commit` - Commit với message tự động
- `/quick-commit-push` - Commit và push
- `/deploy-production` - Deploy lên Vercel
- `/build` - Build project
- `/git-status` - Xem trạng thái Git

**Cách 2: Yêu cầu AI chạy**
Bạn có thể yêu cầu AI chạy commands:
- "Chạy quick commit"
- "Deploy production"
- "Build project"
- "Kiểm tra git status"

### 📝 Available Commands:

#### Git Commands:
- **Quick Commit** - Commit với message tự động
- **Quick Commit & Push** - Commit và push (trigger auto-deploy)
- **Commit với message** - Commit với message tùy chỉnh
- **Git Status** - Xem trạng thái Git
- **Git Pull** - Pull code từ remote
- **Git Log** - Xem lịch sử commits

#### Deploy Commands:
- **Deploy Production** - Deploy lên Vercel production
- **Deploy Production (Skip Build)** - Deploy bỏ qua build test
- **Check Vercel Status** - Kiểm tra trạng thái Vercel
- **Pull Env Variables** - Pull environment variables từ Vercel

#### Build & Development:
- **Build Project** - Build project để test
- **Start Dev Server** - Chạy development server
- **Run Linter** - Chạy ESLint

#### Database:
- **Generate Prisma Client** - Generate Prisma Client
- **Run Migrations** - Chạy database migrations

## 🔄 Workflow

1. AI đọc `.cursorrules` từ `quotation-app` khi được yêu cầu code
2. Áp dụng tất cả rules vào code trong `ZfeManage`
3. Đảm bảo code tuân thủ conventions và có thể build/deploy
4. Sử dụng commands để tự động hóa các tác vụ thường dùng

## 📁 Structure

```
ZfeManage/              ← CODE CHÍNH (Production)
├── .cursor/
│   ├── README.md       ← File này
│   └── commands.json   ← Custom commands
├── .cursorrules        ← Reference đến quotation-app rules
└── ...

quotation-app/          ← RULES & DOCS (Reference only)
├── .cursorrules        ← ĐỌC FILE NÀY
├── ARCHITECTURE.md
├── PROJECT_PLAN.md
└── ...
```

## 💡 Tips

- Sử dụng commands qua chat để tăng tốc workflow
- Commands tự động hóa các tác vụ lặp lại
- Kết hợp với quick-commit.ps1 để commit nhanh
- Auto-deploy sẽ trigger khi push lên main branch
