const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db',
    },
  },
});

async function main() {
  const email = 'hoavv@zfenix.com';
  const password = 'Zfenix2026';
  
  console.log('🔧 Fixing password for:', email);
  
  // Hash password
  const hashed = await bcrypt.hash(password, 10);
  console.log('✅ Password hashed');
  
  // Update user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashed,
      name: 'Hoa VV',
      role: 'ADMIN',
    },
    create: {
      email,
      password: hashed,
      name: 'Hoa VV',
      role: 'ADMIN',
    },
  });
  
  console.log('✅ User updated:', user.email);
  
  // Test password match
  const testMatch = await bcrypt.compare(password, user.password);
  console.log('✅ Password match test:', testMatch ? 'PASS ✅' : 'FAIL ❌');
  
  if (!testMatch) {
    console.error('❌ Password verification failed!');
    process.exit(1);
  }
  
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
