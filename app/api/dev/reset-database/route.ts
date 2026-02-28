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
  // Chỉ cho phép reset trong production (hoặc development nếu có flag đặc biệt)
  if (process.env.NODE_ENV !== 'production' && !request.headers.get('x-force-reset')) {
    return NextResponse.json(
      {
        success: false,
        error: 'Reset database chỉ được phép trong production',
        hint: 'Nếu muốn reset trong development, thêm header: x-force-reset: true',
      },
      { status: 403 }
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
