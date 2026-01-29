# Cursor AI Configuration

## 📋 Rules Reference

Khi làm việc với code trong `ZfeManage`, AI sẽ tự động đọc và áp dụng rules từ:

**`../quotation-app/.cursorrules`**

File này chứa tất cả:
- Coding conventions
- TypeScript rules
- API patterns
- Database guidelines
- UI/UX standards
- Brand guidelines (ZFENIX)
- Best practices

## 🔄 Workflow

1. AI đọc `.cursorrules` từ `quotation-app` khi được yêu cầu code
2. Áp dụng tất cả rules vào code trong `ZfeManage`
3. Đảm bảo code tuân thủ conventions và có thể build/deploy

## 📁 Structure

```
ZfeManage/              ← CODE CHÍNH (Production)
├── .cursorrules        ← Reference đến quotation-app rules
└── ...

quotation-app/          ← RULES & DOCS (Reference only)
├── .cursorrules        ← ĐỌC FILE NÀY
├── ARCHITECTURE.md
├── PROJECT_PLAN.md
└── ...
```
