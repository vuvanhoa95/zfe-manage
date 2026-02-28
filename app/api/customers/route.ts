import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { customerCreateSchema, type CustomerCreateInput } from '@/lib/validation/customer';

async function ensureCustomerSchema() {
    // Tạo bảng customers tối thiểu nếu chưa tồn tại (SQLite)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "customers" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "taxCode" TEXT,
            "address" TEXT,
            "location" TEXT,
            "contactName" TEXT,
            "email" TEXT,
            "phone" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Index cơ bản để search nhanh hơn, nếu đã tồn tại thì bỏ qua
    try {
        await prisma.$executeRawUnsafe(
            `CREATE INDEX IF NOT EXISTS "customers_name_idx" ON "customers"("name")`
        );
    } catch {}
    try {
        await prisma.$executeRawUnsafe(
            `CREATE INDEX IF NOT EXISTS "customers_taxCode_idx" ON "customers"("taxCode")`
        );
    } catch {}
}

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

        let customers: {
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
        }[];
        try {
            customers = await prisma.customer.findMany({
                where,
                orderBy: { name: 'asc' },
                include: {
                    _count: {
                        select: { projects: true },
                    },
                },
            });
        } catch (innerError: any) {
            const isPrismaKnownError = innerError instanceof Prisma.PrismaClientKnownRequestError;
            const message: string = innerError?.message ?? '';
            const isMissingTable =
                (isPrismaKnownError && (innerError.code === 'P2021' || innerError.code === 'P2022')) ||
                /does not exist in the current database/i.test(message) ||
                /no such table/i.test(message);

            if (isMissingTable) {
                // CSDL mới, chưa có bảng customers → tạo schema tối thiểu rồi trả về danh sách rỗng
                await ensureCustomerSchema();
                customers = [];
            } else {
                throw innerError;
            }
        }

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

        let customer;
        try {
            customer = await prisma.customer.create({
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
        } catch (innerError: any) {
            const isPrismaKnownError = innerError instanceof Prisma.PrismaClientKnownRequestError;
            const message: string = innerError?.message ?? '';
            const isMissingTable =
                (isPrismaKnownError && (innerError.code === 'P2021' || innerError.code === 'P2022')) ||
                /does not exist in the current database/i.test(message) ||
                /no such table/i.test(message);

            if (isMissingTable) {
                // Nếu bảng customers chưa tồn tại, tạo schema tối thiểu rồi retry một lần
                await ensureCustomerSchema();
                customer = await prisma.customer.create({
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
            } else {
                throw innerError;
            }
        }

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
