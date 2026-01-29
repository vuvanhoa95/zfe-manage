import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { customerUpdateSchema, type CustomerUpdateInput } from '@/lib/validation/customer';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET /api/customers/[id] - Get single customer
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { projects: true },
                },
            },
        });

        if (!customer) {
            return NextResponse.json(
                { success: false, error: 'Khách hàng không tồn tại' },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: customer.id,
                name: customer.name,
                taxCode: customer.taxCode,
                address: customer.address,
                location: customer.location,
                contactName: customer.contactName,
                email: customer.email,
                phone: customer.phone,
                createdAt: customer.createdAt,
                updatedAt: customer.updatedAt,
                projectCount: customer._count.projects,
            },
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể tải thông tin khách hàng' },
            { status: 500 },
        );
    }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const json = await request.json();
        const parsed = customerUpdateSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Dữ liệu khách hàng không hợp lệ', details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const body: CustomerUpdateInput = parsed.data;

        const customer = await prisma.customer.update({
            where: { id },
            data: {
                name: body.name,
                taxCode: body.taxCode,
                address: body.address,
                location: body.location,
                contactName: body.contactName,
                email: body.email,
                phone: body.phone,
            },
        });

        return NextResponse.json({
            success: true,
            data: customer,
            message: 'Cập nhật khách hàng thành công',
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể cập nhật khách hàng' },
            { status: 500 },
        );
    }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        await prisma.customer.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'Xóa khách hàng thành công',
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể xóa khách hàng' },
            { status: 500 },
        );
    }
}

