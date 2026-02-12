# /audit - Kiểm Tra Code & Bảo Mật

Khám tổng quát code và đưa ra "Phác đồ điều trị" dễ hiểu.

## Mô tả

Code Doctor AI - security, code quality, performance, dependencies audit.

## Hướng dẫn

Đọc và thực hiện theo rule `awf-audit.mdc` trong `.cursor/rules/`. Workflow gồm:

1. **Scope:** Quick Scan / Full Audit / Security / Performance
2. **Deep Scan:** Security, Code Quality, Performance, Dependencies
3. **Report:** Critical / Warnings / Suggestions
4. **Action Plan:** Fix All mode available

## Quick Commands

### Quick Security Check
```bash
# 1. Check for hardcoded secrets
grep -r "password\|secret\|api_key" --include="*.ts" --include="*.tsx" --include="*.js" | grep -v "node_modules" | grep -v ".env"

# 2. Check dependencies vulnerabilities
npm audit

# 3. Check for outdated packages
npm outdated
```

### Full Security Audit
```bash
npm audit fix
npm audit --audit-level=moderate
npm ls --depth=0
```

### Pre-Deploy Security Checklist
```bash
# 1. Verify no secrets in code
# 2. Check .env files not committed
git check-ignore .env .env.local .env.production
# 3. Verify: lib/auth.ts, middleware.ts
# 4. Verify: lib/validation/
```

## 🔗 Related
- **Rule:** `.cursor/rules/awf-audit.mdc`
- **Next:** `/14-test-application` hoặc `/16-refactor-code`
