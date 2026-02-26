import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { customerCreateSchema, type CustomerCreateInput } from '@/lib/validation/customer';

// GET /api/customers - List all customers
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search');

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { taxCode: { contains: search, mode: 'insensitive' } },
                { contactName: { contains: search, mode: 'insensitive' } },
            ];
        }

        const customers = await prisma.customer.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { projects: true },
                },
            },
        });

        const data = customers.map((c: {
            id: string;
            name: string;
            taxCode: string | null;
            address: string | null;
            location: string | null;
            contactName: string | null;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            _count: { projects: number };
        }) => ({
            id: c.id,
            name: c.name,
            taxCode: c.taxCode,
            address: c.address,
            location: c.location,
            contactName: c.contactName,
            email: c.email,
            phone: c.phone,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            projectCount: c._count.projects,
        }));

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể tải danh sách khách hàng' },
            { status: 500 },
        );
    }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
    try {
        const json = await request.json();
        const parsed = customerCreateSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Dữ liệu khách hàng không hợp lệ', details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const body: CustomerCreateInput = parsed.data;

        const customer = await prisma.customer.create({
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
            message: 'Tạo khách hàng thành công',
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể tạo khách hàng' },
            { status: 500 },
        );
    }
}
