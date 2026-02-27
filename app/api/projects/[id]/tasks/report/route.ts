import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from '@/lib/validation/task';
import { getCurrentUser, getProjectMemberRole } from '@/lib/project-permissions';
import { canViewReport } from '@/lib/permissions';
import { reportLogger } from '@/lib/logging';

const reportQuerySchema = z.object({
    groupBy: z.enum(['phase', 'discipline', 'assignee'] as const),
    datePreset: z.enum(['all', 'thisMonth', 'thisQuarter'] as const).default('all'),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
});

type ReportTask = {
    id: string;
    status: TaskStatus;
    priority: TaskPriority;
    progress: number;
    phase: string | null;
    discipline: string | null;
    assignedTo: string | null;
    dueDate: Date | null;
    endDate: Date | null;
};

type GroupRow = {
    key: string;
    label: string;
    total: number;
    inProgress: number;
    completed: number;
    overdue: number;
    percentCompleted: number;
};

async function ensureTaskSchema() {
    // Tạo bảng tasks và index tối thiểu nếu chưa tồn tại (Postgres)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "tasks" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "projectId" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "description" TEXT,
            "startDate" TIMESTAMP,
            "endDate" TIMESTAMP,
            "dueDate" TIMESTAMP,
            "status" TEXT NOT NULL DEFAULT 'TODO',
            "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
            "progress" INTEGER NOT NULL DEFAULT 0,
            "assignedTo" TEXT,
            "phase" TEXT,
            "discipline" TEXT,
            "location" TEXT,
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS "tasks_projectId_idx" ON "tasks"("projectId");
        CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks"("status");
        CREATE INDEX IF NOT EXISTS "tasks_priority_idx" ON "tasks"("priority");
        CREATE INDEX IF NOT EXISTS "tasks_assignedTo_idx" ON "tasks"("assignedTo");
        CREATE INDEX IF NOT EXISTS "tasks_phase_idx" ON "tasks"("phase");
        CREATE INDEX IF NOT EXISTS "tasks_dueDate_idx" ON "tasks"("dueDate");
    `);
}

function getEffectiveDueDate(task: ReportTask): Date | null {
    const raw = task.dueDate ?? task.endDate;
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

function isTaskOverdue(task: ReportTask, now: Date): boolean {
    const due = getEffectiveDueDate(task);
    if (!due) return false;
    if (task.status === 'COMPLETED') return false;

    const toYmd = (d: Date) => [d.getFullYear(), d.getMonth(), d.getDate()] as const;
    const [y1, m1, d1] = toYmd(due);
    const [y2, m2, d2] = toYmd(now);

    if (y1 < y2) return true;
    if (y1 > y2) return false;
    if (m1 < m2) return true;
    if (m1 > m2) return false;
    return d1 < d2;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } },
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const projectId = resolvedParams.id;

        // Check permissions
        const user = await getCurrentUser();
        if (!user) {
            reportLogger.accessDenied(undefined, projectId);
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const projectMemberRole = await getProjectMemberRole(user.id, projectId);
        if (!canViewReport(user.role, projectMemberRole)) {
            reportLogger.accessDenied(user.id, projectId);
            return NextResponse.json(
                { success: false, error: 'Bạn không có quyền xem báo cáo này' },
                { status: 403 },
            );
        }

        // Cache response for 30 seconds to reduce database load
        const cacheHeaders = {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        };

        const { searchParams } = new URL(request.url);
        const parsed = reportQuerySchema.safeParse({
            groupBy: searchParams.get('groupBy') ?? undefined,
            datePreset: searchParams.get('datePreset') ?? undefined,
            status: searchParams.get('status') ?? undefined,
            priority: searchParams.get('priority') ?? undefined,
        });

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Tham số báo cáo công việc không hợp lệ',
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const { groupBy, datePreset, status, priority } = parsed.data;

        const where: { projectId: string; status?: string; priority?: string } = {
            projectId,
        };

        if (status) {
            where.status = status;
        }

        if (priority) {
            where.priority = priority;
        }

        let tasks: ReportTask[];
        try {
            const rawTasks = await prisma.task.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    status: true,
                    priority: true,
                    progress: true,
                    phase: true,
                    discipline: true,
                    assignedTo: true,
                    dueDate: true,
                    endDate: true,
                },
            });

            tasks = rawTasks as unknown as ReportTask[];
        } catch (innerError) {
            // Nếu bảng/column tasks chưa tồn tại (chưa migrate DB),
            // cố gắng tạo schema tối thiểu và thử lại.
            if (
                innerError instanceof Prisma.PrismaClientKnownRequestError &&
                (innerError.code === 'P2021' || innerError.code === 'P2022')
            ) {
                console.warn('Task schema missing on REPORT, attempting to create tasks table on-the-fly...');
                await ensureTaskSchema();

                const rawTasks = await prisma.task.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        status: true,
                        priority: true,
                        progress: true,
                        phase: true,
                        discipline: true,
                        assignedTo: true,
                        dueDate: true,
                        endDate: true,
                    },
                });

                tasks = rawTasks as unknown as ReportTask[];
            } else {
                throw innerError;
            }
        }

        const now = new Date();
        const nowYear = now.getFullYear();
        const nowMonth = now.getMonth();
        const quarterStartMonth = Math.floor(nowMonth / 3) * 3;

        const inDatePreset = (task: ReportTask): boolean => {
            if (datePreset === 'all') return true;
            const due = getEffectiveDueDate(task);
            if (!due) return true;

            if (datePreset === 'thisMonth') {
                return due.getFullYear() === nowYear && due.getMonth() === nowMonth;
            }

            // thisQuarter
            return (
                due.getFullYear() === nowYear &&
                due.getMonth() >= quarterStartMonth &&
                due.getMonth() <= quarterStartMonth + 2
            );
        };

        const asReportTasks: ReportTask[] = tasks.map((task) => ({
            id: task.id,
            status: task.status as TaskStatus,
            priority: task.priority as TaskPriority,
            progress: task.progress ?? 0,
            phase: typeof task.phase === 'string' ? task.phase : null,
            discipline: typeof task.discipline === 'string' ? task.discipline : null,
            assignedTo: typeof task.assignedTo === 'string' ? task.assignedTo : null,
            dueDate: task.dueDate ?? null,
            endDate: task.endDate ?? null,
        }));

        const filtered = asReportTasks.filter(inDatePreset);

        const map = new Map<string, GroupRow>();

        const getKeyAndLabel = (task: ReportTask): { key: string; label: string } => {
            if (groupBy === 'phase') {
                const raw = (task.phase ?? '').trim() || 'Khác';
                return { key: raw, label: raw };
            }
            if (groupBy === 'discipline') {
                const raw = (task.discipline ?? '').trim() || 'Khác';
                return { key: raw, label: raw };
            }
            const raw = (task.assignedTo ?? '').trim() || 'Chưa phân công';
            return { key: raw, label: raw };
        };

        filtered.forEach((task) => {
            const { key, label } = getKeyAndLabel(task);
            const existed =
                map.get(key) ?? {
                    key,
                    label,
                    total: 0,
                    inProgress: 0,
                    completed: 0,
                    overdue: 0,
                    percentCompleted: 0,
                };

            existed.total += 1;
            if (task.status === 'IN_PROGRESS') existed.inProgress += 1;
            if (task.status === 'COMPLETED') existed.completed += 1;
            if (isTaskOverdue(task, now)) existed.overdue += 1;

            map.set(key, existed);
        });

        const groups: GroupRow[] = Array.from(map.values())
            .map((row) => ({
                ...row,
                percentCompleted: row.total === 0 ? 0 : Math.round((row.completed / row.total) * 100),
            }))
            .sort((a, b) => b.total - a.total); // Sort by total descending

        // Limit to max 100 groups to prevent performance issues
        const MAX_GROUPS = 100;
        const limitedGroups = groups.slice(0, MAX_GROUPS);
        const hasMore = groups.length > MAX_GROUPS;

        return NextResponse.json(
            {
                success: true,
                data: {
                    groups: limitedGroups,
                    totalGroups: groups.length,
                    hasMore,
                    ...(hasMore && {
                        message: `Hiển thị ${MAX_GROUPS} nhóm đầu tiên trong tổng số ${groups.length} nhóm. Vui lòng sử dụng bộ lọc để thu hẹp kết quả.`,
                    }),
                },
            },
            { headers: cacheHeaders },
        );
    } catch (error) {
        const resolvedParams = params instanceof Promise ? await params : params;
        const projectId = resolvedParams.id;
        const user = await getCurrentUser();

        reportLogger.fetchError(error, projectId, user?.id);

        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tạo báo cáo công việc',
                details: process.env.NODE_ENV === 'development' ? { message: (error as Error).message } : undefined,
            },
            { status: 500 },
        );
    }
}

