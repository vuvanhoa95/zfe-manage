# 📋 Commands Reference - Quick Lookup

File này để AI reference khi người dùng yêu cầu chạy commands.

## 🚀 Quick Commands

### Git
```powershell
# Quick commit (auto message)
.\quick-commit.ps1

# Quick commit với message
.\quick-commit.ps1 "your message"

# Quick commit và push
.\quick-commit.ps1 --push

# Git status
git status

# Git pull
git pull origin main

# Git log
git log --oneline -10
```

### Deploy
```powershell
# Deploy production
.\deploy-production.ps1

# Deploy skip build
.\deploy-production.ps1 --skip-build

# Vercel status
vercel project ls

# Pull env variables
vercel env pull .env.local
```

### Build & Dev
```bash
# Build
npm run build

# Dev server
npm run dev

# Linter
npm run lint
```

### Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

## 🤖 AI Command Mapping

Khi người dùng nói:
- "Chạy quick commit" → `.\quick-commit.ps1`
- "Commit và push" → `.\quick-commit.ps1 --push`
- "Deploy production" → `.\deploy-production.ps1`
- "Build project" → `npm run build`
- "Kiểm tra git status" → `git status`
- "Pull code" → `git pull origin main`
- "Chạy linter" → `npm run lint`
- "Generate Prisma" → `npx prisma generate`

## 📁 Related Files
- `quick-commit.ps1` - Auto commit script
- `deploy-production.ps1` - Deploy script
- `run-command.ps1` - Command helper
- `.cursor/CREATE_COMMANDS.md` - Hướng dẫn tạo commands trong UI
