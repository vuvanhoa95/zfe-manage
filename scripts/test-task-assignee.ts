import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('---------------------------------------------------');
    console.log('🧪 VERIFYING: Task-System User Assignment');
    console.log('---------------------------------------------------');

    try {
        // 1. Check if demo users exist
        console.log('🔍 1. checking for System Users (An, Binh, Cuong...)...');
        const users = await prisma.user.findMany({
            where: {
                name: {
                    in: ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Admin User', 'Hoa VV']
                }
            },
            select: { id: true, name: true }
        });

        if (users.length === 0) {
            console.warn('   ⚠️  No specific demo users found. Check if seeding was successful.');
        } else {
            console.log(`   ✅ Found ${users.length} system users.`);
            users.forEach(u => console.log(`      - ${u.name} (ID: ${u.id})`));
        }

        // 2. Test Task Creation with ID
        const testProjectId = (await prisma.project.findFirst({ select: { id: true } }))?.id;
        if (!testProjectId) {
            console.log('   ⚠️  No project found to test task assignment. Skipping creation test.');
        } else {
            console.log('\n📝 2. Testing Task Creation with System User ID...');
            const targetUser = users[0] || (await prisma.user.findFirst());
            
            if (!targetUser) {
                throw new Error("No user found in database to assign to task.");
            }

            const testTask = await prisma.task.create({
                data: {
                    projectId: testProjectId,
                    title: '[TEST] Công việc thử nghiệm phân quyền',
                    status: 'TODO',
                    priority: 'MEDIUM',
                    assignedToId: targetUser.id,
                },
                include: {
                    assignee: true
                }
            });

            console.log(`   ✅ Task Created Successfully! ID: ${testTask.id}`);
            console.log(`   👤 Assigned to: ${testTask.assignee?.name || 'FAILED TO LINK'}`);

            if (testTask.assignedToId === targetUser.id && testTask.assignee?.name === targetUser.name) {
                console.log('   🟢 VERIFICATION PASSED: Relation Linked Correctly.');
            } else {
                console.error('   🔴 VERIFICATION FAILED: Relation not linking properly.');
                throw new Error("Relation link failed");
            }

            // Cleanup
            await prisma.task.delete({ where: { id: testTask.id } });
            console.log('   🧹 Test task cleaned up.');
        }

        console.log('\n---------------------------------------------------');
        console.log('🎉 SYSTEM USER ASSIGNMENT LOGIC: OK');
        console.log('---------------------------------------------------');
    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
