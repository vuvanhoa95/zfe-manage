# 1. Commit & Push

Commit tự động với message thông minh. Push là bước riêng để tránh mất kết nối.

**Lưu ý:** Command này chỉ commit (nhanh). Để push, chạy thêm command push riêng.

Command này sẽ:
1. Phân tích files đã thay đổi
2. Tự động tạo commit message phù hợp
3. Commit với message đã tạo

**Commit (mặc định - nhanh, an toàn):**
```powershell
powershell -ExecutionPolicy Bypass -File ./quick-commit.ps1
```

**Hoặc dùng npm script:**
```bash
npm run commit
```

**Để push sau khi commit:**
```bash
git push origin main
```

**Hoặc commit + push cùng lúc (có thể mất thời gian):**
```powershell
powershell -ExecutionPolicy Bypass -File ./quick-commit.ps1 --push
```
