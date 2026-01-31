# 1. Commit & Push

**⚠️ LƯU Ý:** File này là hướng dẫn cho AI, không phải command thực thi. Khi bạn yêu cầu "chạy commit", AI sẽ tự động chạy script PowerShell bên dưới.

## Mô tả

Commit tự động với message thông minh. Push là bước riêng để tránh mất kết nối.

**Lưu ý:** Command này chỉ commit (nhanh). Để push, chạy thêm command push riêng.

Command này sẽ:
1. Phân tích files đã thay đổi
2. Tự động tạo commit message phù hợp
3. Commit với message đã tạo

## Cách sử dụng

### Cách 1: Yêu cầu AI chạy (Khuyến nghị)
Chỉ cần nói với AI:
- "Chạy quick commit"
- "Commit code"
- "Commit với message: fix bug"

AI sẽ tự động chạy script PowerShell.

### Cách 2: Chạy trực tiếp trong terminal

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

## Xử lý lỗi kết nối

Nếu gặp lỗi "Connection Error":
1. Kiểm tra kết nối internet/VPN
2. Chạy commit không push: `.\quick-commit.ps1` (không có `--push`)
3. Push thủ công sau: `git push origin main`
4. Kiểm tra remote: `git remote -v`
