import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const cashFlowCreateSchema = z.object({
    type: z.enum(['INCOME', 'EXPENSE']),
    category: z.string().trim().min(1).max(200).optional().nullable(),
    description: z.string().trim().min(1).max(500),
    amount: z.coerce.number().finite().positive(),
    date: z.union([z.string().min(1), z.date()]),
    quotationId: z.string().trim().min(1).optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
    documentStatus: z.enum(['NONE', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional().nullable(),
    documentNote: z.string().trim().max(500).optional().nullable(),
});

async function getUserIdFromSessionOrFallback(createdById?: string) {
    if (createdById) return createdById;

    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user && (session.user as any).id ? ((session.user as any).id as string) : null;
    if (sessionUserId) return sessionUserId;

    const defaultUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true },
    });

    return defaultUser?.id || null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const cashFlows = await prisma.cashFlow.findMany({
            where: { projectId: resolvedParams.id },
            include: {
                quotation: {
                    select: { id: true, quotationNo: true },
                },
                createdBy: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { date: 'desc' },
        });

        return NextResponse.json({ success: true, data: cashFlows });
    } catch (error: any) {
        console.error('Failed to fetch cash flows:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tải danh sách dòng tiền',
                details:
                    process.env.NODE_ENV === 'development'
                        ? { message: error?.message, code: error?.code, meta: error?.meta }
                        : undefined,
            },
            { status: 500 },
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const rawBody = await request.json();
        const parsed = cashFlowCreateSchema.safeParse(rawBody);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Dữ liệu dòng tiền không hợp lệ', details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const { type, category, description, amount, date, quotationId, notes, documentStatus, documentNote } = parsed.data;
        const createdById = await getUserIdFromSessionOrFallback((rawBody?.createdById as string | undefined) ?? undefined);

        if (!createdById) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Không tìm thấy người dùng. Vui lòng đăng nhập hoặc chạy seed database trước.',
                },
                { status: 400 },
            );
        }

        // Verify user exists
        const userExists = await prisma.user.findUnique({ where: { id: createdById }, select: { id: true } });
        if (!userExists) {
                return NextResponse.json(
                    { success: false, error: 'Người dùng không tồn tại' },
                    { status: 400 },
                );
        }

        // Ensure project exists & lấy thông tin tổng doanh thu từ báo giá chốt (nếu có)
        const project = await prisma.project.findUnique({
            where: { id: resolvedParams.id },
            select: { id: true, totalRevenue: true },
        });
            if (!project) {
                return NextResponse.json(
                    { success: false, error: 'Dự án không tồn tại' },
                    { status: 404 },
                );
            }

        // Verify quotation exists if provided và lấy giá trị báo giá
        let quotationTotalAfterVat: number | null = null;
        if (quotationId) {
            const quotation = await prisma.quotation.findUnique({
                where: { id: quotationId },
                select: { id: true, totalAfterVat: true, projectId: true },
            });
            if (!quotation || quotation.projectId !== project.id) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Báo giá không tồn tại hoặc không thuộc dự án này',
                    },
                    { status: 400 },
                );
            }
            quotationTotalAfterVat = quotation.totalAfterVat ?? null;
        }

        // Với dòng THU, không cho phép tổng thu vượt quá giá trị báo giá
        if (type === 'INCOME') {
            // Nếu có báo giá gắn kèm thì ưu tiên dùng tổng tiền báo giá đó, nếu không thì dùng tổng doanh thu của dự án
            const incomeLimit = quotationTotalAfterVat ?? project.totalRevenue ?? 0;

            if (incomeLimit > 0) {
                const existingIncome = await prisma.cashFlow.aggregate({
                    where: {
                        projectId: resolvedParams.id,
                        type: 'INCOME',
                        ...(quotationId ? { quotationId } : {}),
                    },
                    _sum: { amount: true },
                });

                const currentIncome = existingIncome._sum.amount ?? 0;
                const nextIncome = currentIncome + amount;

                if (nextIncome - incomeLimit > 1) {
                    const formattedLimit = incomeLimit.toLocaleString('vi-VN');
                    const formattedCurrent = currentIncome.toLocaleString('vi-VN');
                    const formattedNew = amount.toLocaleString('vi-VN');

                    return NextResponse.json(
                        {
                            success: false,
                            error: `Tổng thu không được vượt quá giá trị báo giá (${formattedLimit} đ). Hiện tại đã thu ${formattedCurrent} đ, đợt này là ${formattedNew} đ.`,
                        },
                        { status: 400 },
                    );
                }
            }
        }

        const cashFlow = await prisma.cashFlow.create({
            data: {
                projectId: resolvedParams.id,
                type,
                category: category || null,
                description,
                amount,
                date: date instanceof Date ? date : new Date(date),
                quotationId: quotationId || null,
                notes: notes || null,
                documentStatus: documentStatus && documentStatus !== 'NONE' ? documentStatus : null,
                documentNote: documentNote || null,
                createdById,
            },
            include: {
                quotation: {
                    select: { id: true, quotationNo: true },
                },
                createdBy: {
                    select: { id: true, name: true },
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: cashFlow,
                message: 'Tạo dòng tiền thành công',
            },
            { status: 201 },
        );
    } catch (error: any) {
        console.error('Failed to create cash flow:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tạo dòng tiền',
                details:
                    process.env.NODE_ENV === 'development'
                        ? { message: error?.message, code: error?.code, meta: error?.meta }
                        : undefined,
            },
            { status: 500 },
        );
    }
}

// NOTE: Project totals are derived from final quotation, not cashflows.
