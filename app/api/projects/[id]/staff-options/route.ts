import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSchemaCheck, isMissingTableError, ensureCoreSchema } from '@/lib/db-schema';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const projectId = resolvedParams.id;

        // Đảm bảo schema cơ bản tồn tại
        await ensureCoreSchema();

        // Báo giá chốt cho dự án
        const projectWithQuotation = await withSchemaCheck(
            () =>
                prisma.project.findUnique({
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
                }),
            null,
        );

        const quotationStaffNames = projectWithQuotation?.finalQuotation?.outsourceLines
            .map(line => line.staffName?.trim())
            .filter(name => !!name) || [];

        // Lấy danh sách nhân sự outsource đang active
        const outsourcingStaff = await withSchemaCheck(
            () =>
                prisma.outsourcingStaff.findMany({
                    where: { isActive: true },
                    select: { name: true },
                }),
            [] as { name: string }[],
        );
        const outsourcingStaffNames = outsourcingStaff.map(s => s.name.trim());

        const allPotentialNames = Array.from(new Set([...quotationStaffNames, ...outsourcingStaffNames]));

        // Lấy danh sách System Users
        const systemUsers = await withSchemaCheck(
            () =>
                prisma.user.findMany({
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                    orderBy: { name: 'asc' },
                }),
            [] as { id: string; name: string; role: string }[],
        );

        // Map system users sang format StaffOption
        const data = systemUsers.map(user => ({
            id: user.id,
            name: user.name,
            type: 'user', // Đổi type thành user để UI nhận biết
            discipline: user.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân sự',
        }));

        // Option bổ sung: Nếu có nhân sự trong danh sách tiềm năng (outsource) mà CHƯA có trong system users,
        // chúng ta có thể gợi ý (trong tương lai sẽ tạo user từ đây). 
        // Nhưng theo yêu cầu của user: "Quản lý system user sẽ là phần nhân sự outsource luôn",
        // nên trước mắt ta chỉ hiện System Users. Nếu user muốn assign người mới, họ phải tạo User trước (hoặc ta tự động tạo).

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Failed to fetch staff options for project:', error);

        if (isMissingTableError(error)) {
            return NextResponse.json({ success: true, data: [] });
        }

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
