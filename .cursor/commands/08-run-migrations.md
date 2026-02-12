# Run Database Migrations

Chạy migrations để apply schema changes vào database.

## Mô tả
Tạo và apply database migrations từ schema changes.

## Commands

### Development (tạo migration mới)
```bash
npx prisma migrate dev --name migration_name
```

### Production (chỉ apply migrations có sẵn)
```bash
npx prisma migrate deploy
```

## Lưu ý
- `migrate dev`: Tạo migration mới và apply ngay (development)
- `migrate deploy`: Chỉ apply migrations có sẵn (production)
- Luôn backup database trước khi chạy migrations trong production
- Migration name nên mô tả rõ thay đổi (VD: `add_project_coordinates`)
