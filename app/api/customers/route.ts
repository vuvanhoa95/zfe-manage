import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { customerCreateSchema, type CustomerCreateInput } from '@/lib/validation/customer';
import { ensureCoreSchema, isMissingTableError } from '@/lib/db-schema';

// GET /api/customers - List all customers
export async function GET(request: NextRequest) {
    try {
        // Đảm bảo schema tồn tại trước khi thao tác với database
        await ensureCoreSchema();

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search');

        const where: Record<string, unknown> = {};

        if (search) {
            // SQLite không hỗ trợ mode: 'insensitive', dùng contains thôi
            // Case-insensitive sẽ được xử lý ở application level nếu cần
            where.OR = [
                { name: { contains: search } },
                { taxCode: { contains: search } },
                { contactName: { contains: search } },
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
            if (isMissingTableError(innerError)) {
                // CSDL mới, chưa có bảng customers → tạo schema tối thiểu rồi trả về danh sách rỗng
                await ensureCoreSchema();
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
        // Đảm bảo schema tồn tại trước khi thao tác với database
        await ensureCoreSchema();

        const json = await request.json();
        const parsed = customerCreateSchema.safeParse(json);

        if (!parsed.success) {
            const errors = parsed.error.flatten();
            const errorMessages = Object.entries(errors.fieldErrors)
                .map(([field, messages]) => {
                    if (messages && messages.length > 0) {
                        return `${field}: ${messages.join(', ')}`;
                    }
                    return null;
                })
                .filter(Boolean)
                .join('; ');

            return NextResponse.json(
                {
                    success: false,
                    error: errorMessages || 'Dữ liệu khách hàng không hợp lệ',
                    details: process.env.NODE_ENV === 'development' ? errors : undefined,
                },
                { status: 400 },
            );
        }

        const body: CustomerCreateInput = parsed.data;

        let customer;
        try {
            // Sử dụng transaction để đảm bảo atomicity
            customer = await prisma.$transaction(async (tx) => {
                const created = await tx.customer.create({
                    data: {
                        name: body.name.trim(),
                        taxCode: body.taxCode?.trim() || null,
                        address: body.address?.trim() || null,
                        location: body.location?.trim() || null,
                        contactName: body.contactName?.trim() || null,
                        email: body.email?.trim() || null,
                        phone: body.phone?.trim() || null,
                    },
                });

                // Verify ngay trong transaction để đảm bảo data được commit
                const verify = await tx.customer.findUnique({
                    where: { id: created.id },
                    select: { id: true, name: true },
                });

                if (!verify) {
                    throw new Error('Customer was created but cannot be verified in database');
                }

                return created;
            });

            // Log success sau khi transaction commit thành công
            if (process.env.NODE_ENV === 'development') {
                console.log('[API] Customer created and verified successfully:', {
                    id: customer.id,
                    name: customer.name,
                });
            }
        } catch (error: any) {
            // Log error để debug
            if (process.env.NODE_ENV === 'development') {
                console.error('[API] Error creating customer:', {
                    error: error?.message,
                    code: error?.code,
                    name: body.name,
                });
            }

            if (isMissingTableError(error)) {
                console.warn('[API] Customers table missing, attempting to create schema and retry...');
                await ensureCoreSchema();
                // Retry sau khi tạo schema - sử dụng transaction
                try {
                    customer = await prisma.$transaction(async (tx) => {
                        const created = await tx.customer.create({
                            data: {
                                name: body.name.trim(),
                                taxCode: body.taxCode?.trim() || null,
                                address: body.address?.trim() || null,
                                location: body.location?.trim() || null,
                                contactName: body.contactName?.trim() || null,
                                email: body.email?.trim() || null,
                                phone: body.phone?.trim() || null,
                            },
                        });

                        // Verify ngay trong transaction
                        const verify = await tx.customer.findUnique({
                            where: { id: created.id },
                            select: { id: true, name: true },
                        });

                        if (!verify) {
                            throw new Error('Customer was created but cannot be verified in database');
                        }

                        return created;
                    });

                    // Log success sau khi transaction commit
                    if (process.env.NODE_ENV === 'development') {
                        console.log('[API] Customer created and verified successfully after schema ensure:', {
                            id: customer.id,
                            name: customer.name,
                        });
                    }
                } catch (retryError: any) {
                    // Nếu vẫn lỗi sau khi ensure schema, log và throw
                    console.error('[API] Error creating customer after schema ensure:', retryError);
                    if (process.env.NODE_ENV === 'development') {
                        console.error('[API] Retry error details:', {
                            message: retryError?.message,
                            code: retryError?.code,
                            meta: retryError?.meta,
                        });
                    }
                    throw retryError;
                }
            } else if (error?.code === 'P2002') {
                // Unique constraint violation
                if (error?.meta?.target?.includes('taxCode')) {
                    return NextResponse.json(
                        { success: false, error: 'Mã số thuế đã tồn tại. Vui lòng sử dụng mã số thuế khác.' },
                        { status: 409 }, // Conflict
                    );
                } else {
                    throw error;
                }
            } else {
                throw error;
            }
        }

        return NextResponse.json({
            success: true,
            data: customer,
            message: 'Tạo khách hàng thành công',
        });
    } catch (error: any) {
        console.error('Failed to create customer:', error);

        if (process.env.NODE_ENV === 'development') {
            console.error('[API] Customer creation error details:', {
                message: error?.message,
                code: error?.code,
                meta: error?.meta,
                stack: error?.stack,
            });
        }

        if (isMissingTableError(error)) {
            // Tự động tạo schema và thử lại (nếu chưa thử)
            try {
                await ensureCoreSchema();
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            'Cơ sở dữ liệu đã được khởi tạo. Vui lòng thử lại tạo khách hàng. Nếu vẫn lỗi, vui lòng liên hệ admin.',
                    },
                    { status: 500 },
                );
            } catch (schemaError: any) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Không thể khởi tạo cơ sở dữ liệu. Vui lòng liên hệ admin.',
                        details: process.env.NODE_ENV === 'development' ? schemaError?.message : undefined,
                    },
                    { status: 500 },
                );
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: error?.message || 'Không thể tạo khách hàng. Vui lòng thử lại.',
                details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
            },
            { status: 500 },
        );
    }
}
