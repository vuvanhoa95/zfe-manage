import { PrismaClient } from '@prisma/client';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnectionTested?: boolean;
};

function parseSqliteFilePath(databaseUrl: string): string | null {
  if (!databaseUrl.startsWith('file:')) return null;
  const dbPath = databaseUrl.replace('file:', '').trim();
  if (!dbPath) return null;
  // Absolute Windows: C:\..., Absolute *nix: /...
  const isAbsolute =
    dbPath.startsWith('/') || /^[A-Z]:\\/i.test(dbPath) || /^[A-Z]:\//i.test(dbPath);
  return isAbsolute ? dbPath : join(process.cwd(), dbPath);
}

function ensureProductionSqliteDbReady(): string | null {
  // ⚠️ CẢNH BÁO: SQLite trên Vercel KHÔNG THỂ PERSIST!
  // Vercel là serverless platform - mỗi lần deploy/restart, /tmp sẽ bị reset.
  // SQLite file-based database sẽ MẤT DỮ LIỆU mỗi lần deploy!
  // 
  // GIẢI PHÁP: Phải chuyển sang PostgreSQL (Neon hoặc Vercel Postgres) cho production.
  // 
  // Mục tiêu: tránh 500 trên Vercel khi DATABASE_URL bị set sai format (không có `file:`)
  // và tránh lỗi read-only khi trỏ vào file nằm trong bundle.
  if (process.env.NODE_ENV !== 'production') return null;

  // ⚠️ NGHIÊM CẤM: KHÔNG BAO GIỜ XÓA DATABASE TRONG PRODUCTION!
  // Code cũ đã xóa database mỗi lần start - ĐÂY LÀ LỖI NGHIÊM TRỌNG!
  // 
  // Luôn dùng /tmp cho SQLite trên serverless vì writable, NHƯNG:
  // - /tmp là ephemeral storage - sẽ mất khi function restart
  // - SQLite KHÔNG phù hợp cho production trên serverless
  // - PHẢI chuyển sang PostgreSQL (Neon/Vercel Postgres)
  const tmpDir = '/tmp';
  const tmpDbPath = join(tmpDir, 'zfemanage.db');
  const tmpUrl = `file:${tmpDbPath}`;

  // ⚠️ CHỈ tạo database nếu chưa tồn tại - KHÔNG BAO GIỜ XÓA!
  try {
    mkdirSync(tmpDir, { recursive: true });
    // ⚠️ NGHIÊM CẤM: KHÔNG XÓA DATABASE ĐÃ TỒN TẠI!
    // Code cũ: unlinkSync(tmpDbPath) - ĐÃ BỊ XÓA vì nguy hiểm!
    // 
    // Nếu database chưa tồn tại, Prisma sẽ tự tạo khi chạy migrations/queries
    // KHÔNG cần tạo file trống trước
    if (!existsSync(tmpDbPath)) {
      // Database chưa tồn tại - Prisma sẽ tự tạo khi cần
      // KHÔNG tạo file trống vì Prisma sẽ tự xử lý
    }
  } catch (error) {
    // Không throw để tránh crash cold start; Prisma sẽ throw rõ hơn khi query nếu vẫn fail.
    // Intentionally silent in production to avoid noisy logs on serverless cold starts.
  }

  // ⚠️ CẢNH BÁO: SQLite trên Vercel sẽ MẤT DỮ LIỆU mỗi lần deploy!
  // Phải chuyển sang PostgreSQL ngay!
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ CẢNH BÁO: Đang dùng SQLite trên Vercel - dữ liệu sẽ MẤT mỗi lần deploy!');
    console.warn('⚠️ PHẢI chuyển sang PostgreSQL (Neon/Vercel Postgres) ngay!');
  }

  // Trả về URL SQLite đã chuẩn hoá để PrismaClient dùng trực tiếp (không phụ thuộc env runtime)
  return tmpUrl;
}

function createPrismaClient() {
  const forcedDatasourceUrl = ensureProductionSqliteDbReady();

  // Check DATABASE_URL before creating client
  if (!forcedDatasourceUrl && !process.env.DATABASE_URL) {
    const error = new Error('DATABASE_URL environment variable is not set');
    (error as any).code = 'DATABASE_URL_MISSING';
    // Log warning but still create client - error will be thrown when connecting
    if (process.env.NODE_ENV === 'development') {
      console.error('⚠️ DATABASE_URL is not set');
    }
  }

  const databaseUrl = forcedDatasourceUrl ?? process.env.DATABASE_URL ?? '';

  // Validate DATABASE_URL format cho PostgreSQL
  if (databaseUrl && !databaseUrl.startsWith('file:')) {
    // Nếu không phải SQLite, phải là postgresql:// hoặc postgres://
    if (
      !databaseUrl.startsWith('postgresql://') &&
      !databaseUrl.startsWith('postgres://') &&
      !databaseUrl.startsWith('prisma://') &&
      !databaseUrl.startsWith('prisma+postgres://')
    ) {
      const errorMsg = `DATABASE_URL không đúng format. Nếu schema dùng provider="postgresql" thì DATABASE_URL phải bắt đầu bằng:
- postgresql:// (cho PostgreSQL thông thường)
- postgres:// (alias của postgresql://)
- prisma:// (cho Prisma Accelerate)
- prisma+postgres:// (cho Prisma Data Proxy)

Format hiện tại: ${databaseUrl.substring(0, 20)}... (đã ẩn phần sau)

Vui lòng kiểm tra file .env hoặc .env.local và sửa DATABASE_URL.`;
      
      if (process.env.NODE_ENV === 'development') {
        console.error('❌', errorMsg);
      }
      // Vẫn tạo client để Prisma tự throw error với message rõ ràng hơn
    }
  }

  // For SQLite, check if database file exists (only on server-side)
  if (databaseUrl && databaseUrl.startsWith('file:')) {
    try {
      const absolutePath = parseSqliteFilePath(databaseUrl);
      if (!absolutePath) {
        // URL dạng file: nhưng không có path hợp lệ; để Prisma tự throw khi connect/query
        if (process.env.NODE_ENV === 'development') {
          console.error('⚠️ Invalid SQLite DATABASE_URL (missing path)');
        }
      } else {
        if (!existsSync(absolutePath)) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`⚠️ Database file not found: ${absolutePath}`);
          }
          // Don't throw immediately - let Prisma handle it when connecting
          // The error will be caught when actually using the client
        }
      }
      
    } catch (error: any) {
      // Log but don't throw - let Prisma handle connection errors
      if (process.env.NODE_ENV === 'development') {
        console.error('⚠️ Error checking database file:', error.message);
      }
    }
  }

  // Use connection pooling for serverless (Vercel)
  // Neon provides pooled connections via ?pgbouncer=true or separate pooled connection string
  // Không override datasources để Prisma tự đọc từ schema.prisma
  const client = new PrismaClient({
    // Override datasource URL explicitly để tránh case env bị set sai trên production
    // và đảm bảo Prisma luôn dùng URL đã chuẩn hoá.
    ...(databaseUrl
      ? {
          datasources: {
            db: { url: databaseUrl },
          },
        }
      : {}),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  // Verify model exists
  if (process.env.NODE_ENV === 'development') {
    if (!('outsourcingStaff' in client)) {
      console.error('❌ Prisma Client missing outsourcingStaff model!');
      const availableModels = Object.keys(client).filter(
        (k) => !k.startsWith('$') && !k.startsWith('_') && typeof (client as any)[k] === 'object'
      );
      console.error('Available models:', availableModels);
      console.error('⚠️ Please run: npx prisma generate');
    } else {
      console.log('✅ Prisma Client has outsourcingStaff model');
    }
  }

  return client;
}

// Singleton pattern for Prisma Client
// In serverless (Vercel), we need to reuse the connection
// Force recreate Prisma Client để đảm bảo dùng provider mới nhất từ schema
if (process.env.NODE_ENV === 'development') {
  // Trong development, không cache để force reload khi schema thay đổi
  // Clear cache để đảm bảo load Prisma Client mới nhất
  if (globalForPrisma.prisma) {
    try {
      // Disconnect client cũ trước khi tạo mới (async, không block)
      globalForPrisma.prisma.$disconnect().catch(() => {});
    } catch {}
  }
  globalForPrisma.prisma = undefined;
}
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  // Only cache if model exists
  if ('outsourcingStaff' in prisma) {
    globalForPrisma.prisma = prisma;
  } else {
    // Don't cache if model is missing - force recreate next time
    console.warn('⚠️ Not caching Prisma Client - model missing');
  }
}

// Test connection on startup (only once, in development)
// Dynamic import để tránh circular dependency
if (
  process.env.NODE_ENV === 'development' &&
  !globalForPrisma.prismaConnectionTested
) {
  globalForPrisma.prismaConnectionTested = true;
  
  // Dynamic import để tránh circular dependency
  import('./db-health')
    .then(({ testDatabaseConnection }) => {
      // Test connection asynchronously (don't block startup)
      return testDatabaseConnection(prisma, 2, 1000);
    })
    .then((healthStatus) => {
      if (healthStatus.healthy) {
        console.log(
          `✅ Database connection healthy (latency: ${healthStatus.latency}ms, retries: ${healthStatus.retryCount})`
        );
      } else {
        console.warn(
          `⚠️ Database connection test failed: ${healthStatus.error} (code: ${healthStatus.errorCode})`
        );
        console.warn('   This may cause issues when accessing the database.');
      }
    })
    .catch((error) => {
      // Ignore import errors in production builds
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Database connection test error:', error.message);
      }
    });
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
