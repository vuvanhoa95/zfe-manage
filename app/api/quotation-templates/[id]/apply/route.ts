import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/quotation-templates/[id]/apply
// Trả về payload để FE merge vào QuotationFormData
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const resolved = params instanceof Promise ? await params : params;
        const json = await request.json().catch(() => ({}));
        const totalArea = typeof json.totalArea === 'number' ? json.totalArea : undefined;

        const template = await prisma.quotationTemplate.findUnique({
            where: { id: resolved.id },
            include: {
                lines: {
                    orderBy: { order: 'asc' },
                },
                paymentMilestones: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!template) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy mẫu báo giá' },
                { status: 404 },
            );
        }

        const lines = template.lines.map((l, idx) => ({
            section: l.section ?? undefined,
            itemNo: l.itemNo ?? undefined,
            title: l.title,
            qty: l.qty ?? undefined,
            unit: l.unit ?? undefined,
            unitPrice: l.unitPrice ?? undefined,
            // Nếu có totalArea và đơn vị là m² thì coi như priceType 'area', ngược lại 'fixed'
            priceType:
                totalArea && l.unit === 'm²'
                    ? ('area' as const)
                    : ('fixed' as const),
            note: l.note ?? undefined,
            order: typeof l.order === 'number' ? l.order : idx,
            isGroupHeader: l.isGroupHeader,
            isChargeable: l.isChargeable,
        }));

        const paymentMilestones = template.paymentMilestones.map((m, idx) => ({
            no: m.no,
            title: m.title,
            percent: m.percent,
            description: m.description ?? undefined,
            expectedDate: m.expectedDate ?? undefined,
            order: typeof m.order === 'number' ? m.order : idx,
        }));

        return NextResponse.json({
            success: true,
            data: {
                title: template.title,
                introText: template.introText ?? undefined,
                scopeText: template.scopeText ?? undefined,
                deliverablesText: template.deliverablesText,
                scheduleText: template.scheduleText ?? undefined,
                vatRate: template.vatRate,
                theme: template.theme ?? undefined,
                templateId: template.layoutTemplate ?? undefined,
                lines,
                paymentMilestones,
            },
        });
    } catch (error) {
        console.error('Error applying quotation template:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể áp dụng mẫu báo giá' },
            { status: 500 },
        );
    }
}

