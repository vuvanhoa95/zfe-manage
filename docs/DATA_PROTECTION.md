# Data Protection Guidelines

## ⚠️ QUAN TRỌNG: Bảo vệ dữ liệu khi deploy

### Nguyên tắc cơ bản

1. **KHÔNG BAO GIỜ** xóa dữ liệu trong production
2. **LUÔN** backup database trước khi chạy migrations
3. **KIỂM TRA** migrations có DROP TABLE trước khi deploy
4. **XÁC NHẬN** rõ ràng trước khi chạy migrations nguy hiểm

### Các biện pháp bảo vệ đã được implement

#### 1. Deploy Scripts Protection

Deploy scripts (`deploy-production.ps1` và `deploy-production.sh`) đã được cập nhật với:

- ⚠️ Cảnh báo trước khi chạy migrations
- 🔍 Tự động kiểm tra migrations có DROP TABLE
- ✅ Yêu cầu xác nhận rõ ràng (phải gõ "yes")
- 📊 Hiển thị số lượng records trong database

#### 2. ensureCoreSchema() Protection

Function `ensureCoreSchema()` trong `lib/db-schema.ts`:

- ✅ Chỉ dùng `CREATE TABLE IF NOT EXISTS`
- ✅ **KHÔNG BAO GIỜ** xóa hoặc thay đổi dữ liệu hiện có
- ✅ An toàn để chạy nhiều lần

#### 3. Migration Safety Checks

Module `lib/db-protection.ts` cung cấp:

- `checkMigrationsForDropTable()` - Kiểm tra migrations có DROP TABLE
- `hasDataInDatabase()` - Kiểm tra database có dữ liệu không
- `countDatabaseRecords()` - Đếm số records trong các bảng
- `checkMigrationSafety()` - Kiểm tra tổng thể an toàn

### Quy trình deploy an toàn

#### Bước 1: Backup Database

```bash
# SQLite
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)

# PostgreSQL (nếu dùng)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Bước 2: Kiểm tra Migrations

```bash
# Kiểm tra migrations có DROP TABLE
grep -r "DROP TABLE" prisma/migrations/

# Nếu có, xem xét kỹ migration đó
cat prisma/migrations/[migration-name]/migration.sql
```

#### Bước 3: Chạy Deploy Script

```bash
# PowerShell
.\deploy-production.ps1

# Bash
./deploy-production.sh
```

Script sẽ:
1. ⚠️ Cảnh báo về migrations
2. 🔍 Kiểm tra DROP TABLE
3. ✅ Yêu cầu xác nhận
4. 🗄️ Chạy migrations (nếu được xác nhận)

### Migrations có DROP TABLE

Migration `20260128101147_add_cashflow_payment_milestone_and_outsource_fields` có DROP TABLE nhưng:

- ✅ **AN TOÀN** vì có `INSERT INTO ... SELECT ... FROM` trước DROP TABLE
- ✅ Dữ liệu được copy sang bảng mới trước khi drop bảng cũ
- ✅ Đây là pattern "redefine table" an toàn

### Lưu ý quan trọng

1. **KHÔNG** chạy `prisma migrate reset` trên production
2. **KHÔNG** chạy migrations có DROP TABLE mà không có INSERT INTO trước đó
3. **LUÔN** backup trước khi deploy
4. **KIỂM TRA** migrations mới trước khi commit

### Vercel Deployment

Vercel build command chỉ chạy `prisma generate`, **KHÔNG** chạy migrations tự động:

```json
{
  "buildCommand": "prisma generate && next build"
}
```

Migrations phải được chạy thủ công qua deploy scripts hoặc Vercel CLI.

### Emergency Recovery

Nếu vô tình mất dữ liệu:

1. **DỪNG NGAY** deploy process
2. **KHÔI PHỤC** từ backup
3. **KIỂM TRA** logs để xác định nguyên nhân
4. **SỬA** migrations nếu cần
5. **TEST** trên staging trước khi deploy lại

### Checklist trước khi deploy

- [ ] Đã backup database
- [ ] Đã kiểm tra migrations có DROP TABLE
- [ ] Đã test migrations trên staging/local
- [ ] Đã xác nhận với team về thay đổi database
- [ ] Đã có plan recovery nếu có vấn đề
