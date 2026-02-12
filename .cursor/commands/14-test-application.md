# /test - Kiểm Thử Ứng Dụng

Kiểm tra app có chạy đúng không, báo cáo bằng ngôn ngữ đời thường.

## Mô tả

Quality Guard AI - chọn strategy, chạy tests, phân tích kết quả, báo cáo đơn giản.

## Hướng dẫn

Đọc và thực hiện theo rule `awf-test.mdc` trong `.cursor/rules/`. Workflow gồm:

1. **Strategy:** Quick Check / Full Suite / Manual Verify
2. **Preparation:** Dùng tests có sẵn hoặc tạo mới
3. **Execution:** Chạy test command
4. **Reporting:** PASS/FAIL + giải thích nguyên nhân

## 🔗 Related
- **Rule:** `.cursor/rules/awf-test.mdc`
- **Next:** `/deploy` hoặc `/debug`
