#!/usr/bin/env tsx
/**
 * Script để test kết nối database
 * Chạy: npx tsx scripts/test-database-connection.ts
 */

import { PrismaClient } from '@prisma/client';

async function testDatabaseConnection() {
  console.log('🔍 Đang kiểm tra kết nối database...\n');

  // Check DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL không được set trong environment variables');
    console.log('\n📋 Cách khắc phục:');
    console.log('   1. Tạo file .env.local trong thư mục gốc');
    console.log('   2. Thêm dòng: DATABASE_URL="file:./prisma/prisma/dev.db" (cho SQLite local)');
    console.log('   3. Hoặc: DATABASE_URL="postgresql://..." (cho PostgreSQL production)');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL đã được set');
  console.log(`   ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);

  // Try to connect
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('🔄 Đang kết nối đến database...');
    
    // Test connection with a simple query
    await prisma.$connect();
    console.log('✅ Kết nối database thành công!\n');

    // Try a simple query
    console.log('🔄 Đang test query...');
    const userCount = await prisma.user.count();
    console.log(`✅ Query thành công! Số lượng users: ${userCount}\n`);

    // Check if database is initialized
    if (userCount === 0) {
      console.log('⚠️  Database chưa có dữ liệu');
      console.log('   Chạy: npx prisma db seed (nếu có seed data)\n');
    }

    console.log('✅ Tất cả test đều pass! Database hoạt động bình thường.');
  } catch (error: any) {
    console.error('❌ Lỗi kết nối database:\n');
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    
    if (error?.code === 'P1001') {
      console.log('\n📋 Lỗi P1001: Không thể kết nối đến database server');
      console.log('   - Kiểm tra DATABASE_URL có đúng không');
      console.log('   - Kiểm tra database server có đang chạy không');
      console.log('   - Kiểm tra firewall/network settings');
    } else if (error?.code === 'P1003') {
      console.log('\n📋 Lỗi P1003: Database không tồn tại');
      console.log('   - Chạy: npx prisma migrate dev');
      console.log('   - Hoặc tạo database mới');
    } else if (error?.code === 'P1012') {
      console.log('\n📋 Lỗi P1012: Schema không khớp');
      console.log('   - Chạy: npx prisma migrate dev');
      console.log('   - Hoặc: npx prisma db push');
    } else if (error?.message?.includes('ECONNREFUSED')) {
      console.log('\n📋 Lỗi ECONNREFUSED: Database server từ chối kết nối');
      console.log('   - Kiểm tra database server có đang chạy không');
      console.log('   - Kiểm tra port có đúng không');
    } else if (error?.message?.includes('ENOTFOUND')) {
      console.log('\n📋 Lỗi ENOTFOUND: Không tìm thấy database host');
      console.log('   - Kiểm tra hostname trong DATABASE_URL');
      console.log('   - Kiểm tra DNS/network connection');
    } else {
      console.log('\n📋 Lỗi không xác định');
      console.log('   - Kiểm tra logs để biết thêm chi tiết');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Đã đóng kết nối database');
  }
}

testDatabaseConnection().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
