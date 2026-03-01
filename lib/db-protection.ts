/**
 * Database Protection Utilities
 * 
 * ⚠️ QUAN TRỌNG: Các functions này đảm bảo KHÔNG BAO GIỜ xóa dữ liệu
 */

import { prisma } from './prisma';

/**
 * Kiểm tra xem có migrations nào có DROP TABLE không
 * @returns Array of migration file paths that contain DROP TABLE
 */
export async function checkMigrationsForDropTable(): Promise<string[]> {
    const fs = await import('fs');
    const path = await import('path');
    
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
        return [];
    }

    const dangerousMigrations: string[] = [];
    const migrationFiles = fs.readdirSync(migrationsDir, { recursive: true, withFileTypes: true });

    for (const file of migrationFiles) {
        if (file.isFile() && file.name.endsWith('.sql')) {
            const filePath = path.join(file.path || migrationsDir, file.name);
            const content = fs.readFileSync(filePath, 'utf-8');
            
            // Kiểm tra DROP TABLE (nhưng bỏ qua nếu có INSERT INTO trước đó - đó là safe migration)
            if (/DROP\s+TABLE/i.test(content)) {
                // Nếu có INSERT INTO trước DROP TABLE, đó là safe migration (redefine table)
                const hasInsertBeforeDrop = /INSERT\s+INTO.*?SELECT.*?FROM.*?DROP\s+TABLE/i.test(content);
                if (!hasInsertBeforeDrop) {
                    dangerousMigrations.push(filePath);
                }
            }
        }
    }

    return dangerousMigrations;
}

/**
 * Kiểm tra xem database có dữ liệu không
 * @returns true nếu có dữ liệu, false nếu không
 */
export async function hasDataInDatabase(): Promise<boolean> {
    try {
        // Kiểm tra các bảng chính
        const tables = ['users', 'projects', 'customers', 'quotations', 'tasks'];
        
        for (const table of tables) {
            try {
                const count = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
                    `SELECT COUNT(*) as count FROM "${table}"`
                );
                if (count[0]?.count > 0) {
                    return true;
                }
            } catch {
                // Table không tồn tại, bỏ qua
            }
        }
        
        return false;
    } catch {
        return false;
    }
}

/**
 * Đếm số lượng records trong các bảng chính
 */
export async function countDatabaseRecords(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    const tables = ['users', 'projects', 'customers', 'quotations', 'tasks', 'cash_flows'];
    
    for (const table of tables) {
        try {
            const result = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
                `SELECT COUNT(*) as count FROM "${table}"`
            );
            counts[table] = result[0]?.count || 0;
        } catch {
            counts[table] = 0;
        }
    }
    
    return counts;
}

/**
 * Kiểm tra an toàn trước khi chạy migrations
 * @returns { safe: boolean, warnings: string[], errors: string[] }
 */
export async function checkMigrationSafety(): Promise<{
    safe: boolean;
    warnings: string[];
    errors: string[];
}> {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // 1. Kiểm tra migrations có DROP TABLE không
    const dangerousMigrations = await checkMigrationsForDropTable();
    if (dangerousMigrations.length > 0) {
        warnings.push(
            `Phát hiện ${dangerousMigrations.length} migration(s) có DROP TABLE: ${dangerousMigrations.join(', ')}`
        );
    }
    
    // 2. Kiểm tra database có dữ liệu không
    const hasData = await hasDataInDatabase();
    if (hasData && dangerousMigrations.length > 0) {
        errors.push(
            '⚠️ NGUY HIỂM: Database có dữ liệu và có migrations với DROP TABLE. Có thể mất dữ liệu!'
        );
    }
    
    // 3. Đếm records
    const counts = await countDatabaseRecords();
    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    if (totalRecords > 0) {
        warnings.push(`Database hiện có ${totalRecords} records: ${JSON.stringify(counts)}`);
    }
    
    return {
        safe: errors.length === 0,
        warnings,
        errors,
    };
}
