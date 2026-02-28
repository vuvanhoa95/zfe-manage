import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { updateQuotationTemplateSchema } from '@/lib/validation/quotation-templates';

// GET /api/quotation-templates/[id] - chi tiết mẫu
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const resolved = params instanceof Promise ? await params : params;
        const template = await prisma.quotationTemplate.findUnique({
            where: { id: resolved.id },
            include: {
                lines: {
                    orderBy: { order: 'asc' },
                },
                paymentMilestones: {
                    orderBy: { order: 'asc' },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!template) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy mẫu báo giá' },
                { status: 404 },
            );
        }

        return NextResponse.json({ success: true, data: template });
    } catch (error) {
        console.error('Error fetching quotation template:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể tải mẫu báo giá' },
            { status: 500 },
        );
    }
}

// PUT /api/quotation-templates/[id] - cập nhật mẫu
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id as string;
        const resolved = params instanceof Promise ? await params : params;

        const existing = await prisma.quotationTemplate.findUnique({
            where: { id: resolved.id },
            select: { id: true, createdById: true },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy mẫu báo giá' },
                { status: 404 },
            );
        }

        if (existing.createdById !== userId) {
            return NextResponse.json(
                { success: false, error: 'Bạn không có quyền chỉnh sửa mẫu này' },
                { status: 403 },
            );
        }

        const json = await request.json();
        const parsed = updateQuotationTemplateSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Dữ liệu mẫu báo giá không hợp lệ',
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const body = parsed.data;

        // Nếu có lines/paymentMilestones trong body, ta xóa rồi tạo lại để đơn giản hoá
        if (body.lines || body.paymentMilestones) {
            await prisma.quotationTemplateLine.deleteMany({
                where: { templateId: resolved.id },
            });

            await prisma.quotationTemplatePaymentMilestone.deleteMany({
                where: { templateId: resolved.id },
            });
        }

        const updated = await prisma.quotationTemplate.update({
            where: { id: resolved.id },
            data: {
                name: body.name,
                code: body.code,
                description: body.description,
                category: body.category,
                vatRate: body.vatRate,
                title: body.title,
                introText: body.introText,
                scopeText: body.scopeText,
                deliverablesText: body.deliverablesText,
                scheduleText: body.scheduleText,
                theme: body.theme,
                layoutTemplate: body.layoutTemplate,
                isActive: body.isActive,
                lines: body.lines
                    ? {
                        create: body.lines.map((l, idx) => ({
                            section: l.section ?? null,
                            itemNo: l.itemNo ?? null,
                            title: l.title,
                            qty: l.qty ?? null,
                            unit: l.unit ?? null,
                            unitPrice: l.unitPrice ?? null,
                            total: (l.qty ?? 0) * (l.unitPrice ?? 0),
                            note: l.note ?? null,
                            order: typeof l.order === 'number' ? l.order : idx,
                            isGroupHeader: l.isGroupHeader ?? false,
                            isChargeable: l.isChargeable ?? true,
                        })),
                    }
                    : undefined,
                paymentMilestones: body.paymentMilestones
                    ? {
                        create: body.paymentMilestones.map((m, idx) => ({
                            no: m.no,
                            title: m.title,
                            percent: m.percent,
                            description: m.description ?? null,
                            expectedDate: m.expectedDate ? new Date(m.expectedDate as any) : null,
                            order: typeof m.order === 'number' ? m.order : idx,
                        })),
                    }
                    : undefined,
            },
            include: {
                lines: { orderBy: { order: 'asc' } },
                paymentMilestones: { orderBy: { order: 'asc' } },
            },
        });

        return NextResponse.json({
            success: true,
            data: updated,
        });
    } catch (error) {
        console.error('Error updating quotation template:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể cập nhật mẫu báo giá' },
            { status: 500 },
        );
    }
}

// DELETE /api/quotation-templates/[id] - ẩn mẫu (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id as string;
        const resolved = params instanceof Promise ? await params : params;

        const existing = await prisma.quotationTemplate.findUnique({
            where: { id: resolved.id },
            select: { id: true, createdById: true },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy mẫu báo giá' },
                { status: 404 },
            );
        }

        if (existing.createdById !== userId) {
            return NextResponse.json(
                { success: false, error: 'Bạn không có quyền xoá mẫu này' },
                { status: 403 },
            );
        }

        await prisma.quotationTemplate.update({
            where: { id: resolved.id },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting quotation template:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể xoá mẫu báo giá' },
            { status: 500 },
        );
    }
}

