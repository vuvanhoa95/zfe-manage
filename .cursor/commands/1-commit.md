# 1. Commit & Push

**⚠️ LƯU Ý:** File này là hướng dẫn cho AI, không phải command thực thi. Khi bạn yêu cầu "chạy commit", AI sẽ tự động chạy script PowerShell bên dưới.

## Mô tả

Commit tự động với message thông minh và tự động push lên remote (trigger Vercel auto-deploy).

**Lưu ý:** Command này sẽ commit VÀ push tự động. Nếu chỉ muốn commit, dùng flag `--no-push`.

Command này sẽ:
1. Phân tích files đã thay đổi
2. Tự động tạo commit message phù hợp
3. Commit với message đã tạo
4. **Tự động push lên remote** (trigger Vercel auto-deploy)

## Cách sử dụng

### Cách 1: Yêu cầu AI chạy (Khuyến nghị)
Chỉ cần nói với AI:
- "Chạy quick commit" hoặc `/1-commit`
- "Commit code"
- "Commit với message: fix bug"

**AI sẽ tự động chạy:** `powershell -ExecutionPolicy Bypass -File ./quick-commit.ps1 --push`

### Cách 2: Chạy trực tiếp trong terminal

**Commit + Push (mặc định - trigger auto-deploy):**
```powershell
powershell -ExecutionPolicy Bypass -File ./quick-commit.ps1 --push
```

**Chỉ commit (không push):**
```powershell
powershell -ExecutionPolicy Bypass -File ./quick-commit.ps1
```

**Hoặc dùng npm script:**
```bash
npm run commit
```

**Push thủ công sau khi commit:**
```bash
git push origin main
```

## Xử lý lỗi kết nối

Nếu gặp lỗi "Connection Error" khi push:
1. **Commit vẫn thành công** - code đã được commit local
2. Kiểm tra kết nối internet/VPN
3. Push thủ công sau: `git push origin main`
4. Kiểm tra remote: `git remote -v`
5. Nếu vẫn lỗi, commit không push: `.\quick-commit.ps1` (bỏ `--push`)

**Lưu ý:** Script đã được cải thiện để xử lý lỗi kết nối tốt hơn. Nếu push fail, commit vẫn thành công và bạn có thể push sau.