#!/usr/bin/env tsx
/**
 * Script để cập nhật hoặc tạo user mới
 * Usage: npx tsx scripts/update-user.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateUser() {
  const email = 'hoavv@zfenix.com';
  const password = 'Zfenix2026';
  const name = 'Hoa VV';
  const role = 'ADMIN';

  try {
    console.log('🔍 Đang kiểm tra user...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Đã hash password');

    // Kiểm tra user có tồn tại không
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('📝 User đã tồn tại, đang cập nhật...');
      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          name,
          password: hashedPassword,
          role,
        },
      });

      console.log('✅ Đã cập nhật user thành công!');
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Name: ${updatedUser.name}`);
      console.log(`   Role: ${updatedUser.role}`);
    } else {
      console.log('➕ User chưa tồn tại, đang tạo mới...');
      
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role,
        },
      });

      console.log('✅ Đã tạo user mới thành công!');
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Name: ${newUser.name}`);
      console.log(`   Role: ${newUser.role}`);
    }

    console.log('\n🎉 Hoàn tất!');
    console.log('\n📋 Thông tin đăng nhập:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateUser();
