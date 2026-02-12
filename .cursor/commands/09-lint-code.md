# Lint Code

Chạy ESLint để check code quality và style.

## Mô tả
Kiểm tra code với ESLint để đảm bảo code quality và consistency.

> 💡 **Tip:** Dùng `/code` workflow (từ `global_workflows/code.md`) để AI tự động lint và fix. Hoặc dùng command này để check nhanh.

## 🔗 Related Files
- **AI Workflow:** `global_workflows/code.md` - Code workflow với auto-lint
- **Audit:** `global_workflows/audit.md` - Full code quality audit
- **Rules:** Cursor Rules → Code Style (§1)

## Command

```bash
npm run lint
```

## Auto-fix
```bash
npx eslint . --fix
```

## Lưu ý
- ESLint config được định nghĩa trong `eslint.config.mjs`
- Sử dụng `--fix` để tự động fix các lỗi có thể fix được
- Review các warnings và errors trước khi commit code
- Có thể cấu hình ESLint trong VS Code để auto-fix on save
