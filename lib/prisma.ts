import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import { join } from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Check DATABASE_URL before creating client
  if (!process.env.DATABASE_URL) {
    const error = new Error('DATABASE_URL environment variable is not set');
    (error as any).code = 'DATABASE_URL_MISSING';
    throw error;
  }

  // For SQLite, check if database file exists (only on server-side)
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl.startsWith('file:') && typeof window === 'undefined') {
    try {
      const dbPath = databaseUrl.replace('file:', '').trim();
      const absolutePath = dbPath.startsWith('/') || dbPath.match(/^[A-Z]:/i) 
        ? dbPath 
        : join(process.cwd(), dbPath);
      
      if (!existsSync(absolutePath)) {
        const error = new Error(`Database file not found: ${absolutePath}`);
        (error as any).code = 'DATABASE_FILE_NOT_FOUND';
        (error as any).filePath = absolutePath;
        throw error;
      }
    } catch (error: any) {
      // If it's not a file system error, re-throw
      if (error.code === 'DATABASE_FILE_NOT_FOUND') {
        throw error;
      }
      // Otherwise, ignore file system errors (might be in browser environment)
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

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
