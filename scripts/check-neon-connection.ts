#!/usr/bin/env tsx
/**
 * Script để kiểm tra kết nối Neon database và đưa ra hướng dẫn nếu không khả dụng
 * Chạy: npx tsx scripts/check-neon-connection.ts
 */

import { checkDatabaseHealth, getDatabaseErrorMessage } from '../lib/db-health';

async function checkNeonConnection() {
  console.log('🔍 Đang kiểm tra kết nối Neon database...\n');

  const healthStatus = await checkDatabaseHealth();

  if (healthStatus.healthy) {
    console.log('✅ Neon database kết nối thành công!');
    console.log(`   Latency: ${healthStatus.latency}ms`);
    console.log(`   Retry count: ${healthStatus.retryCount || 0}\n`);
    return true;
  } else {
    console.error('❌ Neon database không khả dụng!\n');
    console.error(`   Error: ${healthStatus.error}`);
    console.error(`   Error Code: ${healthStatus.errorCode || 'UNKNOWN'}`);
    console.error(`   Retry count: ${healthStatus.retryCount || 0}\n`);

    const userMessage = getDatabaseErrorMessage(
      healthStatus.errorCode,
      healthStatus.error
    );
    console.log('📋 Thông báo cho người dùng:');
    console.log(`   ${userMessage}\n`);

    console.log('🔧 Các bước khắc phục:\n');

    // Kiểm tra loại lỗi và đưa ra hướng dẫn phù hợp
    if (healthStatus.errorCode === 'P1001') {
      console.log('   1. Kiểm tra kết nối mạng của bạn');
      console.log('   2. Kiểm tra firewall có chặn kết nối không');
      console.log('   3. Thử ping đến Neon host trong DATABASE_URL');
      console.log('   4. Kiểm tra Neon dashboard xem database có đang hoạt động không');
    } else if (healthStatus.errorCode === 'P1002') {
      console.log('   1. Database server có thể đang quá tải');
      console.log('   2. Thử lại sau vài phút');
      console.log('   3. Kiểm tra Neon dashboard để xem có vấn đề gì không');
    } else if (healthStatus.errorCode === 'P1003') {
      console.log('   1. Database có thể đã bị xóa hoặc không tồn tại');
      console.log('   2. Kiểm tra DATABASE_URL trong .env.local có đúng không');
      console.log('   3. Tạo database mới trên Neon dashboard nếu cần');
    } else if (healthStatus.errorCode === 'ENOTFOUND') {
      console.log('   1. Không tìm thấy database host');
      console.log('   2. Kiểm tra DATABASE_URL trong .env.local');
      console.log('   3. Kiểm tra DNS/network connection');
    } else {
      console.log('   1. Kiểm tra DATABASE_URL trong .env.local');
      console.log('   2. Kiểm tra Neon dashboard');
      console.log('   3. Thử chạy: npx tsx scripts/test-database-connection.ts');
    }

    console.log('\n💡 Tùy chọn thay thế:');
    console.log('   Nếu Neon database không khả dụng, bạn có thể:');
    console.log('   1. Sử dụng SQLite local cho development:');
    console.log('      - Tạo file .env.local với: DATABASE_URL="file:./prisma/prisma/dev.db"');
    console.log('      - Chạy: npx prisma migrate dev');
    console.log('   2. Liên hệ quản trị viên để kiểm tra Neon database\n');

    return false;
  }
}

// Main
checkNeonConnection()
  .then((isHealthy) => {
    process.exit(isHealthy ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
