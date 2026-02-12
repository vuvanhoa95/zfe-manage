# Generate Prisma Client

Generate Prisma Client sau khi thay đổi schema.

## Mô tả
Sau khi update `prisma/schema.prisma`, cần generate Prisma Client để sử dụng trong code.

## Command

```bash
npx prisma generate
```

## Khi nào cần chạy
- Sau khi thay đổi `prisma/schema.prisma`
- Sau khi pull code mới có thay đổi schema
- Khi Prisma Client bị lỗi hoặc outdated

## Lưu ý
- Command này chỉ generate client, không chạy migrations
- Để apply schema changes, cần chạy `npx prisma migrate dev`
