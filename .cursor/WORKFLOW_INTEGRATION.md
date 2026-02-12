# 🔗 Workflow Integration Guide

**Mapping document liên kết 3 lớp: Rules, Commands, và global_workflows**

---

## 📊 Tổng quan

Dự án WebZfenix sử dụng 3 lớp bổ trợ nhau:

```
┌─────────────────────────────────────┐
│  CURSOR RULES                       │  ← Auto-apply standards
│  - Coding conventions               │
│  - Brand guidelines                 │
│  - Security practices               │
└──────────────┬──────────────────────┘
               │
               │ Reference
               ▼
┌─────────────────────────────────────┐
│  GLOBAL_WORKFLOWS (AWF)             │  ← AI-driven processes
│  - /plan, /design, /code, /deploy   │
│  - Persona, context-aware           │
│  - Non-tech support                 │
└──────────────┬──────────────────────┘
               │
               │ Execute
               ▼
┌─────────────────────────────────────┐
│  .CURSOR/COMMANDS                   │  ← Technical tasks
│  - setup-database                    │
│  - deploy-production                 │
│  - build-production                  │
└─────────────────────────────────────┘
```

---

## 🗺️ Mapping Table

### Deployment Workflow

| Component | File | Purpose | When to Use |
|-----------|------|---------|-------------|
| **AI Workflow** | `global_workflows/deploy.md` | Full deployment process với AI persona | Khi cần quy trình đầy đủ, xử lý SEO/Analytics/Legal |
| **Technical Commands** | `.cursor/commands/12-deploy-production.md` | Scripts executable, step-by-step | Khi cần deploy nhanh, đã biết rõ steps |
| **Checklist** | `.cursor/commands/11-deployment-checklist.md` | Pre-deploy checklist | Trước mỗi lần deploy |
| **Rules** | Cursor Rules → Security, Env Vars | Auto-apply standards | Luôn tự động |

**Cross-references:**
- Workflow → Commands: "Xem `.cursor/commands/12-deploy-production.md` cho scripts"
- Commands → Workflow: "Dùng `/deploy` workflow để AI tự động xử lý SEO/Analytics"
- Both → Rules: "Tuân thủ Rules §9 (Security) và §6 (Environment Variables)"

---

### Code Development Workflow

| Component | File | Purpose | When to Use |
|-----------|------|---------|-------------|
| **AI Workflow** | `global_workflows/code.md` | Code với auto-test, persona | Khi code feature mới, cần quy trình |
| **Build Command** | `.cursor/commands/08-build-production.md` | Build production | Khi cần test build |
| **Lint Command** | `.cursor/commands/09-lint-code.md` | Check code quality | Trước commit |
| **Rules** | Cursor Rules → TypeScript, Naming, Brand | Auto-apply standards | Luôn tự động |

**Cross-references:**
- Workflow → Commands: "Sau khi code, chạy `.cursor/commands/09-lint-code.md`"
- Commands → Workflow: "Dùng `/code` workflow để AI tự động test và fix"
- Both → Rules: "Tuân thủ Rules §1 (TypeScript), §2 (Naming), §7 (Brand Colors)"

---

### Database Management

| Component | File | Purpose | When to Use |
|-----------|------|---------|-------------|
| **Setup** | `.cursor/commands/01-setup-database.md` | Initial setup | Lần đầu setup project |
| **Migrations** | `.cursor/commands/03-run-migrations.md` | Run migrations | Khi có schema changes |
| **Prisma Studio** | `.cursor/commands/04-open-prisma-studio.md` | GUI database viewer | Khi cần xem/edit data |
| **Reset** | `.cursor/commands/05-reset-database.md` | Reset DB (dev only) | Khi cần clean slate |

**Note:** Database commands là technical tasks, không có AI workflow tương ứng. Dùng trực tiếp.

---

### Debug & Troubleshooting

| Component | File | Purpose | When to Use |
|-----------|------|---------|-------------|
| **AI Workflow** | `global_workflows/debug.md` | AI-driven debugging với persona | Khi gặp lỗi, cần AI phân tích |
| **Rules** | Cursor Rules → Error Handling | Auto-apply error patterns | Luôn tự động |

**Cross-references:**
- Workflow → Rules: "Tuân thủ Rules §9 (Error Handling)"
- User → Workflow: "Gõ `/debug` để AI tự động điều tra lỗi"

---

## 🎯 Best Practices

### 1. Khi nào dùng Workflow vs Commands?

**Dùng Workflow (`/deploy`, `/code`, `/debug`) khi:**
- ✅ Cần quy trình đầy đủ
- ✅ Cần AI tự động xử lý điểm mù
- ✅ Non-tech users
- ✅ Cần context management

**Dùng Commands (`.cursor/commands/`) khi:**
- ✅ Cần làm nhanh, đã biết rõ steps
- ✅ Cần scripts executable
- ✅ Technical tasks cụ thể (setup DB, build...)

### 2. Khi nào Rules tự động apply?

**Rules tự động apply khi:**
- ✅ AI code (luôn follow Rules)
- ✅ AI review code
- ✅ AI suggest changes

**Không cần nhắc Rules khi:**
- ✅ Đã có trong Cursor Rules
- ✅ AI tự động follow

### 3. Workflow Integration Pattern

```
User: "/deploy production"
  ↓
AI (Workflow):
  1. Check Rules → Security, Env Vars
  2. Reference Commands → Scripts
  3. Execute Workflow → Full process
  4. Verify → Post-deploy checks
```

---

## 📝 Quick Reference

### Deployment
- **Full workflow:** `/deploy` (AI-driven)
- **Quick deploy:** `.cursor/commands/12-deploy-production.md`
- **Checklist:** `.cursor/commands/11-deployment-checklist.md`
- **Rules:** Security (§9), Env Vars (§6)

### Code Development
- **Full workflow:** `/code` (AI-driven)
- **Build:** `.cursor/commands/08-build-production.md`
- **Lint:** `.cursor/commands/09-lint-code.md`
- **Rules:** TypeScript (§1), Naming (§2), Brand (§7)

### Debug
- **Full workflow:** `/debug` (AI-driven)
- **Rules:** Error Handling (§9)

### Database
- **Setup:** `.cursor/commands/01-setup-database.md`
- **Migrations:** `.cursor/commands/03-run-migrations.md`
- **Studio:** `.cursor/commands/04-open-prisma-studio.md`

---

## 🔄 Update History

- **2026-01-17**: Initial mapping document
- **Future**: Auto-update khi có thay đổi trong workflows/commands

---

**Lưu ý:** Document này nên được cập nhật khi có thay đổi trong bất kỳ layer nào.

**Updated:** 2026-02-03 - Cập nhật cho dự án WebZfenix (website về BIM services, projects, solutions)
