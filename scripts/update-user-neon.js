/**
 * Simple script to update user directly on Neon database
 * Uses pg library to connect directly, no Prisma needed
 * 
 * Usage: 
 * 1. Set DATABASE_URL in .env.local
 * 2. node scripts/update-user-neon.js
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function updateUser() {
  const email = 'hoavv@zfenix.com';
  const password = 'Zfenix2026';
  const name = 'Hoa VV';
  const role = 'ADMIN';

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL không được set trong .env.local');
    console.log('💡 Chạy: vercel env pull .env.local --environment=production');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Đang kết nối đến Neon database...');
    await client.connect();
    console.log('✅ Đã kết nối');

    // Hash password
    console.log('🔐 Đang hash password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Đã hash password');

    // Check if user exists
    console.log('🔍 Đang kiểm tra user...');
    const checkResult = await client.query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length > 0) {
      // Update existing user
      console.log('📝 User đã tồn tại, đang cập nhật...');
      await client.query(
        `UPDATE users 
         SET password = $1, name = $2, role = $3, "updatedAt" = NOW()
         WHERE email = $4`,
        [hashedPassword, name, role, email]
      );
      console.log('✅ Đã cập nhật user thành công!');
    } else {
      // Create new user
      console.log('➕ User chưa tồn tại, đang tạo mới...');
      await client.query(
        `INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())`,
        [email, hashedPassword, name, role]
      );
      console.log('✅ Đã tạo user mới thành công!');
    }

    // Verify
    const verifyResult = await client.query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      [email]
    );

    if (verifyResult.rows.length > 0) {
      const user = verifyResult.rows[0];
      console.log('\n🎉 Hoàn tất!');
      console.log('\n📋 Thông tin user:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log('\n🔑 Thông tin đăng nhập:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    }

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Đã đóng kết nối');
  }
}

updateUser();
