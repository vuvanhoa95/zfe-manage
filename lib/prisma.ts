import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import { join } from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnectionTested?: boolean;
};

function createPrismaClient() {
  // Check DATABASE_URL before creating client
  if (!process.env.DATABASE_URL) {
    const error = new Error('DATABASE_URL environment variable is not set');
    (error as any).code = 'DATABASE_URL_MISSING';
    // Log warning but still create client - error will be thrown when connecting
    if (process.env.NODE_ENV === 'development') {
      console.error('⚠️ DATABASE_URL is not set');
    }
  }

  const databaseUrl = process.env.DATABASE_URL || '';

  // For SQLite, check if database file exists (only on server-side)
  if (databaseUrl && databaseUrl.startsWith('file:')) {
    try {
      const dbPath = databaseUrl.replace('file:', '').trim();
      const absolutePath = dbPath.startsWith('/') || dbPath.match(/^[A-Z]:/i) 
        ? dbPath 
        : join(process.cwd(), dbPath);
      
      if (!existsSync(absolutePath)) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`⚠️ Database file not found: ${absolutePath}`);
        }
        // Don't throw immediately - let Prisma handle it when connecting
        // The error will be caught when actually using the client
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
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Optimize for serverless
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
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
