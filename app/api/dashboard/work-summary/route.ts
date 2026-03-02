import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ensureCoreSchema } from '@/lib/db-schema';
import { cache } from '@/lib/cache';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type RawTask = {
    id: string;
    projectId: string;
    title: string;
    status: string;
    priority: string;
    progress: number | null;
    assignedToId: string | null;
    assignee: { name: string } | null;
    phase: string | null;
    discipline: string | null;
    dueDate: Date | null;
    endDate: Date | null;
    project: {
        name: string;
        projectNo: string;
        status: string;
    };
};

type DashboardWorkSummaryTask = {
    id: string;
    projectId: string;
    title: string;
    projectName: string;
    projectNo: string;
    status: TaskStatus;
    priority: TaskPriority;
    progress: number;
    assignedToId: string | null;
    assignedToName: string | null;
    phase: string | null;
    discipline: string | null;
    dueDate: string | null;
    isOverdue: boolean;
};

type DashboardWorkSummary = {
    totalTasks: number;
    inProgress: number;
    completed: number;
    overdue: number;
    upcomingWithin7Days: number;
    tasks: DashboardWorkSummaryTask[];
};

async function ensureTaskSchema() {
    // Delegate to the centralized schema helper (PostgreSQL-compatible)
    await ensureCoreSchema();
}

function getEffectiveDueDate(task: Pick<RawTask, 'dueDate' | 'endDate'>): Date | null {
    const raw = task.dueDate ?? task.endDate;
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

function isTaskOverdue(task: RawTask, now: Date): boolean {
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

export async function GET(_request: NextRequest) {
    try {
        // Check cache first (30s TTL)
        const CACHE_KEY = 'dashboard:work-summary';
        const cached = cache.get(CACHE_KEY);
        if (cached) {
            return NextResponse.json({ success: true, data: cached, cached: true });
        }

        let tasks: RawTask[];

        try {
            tasks = (await prisma.task.findMany({
                where: {
                    // Chỉ lấy các dự án đang hoạt động hoặc lập kế hoạch cho báo cáo triển khai
                    project: {
                        status: {
                            in: ['PLANNING', 'ACTIVE'],
                        },
                    },
                },
                orderBy: { dueDate: 'asc' },
                select: {
                    id: true,
                    projectId: true,
                    title: true,
                    status: true,
                    priority: true,
                    progress: true,
                    assignedToId: true,
                    assignee: {
                        select: { name: true },
                    },
                    phase: true,
                    discipline: true,
                    dueDate: true,
                    endDate: true,
                    project: {
                        select: {
                            name: true,
                            projectNo: true,
                            status: true,
                        },
                    },
                },
            })) as unknown as RawTask[];
        } catch (innerError) {
            // Nếu bảng/column tasks chưa tồn tại (ví dụ deploy mới), tự tạo schema tối thiểu rồi thử lại
            if (
                innerError instanceof Prisma.PrismaClientKnownRequestError &&
                (innerError.code === 'P2021' || innerError.code === 'P2022')
            ) {
                await ensureTaskSchema();

                tasks = (await prisma.task.findMany({
                    where: {
                        project: {
                            status: {
                                in: ['PLANNING', 'ACTIVE'],
                            },
                        },
                    },
                    orderBy: { dueDate: 'asc' },
                    select: {
                        id: true,
                        projectId: true,
                        title: true,
                        status: true,
                        priority: true,
                        progress: true,
                        assignedToId: true,
                        assignee: {
                            select: { name: true },
                        },
                        phase: true,
                        discipline: true,
                        dueDate: true,
                        endDate: true,
                        project: {
                            select: {
                                name: true,
                                projectNo: true,
                                status: true,
                            },
                        },
                    },
                })) as unknown as RawTask[];
            } else {
                throw innerError;
            }
        }

        if (!tasks.length) {
            const empty: DashboardWorkSummary = {
                totalTasks: 0,
                inProgress: 0,
                completed: 0,
                overdue: 0,
                upcomingWithin7Days: 0,
                tasks: [],
            };

            return NextResponse.json({ success: true, data: empty });
        }

        const now = new Date();
        const msPerDay = 24 * 60 * 60 * 1000;

        let totalTasks = 0;
        let inProgress = 0;
        let completed = 0;
        let overdue = 0;
        let upcomingWithin7Days = 0;

        const enriched: (DashboardWorkSummaryTask & { dueDateObj: Date | null })[] = tasks.map((task) => {
            const due = getEffectiveDueDate(task);
            const overdueFlag = isTaskOverdue(task, now);

            totalTasks += 1;
            if (task.status === 'IN_PROGRESS') inProgress += 1;
            if (task.status === 'COMPLETED') completed += 1;
            if (overdueFlag) overdue += 1;

            if (due && !overdueFlag) {
                const diffDays = Math.floor((due.getTime() - now.getTime()) / msPerDay);
                if (diffDays >= 0 && diffDays <= 7) {
                    upcomingWithin7Days += 1;
                }
            }

            const safeStatus = (task.status as TaskStatus) || 'TODO';
            const safePriority = (task.priority as TaskPriority) || 'MEDIUM';

            return {
                id: task.id,
                projectId: task.projectId,
                title: task.title,
                projectName: task.project?.name ?? 'Không rõ dự án',
                projectNo: task.project?.projectNo ?? '',
                status: safeStatus,
                priority: safePriority,
                progress: typeof task.progress === 'number' ? task.progress : 0,
                assignedToId: task.assignedToId,
                assignedToName: task.assignee?.name ?? null,
                phase: task.phase,
                discipline: task.discipline,
                dueDate: due ? due.toISOString() : null,
                isOverdue: overdueFlag,
                dueDateObj: due,
            };
        });

        // Lọc ra top 10 công việc quan trọng: quá hạn hoặc sắp đến hạn trong 30 ngày
        const importantTasks = enriched
            .filter((task) => {
                if (!task.dueDateObj) return false;
                const diffDays = Math.floor((task.dueDateObj.getTime() - now.getTime()) / msPerDay);
                return task.isOverdue || diffDays <= 30;
            })
            .sort((a, b) => {
                const aTime = a.dueDateObj ? a.dueDateObj.getTime() : Number.MAX_SAFE_INTEGER;
                const bTime = b.dueDateObj ? b.dueDateObj.getTime() : Number.MAX_SAFE_INTEGER;
                return aTime - bTime;
            })
            .slice(0, 10)
            .map(({ dueDateObj: _ignore, ...rest }) => rest);

        const summary: DashboardWorkSummary = {
            totalTasks,
            inProgress,
            completed,
            overdue,
            upcomingWithin7Days,
            tasks: importantTasks,
        };

        // Cache for 30 seconds
        cache.set(CACHE_KEY, summary, 30000);

        return NextResponse.json({
            success: true,
            data: summary,
        });
    } catch (error: unknown) {
        console.error('Failed to build dashboard work summary:', error);

        // Fallback mềm: không chặn toàn bộ Dashboard nếu module công việc có vấn đề
        return NextResponse.json(
            {
                success: true,
                data: {
                    totalTasks: 0,
                    inProgress: 0,
                    completed: 0,
                    overdue: 0,
                    upcomingWithin7Days: 0,
                    tasks: [],
                } satisfies DashboardWorkSummary,
                warning:
                    process.env.NODE_ENV === 'development'
                        ? error instanceof Error
                            ? error.message
                            : String(error)
                        : 'Đã xảy ra lỗi khi tải báo cáo công việc. Hệ thống đang hiển thị số liệu 0 để tránh gián đoạn màn hình Tổng quan.',
            },
            { status: 200 },
        );
    }
}

