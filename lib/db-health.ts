/**
 * Database Health Check và Connection Retry Utilities
 * Xử lý trường hợp Neon database không khả dụng
 */

import { PrismaClient } from '@prisma/client';

export interface DatabaseHealthStatus {
  healthy: boolean;
  error?: string;
  errorCode?: string;
  retryCount?: number;
  latency?: number;
}

/**
 * Test database connection với retry mechanism
 * @param prisma Prisma client instance
 * @param maxRetries Số lần retry tối đa (default: 3)
 * @param retryDelay Delay giữa các lần retry (ms, default: 1000)
 * @returns Health status
 */
export async function testDatabaseConnection(
  prisma: PrismaClient,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<DatabaseHealthStatus> {
  let lastError: any = null;
  let retryCount = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const startTime = Date.now();
    
    try {
      // Test connection với timeout
      await Promise.race([
        prisma.$queryRaw`SELECT 1 as health_check`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]);

      const latency = Date.now() - startTime;

      return {
        healthy: true,
        retryCount: attempt,
        latency,
      };
    } catch (error: any) {
      lastError = error;
      retryCount = attempt;

      // Nếu không phải lần retry cuối, đợi rồi thử lại
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `⚠️ Database connection failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`
          );
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Tất cả retry đều fail
  const errorCode = lastError?.code || 'UNKNOWN';
  const errorMessage = lastError?.message || 'Unknown database error';

  return {
    healthy: false,
    error: errorMessage,
    errorCode,
    retryCount,
  };
}

/**
 * Check database health status
 * @returns Health status với thông tin chi tiết
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const { prisma } = await import('@/lib/prisma');
  
  try {
    const healthStatus = await testDatabaseConnection(prisma, 3, 1000);
    
    if (!healthStatus.healthy) {
      // Log chi tiết lỗi trong development
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Database health check failed:', {
          error: healthStatus.error,
          errorCode: healthStatus.errorCode,
          retryCount: healthStatus.retryCount,
        });
      }
    }
    
    return healthStatus;
  } catch (error: any) {
    return {
      healthy: false,
      error: error?.message || 'Failed to check database health',
      errorCode: error?.code || 'HEALTH_CHECK_ERROR',
    };
  }
}

/**
 * Get user-friendly error message từ error code
 */
export function getDatabaseErrorMessage(errorCode?: string, errorMessage?: string): string {
  if (!errorCode && !errorMessage) {
    return 'Lỗi kết nối database. Vui lòng liên hệ quản trị viên để kiểm tra cấu hình server.';
  }

  // Prisma error codes
  switch (errorCode) {
    case 'P1001':
      return 'Không thể kết nối đến database server. Vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên.';
    
    case 'P1002':
      return 'Database server không phản hồi. Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
    
    case 'P1003':
      return 'Database không tồn tại. Vui lòng liên hệ quản trị viên để kiểm tra cấu hình.';
    
    case 'P1017':
      return 'Kết nối database bị đóng. Vui lòng thử lại sau.';
    
    case 'P1012':
      return 'Schema database không khớp. Vui lòng liên hệ quản trị viên.';
    
    case 'DATABASE_URL_MISSING':
      return 'Cấu hình database chưa được thiết lập. Vui lòng liên hệ quản trị viên.';
    
    case 'DATABASE_FILE_NOT_FOUND':
      return 'File database không tồn tại. Vui lòng liên hệ quản trị viên.';
  }

  // Network errors
  if (errorMessage?.includes('ECONNREFUSED')) {
    return 'Database server từ chối kết nối. Vui lòng liên hệ quản trị viên.';
  }

  if (errorMessage?.includes('ENOTFOUND')) {
    return 'Không tìm thấy database server. Vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên.';
  }

  if (errorMessage?.includes('timeout')) {
    return 'Kết nối database quá thời gian chờ. Vui lòng thử lại sau.';
  }

  // Default message
  return 'Lỗi kết nối database. Vui lòng liên hệ quản trị viên để kiểm tra cấu hình server.';
}
