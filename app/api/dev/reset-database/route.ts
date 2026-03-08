import { NextRequest, NextResponse } from 'next/server';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/dev/reset-database
 * 
 * Reset database trên production bằng cách:
 * 1. Xóa file DB cũ trong /tmp
 * 2. Disconnect Prisma client
 * 3. Tạo DB trống mới (sẽ được tạo tự động khi Prisma reconnect)
 * 
 * ⚠️ CHỈ HOẠT ĐỘNG TRONG PRODUCTION
 * ⚠️ XÓA TẤT CẢ DỮ LIỆU - SỬ DỤNG CẨN THẬN
 */
export async function POST(request: NextRequest) {
  // 🛡️ BLOCK in production — chỉ cho phép trong development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Not Found' },
      { status: 404 }
    );
  }

  try {
    // Disconnect Prisma client trước khi xóa DB
    await prisma.$disconnect();

    // Xóa file DB trong /tmp
    const tmpDbPath = join('/tmp', 'zfemanage.db');
    let deleted = false;

    if (existsSync(tmpDbPath)) {
      try {
        unlinkSync(tmpDbPath);
        deleted = true;
      } catch (error: any) {
        return NextResponse.json(
          {
            success: false,
            error: 'Không thể xóa database file',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          },
          { status: 500 }
        );
      }
    }

    // DB mới sẽ được tạo tự động khi Prisma reconnect và chạy queries
    // Schema sẽ được tạo tự động thông qua các API routes có logic ensureTaskSchema()

    return NextResponse.json({
      success: true,
      message: 'Database đã được reset thành công',
      deleted,
      note: 'Database mới sẽ được tạo tự động khi có request tiếp theo. Schema sẽ được init tự động.',
    });
  } catch (error: any) {
    console.error('Failed to reset database:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Không thể reset database',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
