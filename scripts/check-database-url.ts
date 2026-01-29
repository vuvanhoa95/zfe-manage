#!/usr/bin/env tsx
/**
 * Script để kiểm tra DATABASE_URL có dùng pooled connection không
 */

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL không được set');
  process.exit(1);
}

console.log('🔍 Kiểm tra DATABASE_URL...\n');

// Check if it's a pooled connection
const isPooled = databaseUrl.includes('-pooler.') || databaseUrl.includes('?pgbouncer=true');

if (isPooled) {
  console.log('✅ Đang dùng POOLED connection (tốt cho serverless)');
  console.log('   Connection string có chứa "-pooler." hoặc "pgbouncer=true"\n');
} else {
  console.log('⚠️  Đang dùng DIRECT connection (chậm hơn cho serverless)');
  console.log('   Nên chuyển sang pooled connection để tăng tốc độ\n');
  console.log('📋 Cách sửa:');
  console.log('   1. Vào Neon Dashboard');
  console.log('   2. Chọn project → Connection String');
  console.log('   3. Chọn "Pooled connection"');
  console.log('   4. Copy connection string mới');
  console.log('   5. Update trên Vercel Environment Variables\n');
}

// Check region
const regionMatch = databaseUrl.match(/\.([a-z0-9-]+)\.(aws|gcp|azure)\./);
if (regionMatch) {
  const region = regionMatch[1];
  console.log(`📍 Database Region: ${region}`);
  console.log('   Vercel thường ở iad1 (US East)');
  console.log('   Nên match region để giảm latency\n');
}

// Check SSL
const hasSSL = databaseUrl.includes('sslmode=require') || databaseUrl.includes('?ssl=true');
if (!hasSSL) {
  console.log('⚠️  Thiếu SSL mode');
  console.log('   Nên thêm ?sslmode=require vào connection string\n');
}

console.log('📊 Connection String (ẩn password):');
const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
console.log(`   ${maskedUrl}\n`);

if (!isPooled) {
  console.log('💡 Tip: Pooled connection giúp giảm connection time từ ~500ms xuống ~50ms');
  process.exit(1);
}

console.log('✅ Tất cả OK!');
