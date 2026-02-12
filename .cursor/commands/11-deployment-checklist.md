# Deployment Checklist

Checklist trước khi deploy lên production.

> 💡 **Tip:** Checklist này bổ sung cho AI workflow `/deploy` (từ `global_workflows/deploy.md`). Workflow sẽ tự động xử lý nhiều items này, nhưng nên review manual trước khi deploy.

## 🔗 Related Files
- **AI Workflow:** `global_workflows/deploy.md` - Full deployment process với AI persona
- **Deploy Scripts:** `.cursor/commands/12-deploy-production.md` - Technical deployment commands
- **Rules:** Cursor Rules → Security (§9), Environment Variables (§6)

## Pre-Deployment

### 1. Code Quality
- [ ] Chạy `npm run lint` và fix tất cả errors
- [ ] Test tất cả features manually
- [ ] Review code changes
- [ ] Đảm bảo không có console.log hoặc debug code

### 2. Database
- [ ] Backup production database
- [ ] Chạy migrations: `npx prisma migrate deploy`
- [ ] Verify schema matches production
- [ ] Test database connections

### 3. Environment Variables
- [ ] Set tất cả environment variables trong production
- [ ] Verify `DATABASE_URL` đúng
- [ ] Set `NEXTAUTH_SECRET` và `NEXTAUTH_URL`
- [ ] Verify API keys và secrets
- [ ] **⚠️ Workflow sẽ tự check:** AI workflow `/deploy` sẽ verify env vars tự động

### 4. Build
- [ ] Chạy `npm run build` thành công
- [ ] Test production build locally: `npm run start`
- [ ] Verify không có build errors
- [ ] Check bundle size

### 5. Assets & Files
- [ ] Verify static files được serve đúng
- [ ] Check images và fonts trong `public/` directory
- [ ] Verify upload directories có permissions đúng

### 6. Security
- [ ] Review authentication setup
- [ ] Verify CORS settings
- [ ] Check API rate limiting (nếu có)
- [ ] Review input validation
- [ ] **⚠️ Workflow sẽ tự check:** AI workflow `/deploy` có Pre-Audit Recommendation (Giai đoạn 0)
- [ ] **💡 Tip:** Chạy `/audit` (từ `global_workflows/audit.md`) để AI tự động scan security issues

## Deployment Steps

### Vercel (Full Stack - Khuyến nghị)
```bash
# 1. Pull environment variables
vercel env pull .env.local

# 2. Run migrations (nếu có migrations mới)
npx prisma migrate deploy

# 3. Deploy production
vercel --prod
```

### Preview Deployment (Test trước)
```bash
vercel
```

## Post-Deployment

- [ ] Test tất cả critical paths
- [ ] Verify API endpoints hoạt động
- [ ] Check database connections
- [ ] Monitor error logs
- [ ] Test authentication flow
- [ ] Verify admin panel hoạt động
- [ ] Test project gallery và media upload
- [ ] **⚠️ Workflow sẽ tự check:** AI workflow `/deploy` có Post-Deploy Verification (Giai đoạn 10)
- [ ] **💡 SEO/Analytics:** Workflow tự động setup SEO, Analytics, Legal pages (Giai đoạn 3-5)

## Rollback Plan

Nếu có issues:
1. Revert code changes
2. Restore database backup nếu cần
3. Redeploy previous version
4. Investigate và fix issues

## Monitoring

- Monitor Vercel deployment logs
- Check Vercel Analytics và Speed Insights
- Monitor database performance
- Set up error alerts trên Vercel Dashboard
- Kiểm tra Function logs trong Vercel Dashboard
