import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

/**
 * Tạo các bảng cơ bản nếu chưa tồn tại (users, customers, projects, quotations, cashFlows)
 * Được gọi tự động khi detect lỗi "table does not exist"
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
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

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
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
            "startDate" DATETIME,
            "endDate" DATETIME,
            "totalArea" REAL,
            "totalBudget" REAL NOT NULL DEFAULT 0,
            "totalRevenue" REAL NOT NULL DEFAULT 0,
            "totalCost" REAL NOT NULL DEFAULT 0,
            "totalProfit" REAL NOT NULL DEFAULT 0,
            "status" TEXT NOT NULL DEFAULT 'PLANNING',
            "notes" TEXT,
            "imageUrl" TEXT,
            "createdById" TEXT NOT NULL,
            "finalQuotationId" TEXT UNIQUE,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
            "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "location" TEXT NOT NULL DEFAULT 'Hà Nội',
            "customerId" TEXT,
            "projectName" TEXT NOT NULL,
            "projectItem" TEXT,
            "projectNotes" TEXT,
            "totalArea" REAL,
            "title" TEXT,
            "introText" TEXT,
            "scopeText" TEXT,
            "deliverablesText" TEXT NOT NULL DEFAULT '',
            "scheduleText" TEXT,
            "vatRate" REAL NOT NULL DEFAULT 0,
            "outsourceCost" REAL NOT NULL DEFAULT 0,
            "outsourceStaff" TEXT,
            "outsourceDiscipline" TEXT,
            "outsourceRate" REAL,
            "outsourceNote" TEXT,
            "taxRate" REAL NOT NULL DEFAULT 0,
            "taxCost" REAL NOT NULL DEFAULT 0,
            "commissionType" TEXT,
            "commissionRate" REAL,
            "commissionCost" REAL NOT NULL DEFAULT 0,
            "totalBeforeVat" REAL NOT NULL DEFAULT 0,
            "vatAmount" REAL NOT NULL DEFAULT 0,
            "totalAfterVat" REAL NOT NULL DEFAULT 0,
            "totalInWords" TEXT,
            "status" TEXT NOT NULL DEFAULT 'DRAFT',
            "notes" TEXT,
            "theme" TEXT,
            "templateId" TEXT,
            "createdById" TEXT NOT NULL,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "quotations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE,
            CONSTRAINT "quotations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
            CONSTRAINT "quotations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE
        )
    `);

    // 5. Tạo bảng cashFlows (phụ thuộc projects)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "cashFlows" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "projectId" TEXT,
            "type" TEXT NOT NULL,
            "amount" REAL NOT NULL DEFAULT 0,
            "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "description" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "cashFlows_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
    `);

    // Tạo index cơ bản
    try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "projects_projectNo_idx" ON "projects"("projectNo")`);
    } catch {}
    try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "projects_createdById_idx" ON "projects"("createdById")`);
    } catch {}
    try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "projects_customerId_idx" ON "projects"("customerId")`);
    } catch {}
    try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects"("status")`);
    } catch {}
    try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "quotations_quotationNo_idx" ON "quotations"("quotationNo")`);
    } catch {}
    try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "quotations_status_idx" ON "quotations"("status")`);
    } catch {}
    try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "cashFlows_type_idx" ON "cashFlows"("type")`);
    } catch {}
    try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "cashFlows_date_idx" ON "cashFlows"("date")`);
    } catch {}
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
