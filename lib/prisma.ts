import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Use connection pooling for serverless (Vercel)
  // Neon provides pooled connections via ?pgbouncer=true or separate pooled connection string
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Optimize for serverless
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
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
