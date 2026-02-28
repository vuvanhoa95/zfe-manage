import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { customFieldUpdateSchema, type CustomFieldUpdateInput } from '@/lib/validation/custom-field';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const id = resolvedParams.id;

        const field = await prisma.customField.findUnique({
            where: { id },
            include: {
                options: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });

        if (!field) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Không tìm thấy trường tuỳ chỉnh',
                },
                { status: 404 },
            );
        }

        return NextResponse.json({ success: true, data: field });
    } catch (error) {
        console.error('Failed to fetch custom field:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tải thông tin trường tuỳ chỉnh',
                details: process.env.NODE_ENV === 'development' ? { message: (error as Error).message } : undefined,
            },
            { status: 500 },
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const id = resolvedParams.id;

        const body = await request.json();
        const parsed = customFieldUpdateSchema.safeParse({ ...body, id });

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Dữ liệu chỉnh sửa trường tuỳ chỉnh không hợp lệ',
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const data: CustomFieldUpdateInput = parsed.data;

        const existing = await prisma.customField.findUnique({
            where: { id },
            include: { options: true },
        });

        if (!existing) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Không tìm thấy trường tuỳ chỉnh',
                },
                { status: 404 },
            );
        }

        const updateData: Prisma.CustomFieldUpdateInput = {
            name: data.name?.trim(),
            key: data.key?.trim(),
            description: data.description !== undefined ? data.description?.trim() || null : undefined,
            entityType: data.entityType,
            fieldType: data.fieldType,
            group: data.group !== undefined ? data.group?.trim() || null : undefined,
            sortOrder: data.sortOrder,
            isRequired: data.isRequired,
            isActive: data.isActive,
        };

        let optionsUpdate: Prisma.CustomFieldOptionUpdateManyWithoutCustomFieldNestedInput | undefined;

        if (data.options) {
            const existingOptionsById = new Map(existing.options.map((opt) => [opt.id, opt]));

            const toCreate = data.options.filter((opt) => !opt.id && !opt._deleted);
            const toUpdate = data.options.filter((opt) => opt.id && !opt._deleted);
            const toDeleteIds = data.options.filter((opt) => opt.id && opt._deleted).map((opt) => opt.id as string);

            optionsUpdate = {
                create:
                    toCreate.length > 0
                        ? toCreate.map((opt, index) => ({
                              label: opt.label.trim(),
                              value: (opt.value ?? '').trim() || opt.label.trim(),
                              color: opt.color?.trim() || null,
                              sortOrder: opt.sortOrder ?? index,
                          }))
                        : undefined,
                update:
                    toUpdate.length > 0
                        ? toUpdate.map((opt) => ({
                              where: { id: opt.id as string },
                              data: {
                                  label: opt.label.trim(),
                                  value: (opt.value ?? '').trim() || opt.label.trim(),
                                  color: opt.color?.trim() || null,
                                  sortOrder:
                                      opt.sortOrder ??
                                      existingOptionsById.get(opt.id as string)?.sortOrder ??
                                      0,
                              },
                          }))
                        : undefined,
                delete:
                    toDeleteIds.length > 0
                        ? toDeleteIds.map((idToDelete) => ({ id: idToDelete }))
                        : undefined,
            };

            updateData.options = optionsUpdate;
        }

        const updated = await prisma.customField.update({
            where: { id },
            data: updateData,
            include: {
                options: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error: unknown) {
        console.error('Failed to update custom field:', error);

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
                error: 'Không thể cập nhật trường tuỳ chỉnh',
                details: process.env.NODE_ENV === 'development' ? { message } : undefined,
            },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const id = resolvedParams.id;

        await prisma.customField.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, data: true });
    } catch (error: unknown) {
        console.error('Failed to delete custom field:', error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Trường tuỳ chỉnh không tồn tại hoặc đã bị xoá.',
                    },
                    { status: 404 },
                );
            }
        }

        const message = error instanceof Error ? error.message : 'Internal Server Error';

        return NextResponse.json(
            {
                success: false,
                error: 'Không thể xoá trường tuỳ chỉnh',
                details: process.env.NODE_ENV === 'development' ? { message } : undefined,
            },
            { status: 500 },
        );
    }
}

