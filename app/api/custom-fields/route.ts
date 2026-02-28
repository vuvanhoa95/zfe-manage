import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ensureCustomFieldsSchema } from '@/lib/custom-fields/ensureCustomFieldsSchema';
import {
    CUSTOM_FIELD_ENTITY_TYPES,
    customFieldCreateSchema,
    type CustomFieldCreateInput,
} from '@/lib/validation/custom-field';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const entityType = searchParams.get('entityType');
        const includeInactive = searchParams.get('includeInactive') === 'true';

        const where: Prisma.CustomFieldWhereInput = {};

        if (entityType) {
            if (!CUSTOM_FIELD_ENTITY_TYPES.includes(entityType as (typeof CUSTOM_FIELD_ENTITY_TYPES)[number])) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Loại đối tượng không hợp lệ. Chỉ hỗ trợ PROJECT hoặc TASK.',
                    },
                    { status: 400 },
                );
            }
            where.entityType = entityType as Prisma.CustomFieldWhereInput['entityType'];
        }

        if (!includeInactive) {
            where.isActive = true;
        }

        let fields;
        try {
            fields = await prisma.customField.findMany({
                where,
                orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
                include: {
                    options: {
                        orderBy: { sortOrder: 'asc' },
                    },
                },
            });
        } catch (innerError) {
            // Nếu DB chưa migrate schema custom fields, tự tạo rồi thử lại 1 lần
            if (
                innerError instanceof Prisma.PrismaClientKnownRequestError &&
                (innerError.code === 'P2021' || innerError.code === 'P2022')
            ) {
                console.warn('Custom fields schema missing on GET, attempting to create on-the-fly...');
                await ensureCustomFieldsSchema();
                fields = await prisma.customField.findMany({
                    where,
                    orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
                    include: {
                        options: {
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                });
            } else {
                throw innerError;
            }
        }

        return NextResponse.json({ success: true, data: fields });
    } catch (error) {
        console.error('Failed to fetch custom fields:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tải danh sách trường tuỳ chỉnh',
                details: process.env.NODE_ENV === 'development' ? { message: (error as Error).message } : undefined,
            },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = customFieldCreateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Dữ liệu trường tuỳ chỉnh không hợp lệ',
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const data: CustomFieldCreateInput = parsed.data;

        let field;
        try {
            field = await prisma.customField.create({
                data: {
                    name: data.name.trim(),
                    key: data.key.trim(),
                    description: data.description?.trim() || null,
                    entityType: data.entityType,
                    fieldType: data.fieldType,
                    group: data.group?.trim() || null,
                    sortOrder: data.sortOrder ?? 0,
                    isRequired: data.isRequired ?? false,
                    isActive: data.isActive ?? true,
                    options:
                        data.options && data.options.length > 0
                            ? {
                                  create: data.options.map((opt, index) => ({
                                      label: opt.label.trim(),
                                      value: (opt.value ?? '').trim() || opt.label.trim(),
                                      color: opt.color?.trim() || null,
                                      sortOrder: opt.sortOrder ?? index,
                                  })),
                              }
                            : undefined,
                },
                include: {
                    options: {
                        orderBy: { sortOrder: 'asc' },
                    },
                },
            });
        } catch (innerError) {
            if (
                innerError instanceof Prisma.PrismaClientKnownRequestError &&
                (innerError.code === 'P2021' || innerError.code === 'P2022')
            ) {
                console.warn('Custom fields schema missing on POST, attempting to create on-the-fly...');
                await ensureCustomFieldsSchema();
                field = await prisma.customField.create({
                    data: {
                        name: data.name.trim(),
                        key: data.key.trim(),
                        description: data.description?.trim() || null,
                        entityType: data.entityType,
                        fieldType: data.fieldType,
                        group: data.group?.trim() || null,
                        sortOrder: data.sortOrder ?? 0,
                        isRequired: data.isRequired ?? false,
                        isActive: data.isActive ?? true,
                        options:
                            data.options && data.options.length > 0
                                ? {
                                      create: data.options.map((opt, index) => ({
                                          label: opt.label.trim(),
                                          value: (opt.value ?? '').trim() || opt.label.trim(),
                                          color: opt.color?.trim() || null,
                                          sortOrder: opt.sortOrder ?? index,
                                      })),
                                  }
                                : undefined,
                    },
                    include: {
                        options: {
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                });
            } else {
                throw innerError;
            }
        }

        return NextResponse.json({ success: true, data: field }, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to create custom field:', error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Mã trường đã tồn tại. Vui lòng chọn mã khác.',
                        details: process.env.NODE_ENV === 'development' ? { message: error.message } : undefined,
                    },
                    { status: 400 },
                );
            }
        }

        const message = error instanceof Error ? error.message : 'Internal Server Error';

        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tạo trường tuỳ chỉnh mới',
                details: process.env.NODE_ENV === 'development' ? { message } : undefined,
            },
            { status: 500 },
        );
    }
}

