# ZfeManage - Quản lý dự án Zfenix

**Đây là CODE CHÍNH để build và deploy app.**

Hệ thống quản lý báo giá và dự án chuyên nghiệp cho công ty BIM với tính năng export DOCX/PDF và version control.

> ⚠️ **Lưu ý**: Tất cả **RULES, DOCUMENTATION, và REQUIREMENTS** được lưu tại folder `../quotation-app/`.  
> Khi development, luôn tham khảo rules từ `quotation-app/.cursorrules` và các file docs trong đó.

## 🎯 Tính năng chính

### Quản lý Dự án
- Tạo và quản lý dự án
- Quản lý dòng tiền (Cash Flow)
- Quản lý hóa đơn và thanh toán
- Liên kết với báo giá

### Quản lý Báo giá
- Editor 2-tab (Data & Preview)
- Pricing Table nâng cao với Group Headers
- Payment Milestones
- Version Control
- Export DOCX/PDF

### Quản lý Khách hàng
- CRUD khách hàng
- Liên kết với dự án và báo giá

### Quản lý Nhân sự Outsource
- Quản lý nhân sự outsource
- Upload và quản lý hồ sơ

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM với SQLite
- **Authentication**: NextAuth.js
- **Validation**: Zod
- **Forms**: React Hook Form
- **Export**: docxtemplater (DOCX), Puppeteer (PDF)

## 📋 Yêu cầu

- Node.js 18+ 
- npm hoặc yarn

## 🚀 Cài đặt

1. **Clone repository và cài đặt dependencies:**
```bash
cd ZfeManage
npm install
```

2. **Setup database:**
```bash
# Generate Prisma Client
npx prisma generate

# Chạy migrations
npx prisma migrate dev

# Seed dữ liệu mẫu (tùy chọn)
npm run prisma:seed
```

3. **Chạy development server:**
```bash
npm run dev
```

4. **Mở trình duyệt:**
```
http://localhost:3000
```

## 📁 Cấu trúc thư mục

```
ZfeManage/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard routes
│   │   ├── projects/      # Quản lý dự án
│   │   ├── quotations/    # Quản lý báo giá
│   │   ├── customers/     # Quản lý khách hàng
│   │   └── ...
│   ├── api/               # API Routes
│   └── login/             # Trang đăng nhập
├── components/            # React Components
│   ├── project/           # Components cho Projects
│   ├── quotation/         # Components cho Quotations
│   ├── layout/            # Layout components
│   └── ui/                # UI components
├── lib/                   # Utilities & helpers
│   ├── prisma.ts          # Prisma client
│   ├── auth.ts            # NextAuth config
│   └── validation/        # Zod schemas
├── prisma/                # Database
│   ├── schema.prisma      # Prisma schema
│   └── migrations/        # Database migrations
├── public/                # Static files
└── types/                 # TypeScript types
```

## 🔧 Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run start` - Chạy production server
- `npm run lint` - Chạy ESLint
- `npm run prisma:seed` - Seed database

## 📝 Environment Variables

Tạo file `.env` trong thư mục root:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## 🗄️ Database

Database sử dụng SQLite (file `prisma/dev.db`). Để reset database:

```bash
npx prisma migrate reset
```

## 📚 Documentation & Rules

### ⚠️ QUAN TRỌNG: Rules Location

**Tất cả RULES và DOCUMENTATION được lưu tại folder `../quotation-app/`**

Khi development, **LUÔN** tham khảo:
- `../quotation-app/.cursorrules` - **Tất cả coding rules và conventions**
- `../quotation-app/ARCHITECTURE.md` - Kiến trúc hệ thống
- `../quotation-app/PROJECT_PLAN.md` - Kế hoạch phát triển
- `../quotation-app/DEV_TODO.md` - TODO list chi tiết
- `../quotation-app/README.md` - Tổng quan dự án
- `../quotation-app/QUICKSTART.md` - Hướng dẫn nhanh

Xem `DEVELOPMENT.md` trong folder này để biết thêm về workflow.

## 📄 License

Private - Zfenix Company

---

**Auto-deploy**: ✅ Đã được setup và test thành công!

**Test auto-deploy**: 2026-01-31 - Git integration hoàn tất