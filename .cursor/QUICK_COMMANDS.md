# Quick Commands Reference

Tổng hợp các commands thường dùng nhất cho dự án WebZfenix.

## 🚀 Development

```bash
# Start dev server
npm run dev

# Build production
npm run build

# Start production server
npm run start
```

## 🗄️ Database

```bash
# Setup database (first time)
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed

# Generate Prisma Client (sau khi thay đổi schema)
npx prisma generate

# Run migrations
npx prisma migrate dev --name migration_name

# Open Prisma Studio
npx prisma studio

# Reset database (⚠️ development only)
npx prisma migrate reset
```

## 🔍 Code Quality

```bash
# Lint code
npm run lint

# Auto-fix lint errors
npx eslint . --fix
```

## 📦 Dependencies

```bash
# Install dependencies
npm install

# Update dependencies
npm update

# Add new package
npm install package-name

# Add dev dependency
npm install -D package-name
```

## 🧪 Testing (Khi có)

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## ☁️ Deployment

### Vercel Deployment
```bash
# Deploy to Vercel production
vercel --prod

# Deploy preview
vercel
```

## 🔧 Utilities

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Clear Next.js cache
rm -rf .next

# Clear node_modules và reinstall
rm -rf node_modules && npm install
```

## 📝 Git Commands

```bash
# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "type(scope): description"

# Push
git push origin branch-name

# Pull latest
git pull origin branch-name
```

## 🆘 Troubleshooting

```bash
# Prisma Client errors
npx prisma generate

# Build errors
rm -rf .next && npm run build

# Port already in use
# Windows: netstat -ano | findstr :3000
# Kill process hoặc đổi port trong package.json

# Database connection errors
# Check DATABASE_URL trong .env file
```

---

**Tip**: Sử dụng Cursor Command Palette (`Ctrl+Shift+P`) để tìm và chạy các commands nhanh hơn!
