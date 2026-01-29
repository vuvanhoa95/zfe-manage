import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const diagnostics: any = {
            prismaExists: !!prisma,
            prismaType: typeof prisma,
            hasOutsourcingStaff: 'outsourcingStaff' in prisma,
        };
        
        // Get available models
        if (prisma) {
            const availableModels = Object.keys(prisma).filter(k => 
                !k.startsWith('$') && 
                !k.startsWith('_') &&
                typeof (prisma as any)[k] === 'object'
            );
            diagnostics.availableModels = availableModels;
        }
        
        if (!prisma) {
            return NextResponse.json({
                success: false,
                error: 'Prisma Client is not initialized',
                diagnostics,
            }, { status: 500 });
        }
        
        if (!('outsourcingStaff' in prisma)) {
            return NextResponse.json({
                success: false,
                error: 'Model outsourcingStaff not found in Prisma Client',
                diagnostics,
            }, { status: 500 });
        }
        
        // Test 1: Check if model exists
        console.log('Test 1: Checking if model exists...');
        const count = await (prisma as any).outsourcingStaff.count();
        console.log(`✅ Count: ${count}`);

        // Test 2: Simple findMany
        console.log('Test 2: Simple findMany...');
        const staff = await (prisma as any).outsourcingStaff.findMany({
            take: 5,
        });
        console.log(`✅ Found ${staff.length} staff members`);

        return NextResponse.json({
            success: true,
            count,
            staffCount: staff.length,
            sample: staff[0] || null,
            diagnostics,
        });
    } catch (error: any) {
        console.error('❌ Test error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code,
            meta: error.meta,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        }, { status: 500 });
    }
}
