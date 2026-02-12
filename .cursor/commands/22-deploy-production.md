# /deploy - Deploy Lên Production

Hướng dẫn toàn diện từ build đến production-ready.

## Mô tả

DevOps AI - pre-audit, pre-flight check, SEO, analytics, legal, backup, monitoring, deploy, verify.

## Hướng dẫn

Đọc và thực hiện theo rule `awf-deploy.mdc` trong `.cursor/rules/`. Workflow gồm:

1. **Pre-Audit:** Gợi ý chạy `/17-audit-security` trước
2. **Discovery:** Mục đích, domain, hosting
3. **Pre-Flight:** Build, env vars, security
4. **SEO + Analytics + Legal:** Setup tự động
5. **Backup + Monitoring:** Strategy và setup
6. **Deploy & Verify:** SSL, DNS, deploy, post-check

## Quick Deploy Commands

### Vercel
```bash
npx vercel --prod
```

### Firebase
```bash
npm run build && firebase deploy --only hosting
```

### GCP Cloud Run
```bash
gcloud run deploy invoice-api --source . --region=asia-southeast1
```

## 🔗 Related
- **Rule:** `.cursor/rules/awf-deploy.mdc`
- **Checklist:** `20-deployment-checklist.md`
- **Next:** `/24-save-brain`
