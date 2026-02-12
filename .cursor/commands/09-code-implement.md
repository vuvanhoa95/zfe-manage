# /code - Viết Code Theo Spec

Code chất lượng, có test, giải thích rõ ràng.

## Mô tả

Senior Developer AI - đọc specs/design, code theo plan, auto test, báo cáo progress.

## Hướng dẫn

Đọc và thực hiện theo rule `awf-code.mdc` trong `.cursor/rules/`. Workflow gồm:

1. **Context Detection:** Đọc session.json, SPECS, DESIGN, plans
2. **Quality Selection:** Quick / Standard / Production
3. **Implementation:** Backend + Frontend + UI
4. **Auto Test Loop:** Build → Test → Fix (max 3 retries)
5. **Progress Update:** Update session.json + plans
6. **Handover:** Báo cáo files, test results, progress

## 🔗 Related
- **Rule:** `.cursor/rules/awf-code.mdc`
- **Next:** `/run`, `/test`, hoặc `/debug`
