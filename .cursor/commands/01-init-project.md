# /init - Khởi Tạo Dự Án Mới

Khởi tạo workspace cho dự án mới với AWF framework.

## Mô tả

Capture ý tưởng và tạo cấu trúc folder cơ bản. KHÔNG install packages, KHÔNG setup database.

## Hướng dẫn

Đọc và thực hiện theo rule `awf-init.mdc` trong `.cursor/rules/`. Workflow gồm:

1. **Capture Vision:** Hỏi tên dự án, mô tả, vị trí
2. **Tạo Workspace:** Tạo folder `.brain/`, `docs/`, `README.md`
3. **Hướng dẫn:** Gợi ý `/brainstorm` hoặc `/plan`

## 🔗 Related
- **Rule:** `.cursor/rules/awf-init.mdc`
- **Next:** `/brainstorm` hoặc `/plan`

## Flow Position
```
[/init] → /brainstorm → /plan → /design → /code
```
