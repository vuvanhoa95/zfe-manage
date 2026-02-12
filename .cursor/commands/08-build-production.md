# Build Production

Build dự án cho production deployment.

## Mô tả
Tạo production build của Next.js application.

> 💡 **Tip:** Dùng `/code` workflow (từ `global_workflows/code.md`) để AI tự động build và test. Hoặc dùng command này để build nhanh.

## 🔗 Related Files
- **AI Workflow:** `global_workflows/code.md` - Code workflow với auto-test
- **Deploy:** `.cursor/commands/12-deploy-production.md` - Deploy sau khi build
- **Rules:** Cursor Rules → Build & Performance

## Commands

### Build
```bash
npm run build
```

### Build và Start Production Server
```bash
npm run build
npm run start
```

## Output
- Build files được tạo trong `.next/` directory
- Static files được optimize và minified
- Check `.next/` folder để xem build output

## Lưu ý
- Đảm bảo tất cả environment variables đã được set
- Check build logs để đảm bảo không có errors
- Test production build locally với `npm run start` trước khi deploy
- Production build sẽ không có hot reload
