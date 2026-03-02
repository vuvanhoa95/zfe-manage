import { prisma } from '@/lib/prisma';

/**
 * Tự tạo schema custom fields nếu DB chưa migrate (safety net).
 * Mục tiêu: UI có thể dùng ngay mà không cần chạy migrate thủ công.
 *
 * PostgreSQL only (enum + DO $$).
 */
export async function ensureCustomFieldsSchema() {
    // ===== PostgreSQL: dùng ENUM + DO $$ =====
    await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
            CREATE TYPE "CustomFieldEntityType" AS ENUM ('PROJECT', 'TASK');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    `);

    await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
            CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT', 'BOOLEAN');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    `);

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "custom_fields" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "key" TEXT NOT NULL,
            "description" TEXT,
            "entityType" "CustomFieldEntityType" NOT NULL,
            "fieldType" "CustomFieldType" NOT NULL,
            "group" TEXT,
            "sortOrder" INTEGER NOT NULL DEFAULT 0,
            "isRequired" BOOLEAN NOT NULL DEFAULT false,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
            ALTER TABLE "custom_fields"
            ADD CONSTRAINT "custom_fields_key_key" UNIQUE ("key");
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    `);

    await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "custom_fields_entityType_idx" ON "custom_fields"("entityType")`,
    );
    await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "custom_fields_isActive_idx" ON "custom_fields"("isActive")`,
    );

    // Bảng options
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "custom_field_options" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "customFieldId" TEXT NOT NULL,
            "label" TEXT NOT NULL,
            "value" TEXT,
            "color" TEXT,
            "sortOrder" INTEGER NOT NULL DEFAULT 0,
            CONSTRAINT "custom_field_options_customFieldId_fkey"
                FOREIGN KEY ("customFieldId") REFERENCES "custom_fields"("id")
                ON DELETE CASCADE ON UPDATE CASCADE
        );
    `);

    await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "custom_field_options_customFieldId_idx" ON "custom_field_options"("customFieldId")`,
    );

    // Bảng values
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "custom_field_values" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "customFieldId" TEXT NOT NULL,
            "entityType" TEXT NOT NULL,
            "entityId" TEXT NOT NULL,
            "stringValue" TEXT,
            "numberValue" DOUBLE PRECISION,
            "dateValue" TIMESTAMP(3),
            "boolValue" BOOLEAN,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "custom_field_values_customFieldId_fkey"
                FOREIGN KEY ("customFieldId") REFERENCES "custom_fields"("id")
                ON DELETE CASCADE ON UPDATE CASCADE
        );
    `);

    await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
            ALTER TABLE "custom_field_values"
            ADD CONSTRAINT "custom_field_values_unique_entity_field" UNIQUE ("customFieldId", "entityType", "entityId");
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    `);

    await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "custom_field_values_customFieldId_idx" ON "custom_field_values"("customFieldId")`,
    );
    await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "custom_field_values_entity_idx" ON "custom_field_values"("entityType", "entityId")`,
    );
}
