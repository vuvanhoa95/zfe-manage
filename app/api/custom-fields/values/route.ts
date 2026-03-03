import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureCustomFieldsSchema } from '@/lib/custom-fields/ensureCustomFieldsSchema';
import {
    CUSTOM_FIELD_ENTITY_TYPES,
    customFieldValueUpsertSchema,
    type CustomFieldValueUpsertInput,
} from '@/lib/validation/custom-field';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const entityType = searchParams.get('entityType');
        const entityId = searchParams.get('entityId');

        if (!entityType || !entityId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Thiếu tham số entityType hoặc entityId',
                },
                { status: 400 },
            );
        }

        if (!CUSTOM_FIELD_ENTITY_TYPES.includes(entityType as (typeof CUSTOM_FIELD_ENTITY_TYPES)[number])) {
            return NextResponse.json(
                { success: false, error: 'entityType không hợp lệ. Chỉ hỗ trợ PROJECT hoặc TASK.' },
                { status: 400 },
            );
        }

        let values;
        try {
            values = await prisma.customFieldValue.findMany({
                where: {
                    entityType: entityType as (typeof CUSTOM_FIELD_ENTITY_TYPES)[number],
                    entityId,
                },
            });
        } catch (innerError) {
            if (
                typeof (innerError as any)?.code === 'string' &&
                ((innerError as any).code === 'P2021' || (innerError as any).code === 'P2022')
            ) {
                console.warn('Custom fields schema missing on values GET, attempting to create on-the-fly...');
                await ensureCustomFieldsSchema();
                values = await prisma.customFieldValue.findMany({
                    where: {
                        entityType: entityType as (typeof CUSTOM_FIELD_ENTITY_TYPES)[number],
                        entityId,
                    },
                });
            } else {
                throw innerError;
            }
        }

        return NextResponse.json({ success: true, data: values });
    } catch (error) {
        console.error('Failed to fetch custom field values:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tải giá trị trường tuỳ chỉnh',
                details: process.env.NODE_ENV === 'development' ? { message: (error as Error).message } : undefined,
            },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = customFieldValueUpsertSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Dữ liệu giá trị trường tuỳ chỉnh không hợp lệ',
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const data: CustomFieldValueUpsertInput = parsed.data;

        const fieldIds = Object.keys(data.values);

        if (fieldIds.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Fetch field definitions để biết kiểu dữ liệu và validate tối thiểu
        const fieldDefs = await prisma.customField.findMany({
            where: {
                id: { in: fieldIds },
                entityType: data.entityType,
                isActive: true,
            },
            include: {
                options: true,
            },
        });
        const fieldDefById = new Map(fieldDefs.map((f) => [f.id, f]));

        const now = new Date();

        const upserts = await Promise.all(
            fieldIds.map(async (fieldId) => {
                const rawValue = data.values[fieldId];
                const def = fieldDefById.get(fieldId);
                if (!def) {
                    // Field không tồn tại hoặc không thuộc entityType này → bỏ qua
                    return null;
                }

                let stringValue: string | null = null;
                let numberValue: number | null = null;
                let dateValue: Date | null = null;
                let boolValue: boolean | null = null;

                if (rawValue === null || rawValue === undefined) {
                    // xoá giá trị
                } else if (def.fieldType === 'NUMBER') {
                    if (typeof rawValue === 'number') {
                        numberValue = rawValue;
                    } else if (typeof rawValue === 'string' && rawValue.trim()) {
                        const n = Number(rawValue);
                        numberValue = Number.isFinite(n) ? n : null;
                    }
                } else if (def.fieldType === 'BOOLEAN') {
                    if (typeof rawValue === 'boolean') boolValue = rawValue;
                    if (typeof rawValue === 'string') boolValue = rawValue.toLowerCase() === 'true';
                    if (typeof rawValue === 'number') boolValue = rawValue !== 0;
                } else if (def.fieldType === 'DATE') {
                    if (typeof rawValue === 'string' && rawValue.trim()) {
                        const d = new Date(rawValue);
                        dateValue = Number.isNaN(d.getTime()) ? null : d;
                    }
                } else if (def.fieldType === 'MULTI_SELECT') {
                    if (Array.isArray(rawValue)) {
                        // lưu mảng optionId dạng JSON
                        stringValue = JSON.stringify(rawValue);
                    } else if (typeof rawValue === 'string') {
                        // cho phép gửi JSON string
                        stringValue = rawValue.trim() ? rawValue : null;
                    }
                } else if (def.fieldType === 'SELECT') {
                    if (typeof rawValue === 'string') {
                        // ưu tiên lưu optionId
                        stringValue = rawValue.trim() || null;
                    }
                } else {
                    // TEXT
                    if (typeof rawValue === 'string') stringValue = rawValue;
                    else stringValue = String(rawValue);
                }

                const existing = await prisma.customFieldValue.findFirst({
                    where: {
                        customFieldId: fieldId,
                        entityType: data.entityType,
                        entityId: data.entityId,
                    },
                });

                if (!existing) {
                    if (
                        stringValue === null &&
                        numberValue === null &&
                        dateValue === null &&
                        boolValue === null
                    ) {
                        // Không có gì để lưu
                        return null;
                    }

                    return prisma.customFieldValue.create({
                        data: {
                            customFieldId: fieldId,
                            entityType: data.entityType,
                            entityId: data.entityId,
                            stringValue,
                            numberValue,
                            dateValue,
                            boolValue,
                        },
                    });
                }

                if (
                    stringValue === null &&
                    numberValue === null &&
                    dateValue === null &&
                    boolValue === null
                ) {
                    // Nếu value null hết → xoá record để tránh rác
                    await prisma.customFieldValue.delete({
                        where: { id: existing.id },
                    });
                    return null;
                }

                return prisma.customFieldValue.update({
                    where: { id: existing.id },
                    data: {
                        stringValue,
                        numberValue,
                        dateValue,
                        boolValue,
                        updatedAt: now,
                    },
                });
            }),
        );

        const nonNull = upserts.filter((v) => v !== null);

        return NextResponse.json({ success: true, data: nonNull });
    } catch (error) {
        console.error('Failed to upsert custom field values:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể lưu giá trị trường tuỳ chỉnh',
                details: process.env.NODE_ENV === 'development' ? { message: (error as Error).message } : undefined,
            },
            { status: 500 },
        );
    }
}

