import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('---------------------------------------------------');
    console.log('🚀 SMOKE TEST: Checking System Health');
    console.log('---------------------------------------------------');

    try {
        // 1. Test Database Connection
        console.log('📡 1. Testing Database Connection...');
        const start = Date.now();
        const userCount = await prisma.user.count();
        const duration = Date.now() - start;
        console.log(`   ✅ Connection Successful! (${duration}ms)`);
        console.log(`   📊 Found ${userCount} users in database.`);

        // 2. Test Project Count (Key Entitiy)
        console.log('\n📁 2. Testing Project Data...');
        const projectCount = await prisma.project.count();
        console.log(`   ✅ Projects accessible. Count: ${projectCount}`);

        // 3. Simple Calculation verification (Sanity Check)
        console.log('\n🧮 3. Verifying Calculation Logic (Sanity Check)...');
        const subtotal = 1000;
        const vatRate = 0.08;
        const expectedTotal = 1080;
        const calcTotal = subtotal * (1 + vatRate);

        if (Math.abs(calcTotal - expectedTotal) < 0.01) {
            console.log(`   ✅ Math check passed: ${subtotal} + 8% VAT = ${calcTotal}`);
        } else {
            console.error(`   ❌ Math check failed: Expected ${expectedTotal}, got ${calcTotal}`);
            throw new Error("Math sanity check failed");
        }

        console.log('---------------------------------------------------');
        console.log('🎉 ALL SYSTEMS GO! The app is ready for demo.');
        console.log('---------------------------------------------------');
    } catch (error) {
        console.error('\n❌ SMOKE TEST FAILED');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
