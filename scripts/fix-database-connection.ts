#!/usr/bin/env tsx
/**
 * Script để kiểm tra và khắc phục lỗi kết nối database
 * Chạy: npx tsx scripts/fix-database-connection.ts
 */

import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

console.log('🔧 Đang kiểm tra và khắc phục lỗi kết nối database...\n');

// 1. Kiểm tra DATABASE_URL
const envLocalPath = join(process.cwd(), '.env.local');
const envPath = join(process.cwd(), '.env');

let hasEnvFile = false;
let databaseUrl = '';

if (existsSync(envLocalPath)) {
  hasEnvFile = true;
  const envContent = require('fs').readFileSync(envLocalPath, 'utf-8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
  if (match) {
    databaseUrl = match[1];
  }
} else if (existsSync(envPath)) {
  hasEnvFile = true;
  const envContent = require('fs').readFileSync(envPath, 'utf-8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
  if (match) {
    databaseUrl = match[1];
  }
}

if (!hasEnvFile || !databaseUrl) {
  console.log('❌ Không tìm thấy DATABASE_URL trong .env hoặc .env.local');
  console.log('\n📋 Đang tạo file .env.local...');
  
  const defaultDatabaseUrl = 'file:./prisma/prisma/dev.db';
  const envContent = `# Database
DATABASE_URL="${defaultDatabaseUrl}"

# NextAuth
NEXTAUTH_SECRET="${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}"
NEXTAUTH_URL="http://localhost:3000"
`;
  
  writeFileSync(envLocalPath, envContent);
  console.log('✅ Đã tạo file .env.local với DATABASE_URL mặc định');
  databaseUrl = defaultDatabaseUrl;
} else {
  console.log('✅ DATABASE_URL đã được set');
  console.log(`   ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);
}

// 2. Kiểm tra database file (cho SQLite)
if (databaseUrl.startsWith('file:')) {
  const dbPath = databaseUrl.replace('file:', '').trim();
  const absolutePath = dbPath.startsWith('/') || dbPath.match(/^[A-Z]:/i) 
    ? dbPath 
    : join(process.cwd(), dbPath);
  
  if (!existsSync(absolutePath)) {
    console.log(`⚠️  Database file không tồn tại: ${absolutePath}`);
    console.log('📋 Đang chạy migrations để tạo database...\n');
    
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: process.cwd() });
      console.log('\n✅ Database đã được tạo thành công!');
    } catch (error) {
      console.error('\n❌ Lỗi khi tạo database:', error);
      console.log('\n📋 Hãy thử chạy thủ công:');
      console.log('   npx prisma migrate dev');
      process.exit(1);
    }
  } else {
    console.log('✅ Database file tồn tại');
  }
}

// 3. Kiểm tra và fix Prisma Client
async function checkAndGeneratePrismaClient() {
  console.log('\n📋 Đang kiểm tra Prisma Client...');

  // Xóa .prisma folder nếu có lỗi EPERM
  const prismaClientPath = join(process.cwd(), 'node_modules', '.prisma');
  
  try {
    // Thử generate trước
    execSync('npx prisma generate', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✅ Prisma Client đã được generate');
  } catch (error: any) {
    if (error.message?.includes('EPERM') || error.message?.includes('operation not permitted')) {
      console.log('⚠️  Lỗi EPERM khi generate Prisma Client (file đang được sử dụng)');
      console.log('📋 Đang thử xóa và generate lại...');
      
      try {
        // Xóa .prisma folder
        if (existsSync(prismaClientPath)) {
          require('fs').rmSync(prismaClientPath, { recursive: true, force: true });
          console.log('✅ Đã xóa .prisma folder cũ');
        }
        
        // Đợi một chút
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate lại
        execSync('npx prisma generate', { stdio: 'inherit', cwd: process.cwd() });
        console.log('✅ Prisma Client đã được generate thành công');
      } catch (retryError: any) {
        console.error('❌ Vẫn lỗi khi generate Prisma Client:', retryError.message);
        console.log('\n📋 Hướng dẫn khắc phục:');
        console.log('   1. Đóng tất cả editor/IDE (kể cả Cursor)');
        console.log('   2. Đóng tất cả terminal/command prompt');
        console.log('   3. Chạy lại: npx prisma generate');
        console.log('   4. Nếu vẫn lỗi, restart máy và thử lại');
        process.exit(1);
      }
    } else {
      console.error('❌ Lỗi khi generate Prisma Client:', error.message);
      process.exit(1);
    }
  }
}

// 4. Test connection
async function main() {
  await checkAndGeneratePrismaClient();
  await testConnection();
}

async function testConnection() {
  console.log('\n📋 Đang test kết nối database...');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    const userCount = await prisma.user.count();
    console.log(`✅ Kết nối database thành công! Số lượng users: ${userCount}`);
    
    if (userCount === 0) {
      console.log('\n⚠️  Database chưa có dữ liệu');
      console.log('📋 Bạn có muốn seed database? (Chạy: npm run prisma:seed)');
    }
    
    await prisma.$disconnect();
    
    console.log('\n✅ Tất cả kiểm tra đều pass! Database hoạt động bình thường.');
    console.log('\n📋 Bạn có thể chạy: npm run dev');
  } catch (error: any) {
    console.error('❌ Lỗi kết nối database:', error.message);
    console.log('\n📋 Các bước khắc phục:');
    console.log('   1. Kiểm tra DATABASE_URL trong .env.local');
    console.log('   2. Chạy: npx prisma migrate deploy');
    console.log('   3. Chạy: npx prisma generate');
    process.exit(1);
  }
}

main();
