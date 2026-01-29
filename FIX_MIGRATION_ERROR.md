# 🔧 Xử Lý Migration Failed

## ❌ Vấn đề

Migration `20260128084327_init` đã fail vì:
- Migrations cũ dùng **SQLite syntax** (`AUTOINCREMENT`)
- Database hiện tại là **PostgreSQL**
- Prisma không cho phép chạy migrations mới khi có migration failed

## ✅ Giải pháp

### Cách 1: Xóa Migration Failed trên Neon Dashboard (Khuyến nghị)

1. **Vào Neon Dashboard**: https://console.neon.tech
2. **Chọn project**: ZfeData
3. **Vào SQL Editor**
4. **Chạy SQL sau để xóa migration failed**:

```sql
DELETE FROM _prisma_migrations WHERE migration_name = '20260128084327_init';
```

5. **Sau đó chạy lệnh sau trong terminal** (ở thư mục `quotation-app`):

```powershell
# Dùng db push để tạo tables trực tiếp (không cần migrations)
npx prisma db push --accept-data-loss
```

### Cách 2: Dùng Prisma Migrate Resolve (nếu kết nối được)

```powershell
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back 20260128084327_init

# Sau đó tạo migrations mới
npx prisma migrate dev --name init_postgresql
```

---

## 🚀 Sau khi xử lý xong

1. **Seed database**:
```powershell
npx prisma db seed
```

2. **Verify trên Neon Dashboard**:
- Vào **Tables** → kiểm tra các tables đã được tạo
- Vào **SQL Editor** → chạy:
```sql
SELECT email, name, role FROM users;
```

3. **Redeploy trên Vercel**

4. **Test đăng nhập**: https://zfe-manage.vercel.app/login

---

## 📝 Lưu ý

- `prisma db push` sẽ tạo tables trực tiếp từ schema, không cần migrations
- Phù hợp cho development, nhưng production nên dùng migrations
- Sau khi push xong, có thể tạo migrations mới từ schema hiện tại
