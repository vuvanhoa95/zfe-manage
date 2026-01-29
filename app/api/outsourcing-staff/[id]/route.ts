import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get single staff member
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const staff = await prisma.outsourcingStaff.findUnique({
            where: { id: resolvedParams.id },
        });

        if (!staff) {
            return NextResponse.json(
                { success: false, error: 'Nhân sự không tồn tại' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: staff,
        });
    } catch (error: any) {
        console.error('Failed to fetch outsourcing staff:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tải thông tin nhân sự outsource',
                details:
                    process.env.NODE_ENV === 'development'
                        ? { message: error.message, code: error.code, meta: error.meta }
                        : undefined,
            },
            { status: 500 },
        );
    }
}

// PUT - Update staff member
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
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

        const staff = await prisma.outsourcingStaff.update({
            where: { id: resolvedParams.id },
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

        return NextResponse.json({
            success: true,
            data: staff,
            message: 'Cập nhật nhân sự outsource thành công',
        });
    } catch (error: any) {
        console.error('Failed to update outsourcing staff:', error);
        if (error.code === 'P2025') {
            return NextResponse.json(
                { success: false, error: 'Nhân sự không tồn tại' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể cập nhật nhân sự outsource',
                details:
                    process.env.NODE_ENV === 'development'
                        ? { message: error.message, code: error.code, meta: error.meta }
                        : undefined,
            },
            { status: 500 },
        );
    }
}

// DELETE - Delete staff member
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        await prisma.outsourcingStaff.delete({
            where: { id: resolvedParams.id },
        });

        return NextResponse.json({
            success: true,
            message: 'Đã xóa nhân sự outsource thành công',
        });
    } catch (error: any) {
        console.error('Failed to delete outsourcing staff:', error);
        if (error.code === 'P2025') {
            return NextResponse.json(
                { success: false, error: 'Nhân sự không tồn tại' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete outsourcing staff' },
            { status: 500 }
        );
    }
}
