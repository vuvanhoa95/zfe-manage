import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const projectId = resolvedParams.id;

        // Lấy báo giá chốt của dự án (nếu có) và các dòng outsource
        const projectWithQuotation = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                finalQuotationId: true,
                finalQuotation: {
                    select: {
                        id: true,
                        outsourceLines: {
                            select: {
                                id: true,
                                staffName: true,
                                discipline: true,
                            },
                        },
                    },
                },
            },
        });

        const quotationStaff: Array<{ id: string; name: string; type: 'quotation'; discipline?: string | null }> = [];

        if (projectWithQuotation?.finalQuotation) {
            for (const line of projectWithQuotation.finalQuotation.outsourceLines) {
                if (!line.staffName) continue;
                quotationStaff.push({
                    id: line.id,
                    name: line.staffName,
                    type: 'quotation',
                    discipline: line.discipline ?? null,
                });
            }
        }

        // Lấy danh sách nhân sự outsource đang active
        const outsourcingStaff = await prisma.outsourcingStaff.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                discipline: true,
            },
            orderBy: { name: 'asc' },
        });

        const outsourcingStaffOptions = outsourcingStaff.map((staff) => ({
            id: staff.id,
            name: staff.name,
            type: 'outsourcing' as const,
            discipline: staff.discipline,
        }));

        // Gộp & loại bỏ trùng theo (name, type, discipline)
        const combined = [...quotationStaff, ...outsourcingStaffOptions];
        const uniqueMap = new Map<string, (typeof combined)[number]>();

        for (const item of combined) {
            const key = `${item.type}:${item.name}:${item.discipline ?? ''}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, item);
            }
        }

        const data = Array.from(uniqueMap.values());

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Failed to fetch staff options for project:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tải danh sách nhân sự cho dự án',
                details: process.env.NODE_ENV === 'development' ? { message: (error as Error).message } : undefined,
            },
            { status: 500 },
        );
    }
}

