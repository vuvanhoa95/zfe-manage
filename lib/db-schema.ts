import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

/**
 * Tạo các bảng cơ bản nếu chưa tồn tại (PostgreSQL)
 * - users, customers, projects
 * - quotations, cash_flows
 * - outsourcing_staff, tasks
 * 
 * Được gọi tự động khi detect lỗi "table does not exist"
 * 
 * ⚠️ AN TOÀN: Chỉ dùng CREATE TABLE IF NOT EXISTS - KHÔNG xóa hoặc thay đổi dữ liệu hiện có
 * ⚠️ LƯU Ý: Đây chỉ là safety net, schema CHÍNH thức được tạo bởi `prisma migrate deploy`
 */
export async function ensureCoreSchema() {
    // 1. Tạo bảng users (cần thiết cho createdById)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "users" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "email" TEXT NOT NULL UNIQUE,
            "password" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "role" TEXT NOT NULL DEFAULT 'USER',
            "title" TEXT,
            "department" TEXT,
            "experience" TEXT,
            "bankAccount" TEXT,
            "taxCode" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Thêm các cột mới vào bảng users nếu chưa có (migration cho database cũ)
    try { await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "title" TEXT`); } catch {}
    try { await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department" TEXT`); } catch {}
    try { await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "experience" TEXT`); } catch {}
    try { await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bankAccount" TEXT`); } catch {}
    try { await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "taxCode" TEXT`); } catch {}

    // 2. Tạo bảng customers (nếu chưa có)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "customers" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "taxCode" TEXT,
            "address" TEXT,
            "location" TEXT,
            "contactName" TEXT,
            "email" TEXT,
            "phone" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 3. Tạo bảng projects (phụ thuộc users và customers)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "projects" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "projectNo" TEXT NOT NULL UNIQUE,
            "name" TEXT NOT NULL,
            "code" TEXT,
            "description" TEXT,
            "customerId" TEXT,
            "location" TEXT NOT NULL DEFAULT 'Hà Nội',
            "startDate" TIMESTAMP(3),
            "endDate" TIMESTAMP(3),
            "totalArea" DOUBLE PRECISION,
            "totalBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "totalProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "status" TEXT NOT NULL DEFAULT 'PLANNING',
            "notes" TEXT,
            "imageUrl" TEXT,
            "createdById" TEXT NOT NULL,
            "finalQuotationId" TEXT UNIQUE,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE,
            CONSTRAINT "projects_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE CASCADE
        )
    `);

    // 4. Tạo bảng quotations (phụ thuộc projects, customers, users)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "quotations" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "quotationNo" TEXT NOT NULL UNIQUE,
            "projectId" TEXT,
            "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "location" TEXT NOT NULL DEFAULT 'Hà Nội',
            "customerId" TEXT,
            "projectName" TEXT NOT NULL,
            "projectItem" TEXT,
            "projectNotes" TEXT,
            "totalArea" DOUBLE PRECISION,
            "title" TEXT,
            "introText" TEXT,
            "scopeText" TEXT,
            "deliverablesText" TEXT NOT NULL DEFAULT '',
            "scheduleText" TEXT,
            "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "outsourceCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "outsourceStaff" TEXT,
            "outsourceDiscipline" TEXT,
            "outsourceRate" DOUBLE PRECISION,
            "outsourceNote" TEXT,
            "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "taxCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "commissionType" TEXT,
            "commissionRate" DOUBLE PRECISION,
            "commissionCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "totalBeforeVat" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "totalAfterVat" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "totalInWords" TEXT,
            "status" TEXT NOT NULL DEFAULT 'DRAFT',
            "notes" TEXT,
            "theme" TEXT,
            "templateId" TEXT,
            "createdById" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "quotations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE,
            CONSTRAINT "quotations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
            CONSTRAINT "quotations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE
        )
    `);

    // 5. Tạo bảng cash_flows (phụ thuộc projects, outsourcing_staff)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "cash_flows" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "projectId" TEXT,
            "type" TEXT NOT NULL,
            "category" TEXT,
            "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "description" TEXT NOT NULL,
            "date" TIMESTAMP(3) NOT NULL,
            "quotationId" TEXT,
            "paymentMilestoneNo" INTEGER,
            "paymentMilestonePercent" DOUBLE PRECISION,
            "paymentMilestoneTitle" TEXT,
            "outsourcingStaffId" TEXT,
            "counterpartyName" TEXT,
            "notes" TEXT,
            "documentStatus" TEXT,
            "documentNote" TEXT,
            "createdById" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "cash_flows_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
    `);

    // 6. Tạo bảng tasks (phụ thuộc projects và users)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "tasks" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "projectId" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "description" TEXT,
            "startDate" TIMESTAMP(3),
            "endDate" TIMESTAMP(3),
            "dueDate" TIMESTAMP(3),
            "status" TEXT NOT NULL DEFAULT 'TODO',
            "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
            "progress" INTEGER NOT NULL DEFAULT 0,
            "assignedToId" TEXT,
            "parentId" TEXT,
            "phase" TEXT,
            "discipline" TEXT,
            "location" TEXT,
            "order" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
            CONSTRAINT "tasks_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
    `);

    // 7. Tạo bảng outsourcing_staff (dùng cho quản lý nhân sự outsource)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "outsourcing_staff" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "code" TEXT,
            "position" TEXT,
            "department" TEXT,
            "discipline" TEXT,
            "avatarUrl" TEXT,
            "email" TEXT,
            "phone" TEXT,
            "address" TEXT,
            "companyName" TEXT,
            "companyTaxCode" TEXT,
            "personalTaxCode" TEXT,
            "bankAccount" TEXT,
            "bankName" TEXT,
            "skills" TEXT,
            "experience" TEXT,
            "certifications" TEXT,
            "hourlyRate" DOUBLE PRECISION,
            "dailyRate" DOUBLE PRECISION,
            "monthlyRate" DOUBLE PRECISION,
            "rateType" TEXT,
            "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
            "notes" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tạo index cơ bản
    const indexes = [
        `CREATE INDEX IF NOT EXISTS "projects_projectNo_idx" ON "projects"("projectNo")`,
        `CREATE INDEX IF NOT EXISTS "projects_createdById_idx" ON "projects"("createdById")`,
        `CREATE INDEX IF NOT EXISTS "projects_customerId_idx" ON "projects"("customerId")`,
        `CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects"("status")`,
        `CREATE INDEX IF NOT EXISTS "quotations_quotationNo_idx" ON "quotations"("quotationNo")`,
        `CREATE INDEX IF NOT EXISTS "quotations_status_idx" ON "quotations"("status")`,
        `CREATE INDEX IF NOT EXISTS "cash_flows_type_idx" ON "cash_flows"("type")`,
        `CREATE INDEX IF NOT EXISTS "cash_flows_date_idx" ON "cash_flows"("date")`,
        `CREATE INDEX IF NOT EXISTS "outsourcing_staff_isActive_idx" ON "outsourcing_staff"("isActive")`,
        `CREATE INDEX IF NOT EXISTS "outsourcing_staff_code_idx" ON "outsourcing_staff"("code")`,
        `CREATE INDEX IF NOT EXISTS "tasks_projectId_idx" ON "tasks"("projectId")`,
        `CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks"("status")`,
        `CREATE INDEX IF NOT EXISTS "tasks_assignedToId_idx" ON "tasks"("assignedToId")`,
        `CREATE INDEX IF NOT EXISTS "tasks_parentId_idx" ON "tasks"("parentId")`,
        `CREATE INDEX IF NOT EXISTS "tasks_phase_idx" ON "tasks"("phase")`,
        `CREATE INDEX IF NOT EXISTS "tasks_dueDate_idx" ON "tasks"("dueDate")`,
    ];

    for (const sql of indexes) {
        try { await prisma.$executeRawUnsafe(sql); } catch {}
    }
}

/**
 * Kiểm tra xem lỗi có phải là "table does not exist" không
 */
export function isMissingTableError(error: unknown): boolean {
    if (!error) return false;
    const message: string = error instanceof Error ? error.message : String(error);
    return (
        (error instanceof Prisma.PrismaClientKnownRequestError &&
            (error.code === 'P2021' || error.code === 'P2022')) ||
        /does not exist in the current database/i.test(message) ||
        /relation .+ does not exist/i.test(message) ||
        /no such table/i.test(message)
    );
}

/**
 * Wrap một Prisma query với auto-schema creation nếu table không tồn tại
 */
export async function withSchemaCheck<T>(
    queryFn: () => Promise<T>,
    fallbackValue?: T
): Promise<T> {
    try {
        return await queryFn();
    } catch (error: unknown) {
        if (isMissingTableError(error)) {
            // Tự động tạo schema và retry
            await ensureCoreSchema();
            try {
                return await queryFn();
            } catch (retryError) {
                // Nếu vẫn lỗi sau khi đã ensure schema, trả về fallback hoặc throw
                if (fallbackValue !== undefined) {
                    return fallbackValue;
                }
                throw retryError;
            }
        }
        throw error;
    }
}
