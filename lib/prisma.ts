import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnectionTested?: boolean;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? '';

  // Validate DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
  } else if (
    !databaseUrl.startsWith('postgresql://') &&
    !databaseUrl.startsWith('postgres://') &&
    !databaseUrl.startsWith('prisma://') &&
    !databaseUrl.startsWith('prisma+postgres://')
  ) {
    console.error(
      `❌ DATABASE_URL phải bắt đầu bằng postgresql:// hoặc postgres://\n` +
      `   Format hiện tại: ${databaseUrl.substring(0, 30)}...`
    );
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  return client;
}

// Singleton pattern for Prisma Client
// In serverless (Vercel), we need to reuse the connection across requests
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Test connection on startup (only once, in development)
if (
  process.env.NODE_ENV === 'development' &&
  !globalForPrisma.prismaConnectionTested
) {
  globalForPrisma.prismaConnectionTested = true;

  import('./db-health')
    .then(({ testDatabaseConnection }) => {
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
