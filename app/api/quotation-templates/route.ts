import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { createQuotationTemplateSchema } from '@/lib/validation/quotation-templates';

// GET /api/quotation-templates - Danh sách mẫu báo giá
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search')?.trim();
        const category = searchParams.get('category')?.trim();
        const includeInactive = searchParams.get('includeInactive') === 'true';

        const where: any = {};

        if (!includeInactive) {
            where.isActive = true;
        }

        if (category) {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }

        const templates = await prisma.quotationTemplate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: templates,
        });
    } catch (error) {
        console.error('Error fetching quotation templates:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể tải danh sách mẫu báo giá' },
            { status: 500 },
        );
    }
}

// POST /api/quotation-templates - Tạo mới mẫu báo giá
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !(session.user as any).id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id as string;
        const json = await request.json();
        const parsed = createQuotationTemplateSchema.safeParse(json);

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

        const template = await prisma.quotationTemplate.create({
            data: {
                name: body.name,
                code: body.code ?? null,
                description: body.description ?? null,
                category: body.category ?? null,
                vatRate: body.vatRate ?? 0.08,
                title: body.title ?? 'BÁO GIÁ DỊCH VỤ MÔ HÌNH BIM',
                introText: body.introText ?? null,
                scopeText: body.scopeText ?? null,
                deliverablesText: body.deliverablesText,
                scheduleText: body.scheduleText ?? null,
                theme: body.theme ?? null,
                layoutTemplate: body.layoutTemplate ?? null,
                createdById: userId,
                lines: body.lines && body.lines.length
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
                paymentMilestones: body.paymentMilestones && body.paymentMilestones.length
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
                lines: true,
                paymentMilestones: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: template,
        });
    } catch (error) {
        console.error('Error creating quotation template:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể tạo mẫu báo giá' },
            { status: 500 },
        );
    }
}

