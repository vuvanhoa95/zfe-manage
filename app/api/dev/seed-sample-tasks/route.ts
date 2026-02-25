import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const seedSchema = z.object({
    projectId: z.string().trim().min(1),
    replace: z.boolean().optional().default(true),
});

type SeedRequest = z.infer<typeof seedSchema>;

function buildSampleTasks(projectId: string) {
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const start1 = new Date(now.getTime() - 2 * dayMs);
    const end1 = new Date(now.getTime() + 2 * dayMs);
    const start2 = new Date(now.getTime() - 5 * dayMs);
    const end2 = new Date(now.getTime() - 1 * dayMs);
    const start3 = new Date(now.getTime() + 1 * dayMs);
    const end3 = new Date(now.getTime() + 7 * dayMs);

    return [
        {
            projectId,
            title: '[MẪU] Khảo sát hiện trạng',
            description: 'Thu thập thông tin hiện trạng, bản vẽ và các ràng buộc đầu vào.',
            startDate: start2,
            endDate: end2,
            status: 'COMPLETED',
            priority: 'MEDIUM',
            progress: 100,
            assignedTo: 'Nguyễn Văn An',
        },
        {
            projectId,
            title: '[MẪU] Lập kế hoạch triển khai',
            description: 'Xác định phạm vi, mốc tiến độ, phân công nguồn lực.',
            startDate: start1,
            endDate: end1,
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            progress: 45,
            assignedTo: 'Nguyễn Văn An',
        },
        {
            projectId,
            title: '[MẪU] Thiết lập template & chuẩn hóa naming',
            description: 'Chuẩn hóa cấu trúc thư mục, layer, naming, shared parameters.',
            startDate: start1,
            endDate: end3,
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            progress: 25,
            assignedTo: 'Trần Minh Khoa',
        },
        {
            projectId,
            title: '[MẪU] Dựng mô hình kiến trúc tầng 1',
            description: 'Dựng khối kiến trúc cơ bản, kiểm tra clash sơ bộ.',
            startDate: start3,
            endDate: end3,
            status: 'TODO',
            priority: 'HIGH',
            progress: 0,
            assignedTo: 'Lê Thu Hà',
        },
        {
            projectId,
            title: '[MẪU] Dựng mô hình kết cấu',
            description: 'Dựng cột/dầm/sàn theo hồ sơ thiết kế, kiểm tra giao cắt.',
            startDate: start3,
            endDate: end3,
            status: 'TODO',
            priority: 'MEDIUM',
            progress: 0,
            assignedTo: 'Nguyễn Văn An',
        },
        {
            projectId,
            title: '[MẪU] Dựng mô hình MEP',
            description: 'Bố trí hệ thống chính, đảm bảo cao độ và khoảng trống kỹ thuật.',
            startDate: start3,
            endDate: end3,
            status: 'TODO',
            priority: 'CRITICAL',
            progress: 0,
            assignedTo: 'Phạm Quốc Huy',
        },
        {
            projectId,
            title: '[MẪU] Coordination meeting',
            description: 'Họp phối hợp và cập nhật issue list.',
            startDate: start1,
            endDate: end1,
            status: 'DELAYED',
            priority: 'HIGH',
            progress: 60,
            assignedTo: 'Trần Minh Khoa',
        },
        {
            projectId,
            title: '[MẪU] Xuất bản vẽ & deliverables đợt 1',
            description: 'Xuất bản vẽ, IFC, báo cáo clash và checklist chất lượng.',
            startDate: end1,
            endDate: end3,
            status: 'TODO',
            priority: 'MEDIUM',
            progress: 0,
            assignedTo: null,
        },
        {
            projectId,
            title: '[MẪU] QC – kiểm tra lỗi mô hình',
            description: 'Kiểm tra tiêu chuẩn LOD/LOI, naming, tham số và lỗi hình học.',
            startDate: start1,
            endDate: end1,
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            progress: 30,
            assignedTo: 'Lê Thu Hà',
        },
        {
            projectId,
            title: '[MẪU] Tổng hợp báo cáo tiến độ tuần',
            description: 'Cập nhật tiến độ, rủi ro và đề xuất hành động tuần tới.',
            startDate: end1,
            endDate: end3,
            status: 'TODO',
            priority: 'LOW',
            progress: 0,
            assignedTo: null,
        },
    ];
}

export async function POST(request: NextRequest) {
    try {
        if (process.env.NODE_ENV !== 'development') {
            return NextResponse.json(
                { success: false, error: 'Not Found' },
                { status: 404 },
            );
        }

        const rawBody = (await request.json()) as unknown;
        const parsed = seedSchema.safeParse(rawBody);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Dữ liệu seed không hợp lệ', details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const body: SeedRequest = parsed.data;

        const project = await prisma.project.findUnique({
            where: { id: body.projectId },
            select: { id: true },
        });

        if (!project) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy dự án để tạo task mẫu' },
                { status: 404 },
            );
        }

        const sampleTasks = buildSampleTasks(body.projectId);

        const result = await prisma.$transaction(async (tx) => {
            if (body.replace) {
                await tx.task.deleteMany({
                    where: {
                        projectId: body.projectId,
                        title: { startsWith: '[MẪU]' },
                    },
                });
            }

            const created = await tx.task.createMany({
                data: sampleTasks,
            });

            return created.count;
        });

        return NextResponse.json({
            success: true,
            data: {
                createdCount: result,
                note: 'Task mẫu chỉ phục vụ local development (NODE_ENV=development).',
            },
        });
    } catch (error) {
        console.error('[DEV_SEED_SAMPLE_TASKS]:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tạo task mẫu',
                message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
            },
            { status: 500 },
        );
    }
}

