import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params =
    | { id: string }
    | Promise<{
          id: string;
      }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
    void request;

    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const staffId = resolvedParams.id;

        if (!staffId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Thiếu mã nhân sự',
                },
                { status: 400 },
            );
        }

        const staff = await prisma.outsourcingStaff.findUnique({
            where: { id: staffId },
            select: { id: true },
        });

        if (!staff) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Nhân sự không tồn tại',
                },
                { status: 404 },
            );
        }

        const cashFlows = await prisma.cashFlow.findMany({
            where: { outsourcingStaffId: staffId },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        projectNo: true,
                    },
                },
                quotation: {
                    select: {
                        id: true,
                        quotationNo: true,
                    },
                },
            },
            orderBy: { date: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: cashFlows,
        });
    } catch (error: any) {
        console.error('Failed to fetch cash flows for outsourcing staff:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tải danh sách đợt thanh toán cho nhân sự này',
                details:
                    process.env.NODE_ENV === 'development'
                        ? { message: error?.message, code: error?.code, meta: error?.meta }
                        : undefined,
            },
            { status: 500 },
        );
    }
}

