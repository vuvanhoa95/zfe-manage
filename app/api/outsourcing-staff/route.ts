import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all outsourcing staff
export async function GET(request: NextRequest) {
    try {
        console.log('=== GET /api/outsourcing-staff ===');
        
        // Check if prisma is available
        if (!prisma) {
            throw new Error('Prisma Client is not initialized');
        }
        
        // Check if model exists
        if (!('outsourcingStaff' in prisma)) {
            console.error('❌ outsourcingStaff model not found in Prisma Client');
            const availableModels = Object.keys(prisma).filter(k => 
                !k.startsWith('$') && 
                !k.startsWith('_') &&
                typeof (prisma as any)[k] === 'object'
            );
            console.error('Available models:', availableModels);
            throw new Error(`Model 'outsourcingStaff' not found. Available models: ${availableModels.join(', ')}`);
        }
        
        const searchParams = request.nextUrl.searchParams;
        const isActive = searchParams.get('isActive');
        
        const where: any = {};
        if (isActive !== null && isActive !== '') {
            where.isActive = isActive === 'true';
        }
        
        // Simple query
        const queryOptions: any = {};
        if (Object.keys(where).length > 0) {
            queryOptions.where = where;
        }
        
        console.log('Executing query with options:', JSON.stringify(queryOptions));
        
        const staff = await (prisma as any).outsourcingStaff.findMany(queryOptions);
        
        console.log(`✅ Found ${staff.length} staff members`);
        
        // Sort in memory
        staff.sort((a: any, b: any) => {
            if (a.isActive !== b.isActive) {
                return a.isActive ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
        
        return NextResponse.json({
            success: true,
            data: staff,
        });
    } catch (error: any) {
        console.error('❌ Failed to fetch outsourcing staff:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error meta:', error.meta ? JSON.stringify(error.meta, null, 2) : 'No meta');

        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tải danh sách nhân sự outsource',
                code: error.code,
                details:
                    process.env.NODE_ENV === 'development'
                        ? {
                              name: error.name,
                              code: error.code,
                              meta: error.meta,
                              message: error.message,
                          }
                        : undefined,
            },
            { status: 500 },
        );
    }
}

// POST - Create new outsourcing staff
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            name,
            code,
            position,
            department,
            discipline,
            avatarUrl,
            email,
            phone,
            address,
            companyName,
            companyTaxCode,
            personalTaxCode,
            bankAccount,
            bankName,
            skills,
            experience,
            certifications,
            hourlyRate,
            dailyRate,
            monthlyRate,
            rateType,
            isActive,
            notes,
        } = body;

        // Validation tối thiểu
        if (!name || name.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'Tên nhân sự là bắt buộc' },
                { status: 400 }
            );
        }

        // Check if model exists
        if (!('outsourcingStaff' in prisma)) {
            throw new Error('Model outsourcingStaff not found in Prisma Client');
        }
        
        const staff = await (prisma as any).outsourcingStaff.create({
            data: {
                name: name.trim(),
                code: code?.trim() || null,
                position: position?.trim() || null,
                department: department?.trim() || null,
                discipline: discipline?.trim() || null,
                avatarUrl: avatarUrl?.trim() || null,
                email: email?.trim() || null,
                phone: phone?.trim() || null,
                address: address?.trim() || null,
                companyName: companyName?.trim() || null,
                companyTaxCode: companyTaxCode?.trim() || null,
                personalTaxCode: personalTaxCode?.trim() || null,
                bankAccount: bankAccount?.trim() || null,
                bankName: bankName?.trim() || null,
                skills: skills?.trim() || null,
                experience: experience?.trim() || null,
                certifications: certifications?.trim() || null,
                hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
                dailyRate: dailyRate ? parseFloat(dailyRate) : null,
                monthlyRate: monthlyRate ? parseFloat(monthlyRate) : null,
                rateType: rateType || null,
                isActive: isActive !== undefined ? isActive : true,
                notes: notes?.trim() || null,
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: staff,
                message: 'Tạo nhân sự outsource thành công',
            },
            { status: 201 },
        );
    } catch (error: any) {
        console.error('Failed to create outsourcing staff:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tạo nhân sự outsource',
                details:
                    process.env.NODE_ENV === 'development'
                        ? { message: error.message, code: error.code, meta: error.meta }
                        : undefined,
            },
            { status: 500 },
        );
    }
}
