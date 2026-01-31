/**
 * Database Health Check API Endpoint
 * GET /api/health/database
 * Kiểm tra trạng thái kết nối database
 */

import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db-health';

export async function GET() {
  try {
    const healthStatus = await checkDatabaseHealth();

    if (healthStatus.healthy) {
      return NextResponse.json(
        {
          success: true,
          healthy: true,
          latency: healthStatus.latency,
          retryCount: healthStatus.retryCount,
          message: 'Database connection is healthy',
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          healthy: false,
          error: healthStatus.error,
          errorCode: healthStatus.errorCode,
          retryCount: healthStatus.retryCount,
          message: 'Database connection failed',
        },
        { status: 503 } // Service Unavailable
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        healthy: false,
        error: error?.message || 'Unknown error',
        message: 'Failed to check database health',
      },
      { status: 500 }
    );
  }
}
