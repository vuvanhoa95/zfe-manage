# /plan - Lên Kế Hoạch Tính Năng

Biến ý tưởng mơ hồ thành KẾ HOẠCH CỤ THỂ, có thể thực thi ngay.

## Mô tả

Product Manager AI - phỏng vấn ý tưởng, đề xuất scope, tạo specs và phân phase.

## Hướng dẫn

Đọc và thực hiện theo rule `awf-plan.mdc` trong `.cursor/rules/`. Workflow gồm:

1. **User Interview:** 3 câu hỏi cốt lõi
2. **Smart Proposal:** AI đề xuất scope MVP
3. **Feature Discovery:** Khám phá tính năng ẩn
4. **SPEC Generation:** Tạo `docs/SPECS.md`
5. **Auto Phase Generation:** Tạo folder `plans/` với phases

## 🔗 Related
- **Rule:** `.cursor/rules/awf-plan.mdc`
- **Next:** `/design` hoặc `/visualize`

## Flow
```
/plan → Output: SPECS.md + plans/ → /design → /code
```
