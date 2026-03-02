const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function seed() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@zfenix.local' },
        update: {},
        create: {
            id: crypto.randomUUID(),
            email: 'admin@zfenix.local',
            password: hashedPassword,
            name: 'Admin',
            role: 'ADMIN'
        }
    });
    console.log('Created user:', user.email, user.id);
    await prisma['$disconnect']();
}

seed().catch(e => {
    console.error(e);
    process.exit(1);
});
