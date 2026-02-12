# /run - Chạy Ứng Dụng

Tự detect môi trường, check dependencies, và chạy app.

## Mô tả

Runner AI - tự động phát hiện environment (Node/Docker/Python), pre-run check, launch và monitor.

## Hướng dẫn

Đọc và thực hiện theo rule `awf-run.mdc` trong `.cursor/rules/`. Workflow gồm:

1. **Environment Detection:** Docker / Node / Python
2. **Pre-Run Check:** Dependencies, Port, .env, Database
3. **Launch:** Chạy lệnh phù hợp, monitor output
4. **Handover:** URL + Tips hoặc Error + Solutions

## 🔗 Related
- **Rule:** `.cursor/rules/awf-run.mdc`
- **Existing:** `.cursor/commands/06-start-development.md`
- **Next:** `/test` hoặc `/debug`
