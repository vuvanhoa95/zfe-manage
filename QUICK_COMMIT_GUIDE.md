# 🚀 Quick Commit Guide - ZfeManage

Script tự động commit với mô tả thông minh cho dự án ZfeManage.

## 📋 Cách sử dụng

### Cách 1: Dùng PowerShell Script (Khuyến nghị)

```powershell
# Commit với message tự động
.\quick-commit.ps1

# Commit với message tùy chỉnh
.\quick-commit.ps1 "fix login bug"

# Commit và push luôn
.\quick-commit.ps1 "add new feature" --push

# Chỉ định type cụ thể
.\quick-commit.ps1 "update API" --type feat --push
```

### Cách 2: Dùng npm scripts

```bash
# Commit với message tự động
npm run commit

# Commit và push luôn
npm run commit:push
```

## 🎯 Tính năng tự động

Script sẽ tự động:

1. **Phát hiện loại thay đổi:**
   - `feat`: Components, API routes mới
   - `fix`: Bug fixes
   - `refactor`: Code refactoring
   - `style`: CSS, styling changes
   - `chore`: Dependencies, config files
   - `docs`: Documentation updates
   - `test`: Test files

2. **Tạo commit message thông minh:**
   - Tự động detect type dựa trên files đã thay đổi
   - Tạo message mô tả phù hợp
   - Thêm timestamp nếu cần

3. **Add và commit tự động:**
   - Add tất cả files đã thay đổi
   - Commit với message đã tạo

## 📝 Ví dụ

### Ví dụ 1: Commit thông thường
```powershell
.\quick-commit.ps1
# Output: feat: Update components - 2026-01-31 10:30
```

### Ví dụ 2: Commit với message tùy chỉnh
```powershell
.\quick-commit.ps1 "fix authentication issue"
# Output: fix: fix authentication issue
```

### Ví dụ 3: Commit và push
```powershell
.\quick-commit.ps1 "add user dashboard" --push
# → Commit + Push + Vercel auto-deploy
```

### Ví dụ 4: Chỉ định type
```powershell
.\quick-commit.ps1 "refactor API structure" --type refactor --push
# Output: refactor: refactor API structure
```

## 🔧 Types có sẵn

- `feat`: Tính năng mới
- `fix`: Sửa lỗi
- `chore`: Công việc bảo trì (dependencies, config)
- `refactor`: Tái cấu trúc code
- `docs`: Tài liệu
- `style`: Formatting, CSS
- `test`: Tests
- `perf`: Performance improvements

## 💡 Tips

1. **Commit thường xuyên:** Commit nhỏ, thường xuyên tốt hơn commit lớn
2. **Message rõ ràng:** Dù script tự động, nên thêm message mô tả rõ ràng
3. **Push khi sẵn sàng:** Chỉ dùng `--push` khi code đã test và sẵn sàng deploy
4. **Review trước khi push:** Nếu cần review kỹ, commit trước, push sau

## 🚀 Workflow đề xuất

```powershell
# 1. Code xong
# 2. Commit nhanh
.\quick-commit.ps1 "implement new feature"

# 3. Test local
npm run dev

# 4. Nếu OK, push
git push origin main

# Hoặc commit + push luôn
.\quick-commit.ps1 "implement new feature" --push
```

## ⚠️ Lưu ý

- Script sẽ add TẤT CẢ files đã thay đổi
- Kiểm tra `git status` trước nếu cần exclude files
- Không commit file nhạy cảm: `.env`, `.env.local`, credentials
