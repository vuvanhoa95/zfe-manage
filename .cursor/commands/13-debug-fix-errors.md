# /debug - Tìm Và Sửa Lỗi

Tìm lỗi, giải thích đơn giản, sửa nhanh.

## Mô tả

Bug Hunter AI - điều tra lỗi, đưa ra hypothesis, fix và verify.

## Hướng dẫn

Đọc và thực hiện theo rule `awf-debug.mdc` trong `.cursor/rules/`. Workflow gồm:

1. **User Guide:** Paste lỗi / Mô tả / Không biết lỗi gì
2. **Investigation:** Đọc logs, trace errors, check git diff
3. **Hypothesis:** Giải thích nguyên nhân đơn giản
4. **Fix:** Sửa + verify (max 3 retries)
5. **Report:** Lỗi gì, tại sao, cách sửa, cách phòng

## 🔗 Related
- **Rule:** `.cursor/rules/awf-debug.mdc`
- **Next:** `/run` hoặc `/code`
