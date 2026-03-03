import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureCoreSchema } from '@/lib/db-schema';

const seedSchema = z.object({
    projectId: z.string().trim().min(1),
    replace: z.boolean().optional().default(true),
});

type SeedRequest = z.infer<typeof seedSchema>;

async function ensureTaskSchema() {
    // Delegate to the centralized schema helper (PostgreSQL-compatible)
    await ensureCoreSchema();
}

function escapeSqlString(input: string) {
    return input.replace(/'/g, "''");
}

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
            description:
                'Thu thập thông tin hiện trạng, bản vẽ và các ràng buộc đầu vào.\n\nChecklist:\n- [ ] Thu thập bản vẽ hiện trạng\n- [ ] Chụp hình hiện trường\n- [ ] Ghi nhận ràng buộc kỹ thuật chính',
            startDate: start2,
            endDate: end2,
            dueDate: end2,
            status: 'COMPLETED',
            priority: 'MEDIUM',
            progress: 100,
            assignedToId: null,
            order: 0,
            phase: 'Khảo sát',
            discipline: 'ARC',
            location: 'Hiện trường',
        },
        {
            projectId,
            title: '[MẪU] Lập kế hoạch triển khai',
            description:
                'Xác định phạm vi, mốc tiến độ, phân công nguồn lực.\n\nChecklist:\n- [ ] Chốt phạm vi deliverables\n- [ ] Lập timeline chính\n- [ ] Gán người phụ trách từng giai đoạn',
            startDate: start1,
            endDate: end1,
            dueDate: end1,
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            progress: 45,
            assignedToId: null,
            order: 1,
            phase: 'Lập kế hoạch',
            discipline: 'OTHER',
            location: null,
        },
        {
            projectId,
            title: '[MẪU] Thiết lập template & chuẩn hóa naming',
            description:
                'Chuẩn hóa cấu trúc thư mục, layer, naming, shared parameters.\n\nChecklist:\n- [ ] Tạo thư mục dự án chuẩn\n- [ ] Thiết lập template Revit/CAD\n- [ ] Chốt quy tắc đặt tên (naming convention)',
            startDate: start1,
            endDate: end3,
            dueDate: end3,
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            progress: 25,
            assignedToId: null,
            order: 2,
            phase: 'Thiết kế',
            discipline: 'OTHER',
            location: null,
        },
        {
            projectId,
            title: '[MẪU] Dựng mô hình kiến trúc tầng 1',
            description:
                'Dựng khối kiến trúc cơ bản, kiểm tra clash sơ bộ.\n\nChecklist:\n- [ ] Dựng massing tổng thể\n- [ ] Dựng tường, sàn, cửa đi/cửa sổ\n- [ ] Chạy clash sơ bộ với kết cấu',
            startDate: start3,
            endDate: end3,
            dueDate: end3,
            status: 'TODO',
            priority: 'HIGH',
            progress: 0,
            assignedToId: null,
            order: 3,
            phase: 'Thiết kế',
            discipline: 'ARC',
            location: 'Tầng 1',
        },
        {
            projectId,
            title: '[MẪU] Dựng mô hình kết cấu',
            description:
                'Dựng cột/dầm/sàn theo hồ sơ thiết kế, kiểm tra giao cắt.\n\nChecklist:\n- [ ] Nhập lưới trục\n- [ ] Dựng cột & dầm chính\n- [ ] Kiểm tra giao cắt với kiến trúc',
            startDate: start3,
            endDate: end3,
            dueDate: end3,
            status: 'TODO',
            priority: 'MEDIUM',
            progress: 0,
            assignedToId: null,
            order: 4,
            phase: 'Thiết kế',
            discipline: 'STR',
            location: 'Toàn bộ',
        },
        {
            projectId,
            title: '[MẪU] Dựng mô hình MEP',
            description:
                'Bố trí hệ thống chính, đảm bảo cao độ và khoảng trống kỹ thuật.\n\nChecklist:\n- [ ] Dựng ống gió chính\n- [ ] Dựng ống nước & thoát nước\n- [ ] Kiểm tra cao độ với kết cấu',
            startDate: start3,
            endDate: end3,
            dueDate: end3,
            status: 'TODO',
            priority: 'CRITICAL',
            progress: 0,
            assignedToId: null,
            order: 5,
            phase: 'Thiết kế',
            discipline: 'MEP',
            location: 'Toàn bộ',
        },
        {
            projectId,
            title: '[MẪU] Coordination meeting',
            description:
                'Họp phối hợp và cập nhật issue list.\n\nChecklist:\n- [ ] Chuẩn bị agenda cuộc họp\n- [ ] Chia sẻ mô hình & bản vẽ mới nhất\n- [ ] Cập nhật issue list sau cuộc họp',
            startDate: start1,
            endDate: end1,
            dueDate: end1,
            status: 'DELAYED',
            priority: 'HIGH',
            progress: 60,
            assignedToId: null,
            order: 6,
            phase: 'Phối hợp',
            discipline: 'OTHER',
            location: null,
        },
        {
            projectId,
            title: '[MẪU] Xuất bản vẽ & deliverables đợt 1',
            description:
                'Xuất bản vẽ, IFC, báo cáo clash và checklist chất lượng.\n\nChecklist:\n- [ ] Kiểm tra lại title block & thông tin dự án\n- [ ] Xuất bộ bản vẽ PDF/DWG\n- [ ] Export mô hình IFC & báo cáo clash',
            startDate: end1,
            endDate: end3,
            dueDate: end3,
            status: 'TODO',
            priority: 'MEDIUM',
            progress: 0,
            assignedToId: null,
            order: 7,
            phase: 'Xuất bản vẽ',
            discipline: 'OTHER',
            location: null,
        },
        {
            projectId,
            title: '[MẪU] QC – kiểm tra lỗi mô hình',
            description:
                'Kiểm tra tiêu chuẩn LOD/LOI, naming, tham số và lỗi hình học.\n\nChecklist:\n- [ ] Kiểm tra đầy đủ LOD/LOI theo phase\n- [ ] Quét lỗi naming & tham số thiếu\n- [ ] Kiểm tra các lỗi hình học lớn',
            startDate: start1,
            endDate: end1,
            dueDate: end1,
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            progress: 30,
            assignedToId: null,
            order: 8,
            phase: 'QC',
            discipline: 'OTHER',
            location: null,
        },
        {
            projectId,
            title: '[MẪU] Tổng hợp báo cáo tiến độ tuần',
            description:
                'Cập nhật tiến độ, rủi ro và đề xuất hành động tuần tới.\n\nChecklist:\n- [ ] Thu thập % hoàn thành từ các task\n- [ ] Cập nhật rủi ro & vướng mắc chính\n- [ ] Đề xuất hành động tuần tới cho PM',
            startDate: end1,
            endDate: end3,
            dueDate: end3,
            status: 'TODO',
            priority: 'LOW',
            progress: 0,
            assignedToId: null,
            order: 9,
            phase: 'Báo cáo',
            discipline: 'OTHER',
            location: null,
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

        // Đảm bảo bảng tasks tồn tại (tránh trường hợp chưa từng mở tab công việc)
        try {
            await ensureTaskSchema();
            console.log('[DEV_SEED_SAMPLE_TASKS] Schema đã được đảm bảo');
        } catch (schemaError) {
            console.error('[DEV_SEED_SAMPLE_TASKS] ensureTaskSchema failed:', schemaError);
            // Vẫn tiếp tục, có thể bảng đã tồn tại
        }

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
        console.log(`[DEV_SEED_SAMPLE_TASKS] Bắt đầu tạo ${sampleTasks.length} task mẫu cho project ${body.projectId}`);

        // Nếu replace, xóa task mẫu cũ trước bằng raw SQL (không phụ thuộc Prisma model "task")
        if (body.replace) {
            const escapedProjectId = escapeSqlString(body.projectId);
            const deleted = await prisma.$executeRawUnsafe(
                `DELETE FROM tasks WHERE "projectId" = '${escapedProjectId}' AND title LIKE '[MẪU]%'`,
            );
            console.log(`[DEV_SEED_SAMPLE_TASKS] Đã xóa ${deleted} task mẫu cũ`);
        }

        // Dùng raw SQL để tránh phụ thuộc Prisma model khi DB chưa migrate.
        let createdCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < sampleTasks.length; i++) {
            const taskData = sampleTasks[i];
            try {
                // Generate UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
                const generateUUID = () => {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                        const r = (Math.random() * 16) | 0;
                        const v = c === 'x' ? r : (r & 0x3) | 0x8;
                        return v.toString(16);
                    });
                };
                const taskId = generateUUID();
                const startDateStr = taskData.startDate ? `'${taskData.startDate.toISOString()}'` : 'NULL';
                const endDateStr = taskData.endDate ? `'${taskData.endDate.toISOString()}'` : 'NULL';
                const descriptionStr = taskData.description ? `'${taskData.description.replace(/'/g, "''")}'` : 'NULL';
                const assignedToIdStr = 'NULL';
                const titleStr = taskData.title.replace(/'/g, "''");
                const dueDateStr = taskData.dueDate ? `'${taskData.dueDate.toISOString()}'` : 'NULL';
                const phaseStr = taskData.phase ? `'${escapeSqlString(taskData.phase)}'` : 'NULL';
                const disciplineStr = taskData.discipline ? `'${escapeSqlString(taskData.discipline)}'` : 'NULL';
                const locationStr = taskData.location ? `'${escapeSqlString(taskData.location)}'` : 'NULL';

                await prisma.$executeRawUnsafe(`
                    INSERT INTO tasks (
                        id, "projectId", title, description,
                        "startDate", "endDate", "dueDate", phase, discipline, location,
                        status, priority, progress, "assignedToId", "order", "parentId",
                        "createdAt", "updatedAt"
                    ) VALUES (
                        '${taskId}',
                        '${escapeSqlString(taskData.projectId)}',
                        '${titleStr}',
                        ${descriptionStr},
                        ${startDateStr},
                        ${endDateStr},
                        ${dueDateStr},
                        ${phaseStr},
                        ${disciplineStr},
                        ${locationStr},
                        '${taskData.status}',
                        '${taskData.priority}',
                        ${taskData.progress},
                        ${assignedToIdStr},
                        ${taskData.order},
                        NULL,
                        NOW(),
                        NOW()
                    )
                `);
                createdCount++;
                console.log(`[DEV_SEED_SAMPLE_TASKS] ✓ Đã tạo task ${i + 1}/${sampleTasks.length}: "${taskData.title}" (ID: ${taskId})`);
            } catch (taskError: unknown) {
                const errorMsg = taskError instanceof Error ? taskError.message : String(taskError);
                errors.push(`Task "${taskData.title}": ${errorMsg}`);
                console.error(`[DEV_SEED_SAMPLE_TASKS] ✗ Không thể tạo task ${i + 1}/${sampleTasks.length} "${taskData.title}":`, taskError);
                if (taskError instanceof Error && taskError.stack) {
                    console.error(`[DEV_SEED_SAMPLE_TASKS] Stack trace:`, taskError.stack);
                }
            }
        }

        if (errors.length > 0) {
            console.warn(`[DEV_SEED_SAMPLE_TASKS] ${errors.length} task không tạo được:`, errors);
        } else {
            console.log(`[DEV_SEED_SAMPLE_TASKS] ✓ Đã tạo thành công tất cả ${createdCount} task mẫu`);
        }

        return NextResponse.json({
            success: true,
            data: {
                createdCount,
                errors: errors.length > 0 ? errors : undefined,
                note:
                    errors.length > 0
                        ? `Đã tạo ${createdCount}/10 task. Một số task không tạo được (xem errors).`
                        : `Đã tạo ${createdCount} task mẫu thành công.`,
            },
        });
    } catch (error) {
        console.error('[DEV_SEED_SAMPLE_TASKS] Unexpected error:', error);
        
        // Nếu lỗi do bảng/cột chưa tồn tại, thử ensure schema để lần sau chạy được
        let isSchemaError = false;
        try {
            if (error && typeof error === 'object' && 'code' in error) {
                const prismaError = error as { code?: string };
                if (prismaError.code === 'P2021' || prismaError.code === 'P2022') {
                    isSchemaError = true;
                    try {
                        await ensureTaskSchema();
                        console.log('[DEV_SEED_SAMPLE_TASKS] Schema đã được tạo, vui lòng thử lại');
                    } catch (schemaError) {
                        console.error('[DEV_SEED_SAMPLE_TASKS] Không thể tạo schema:', schemaError);
                    }
                }
            }
        } catch {
            // ignore error checking
        }
        
        const errorMessage =
            error instanceof Error
                ? error.message
                : typeof error === 'string'
                  ? error
                  : 'Lỗi không xác định';
        
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tạo task mẫu',
                message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
                details: process.env.NODE_ENV === 'development' 
                    ? { 
                        stack: error instanceof Error ? error.stack : undefined,
                        isSchemaError,
                        hint: isSchemaError ? 'Schema đã được tạo, vui lòng thử lại' : undefined
                    } 
                    : undefined,
            },
            { status: 500 },
        );
    }
}

