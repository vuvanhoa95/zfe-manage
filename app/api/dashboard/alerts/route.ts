import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';
import { withSchemaCheck, isMissingTableError } from '@/lib/db-schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as any)?.role === 'ADMIN';
    const currentUserId = (session?.user as any)?.id;

    const alerts: Array<{
      id: string;
      type: 'deadline' | 'overdue' | 'low-cash' | 'pending-quotation' | 'pending-user' | 'task-due';
      title: string;
      message: string;
      link?: string;
      severity: 'high' | 'medium' | 'low';
      date?: Date;
    }> = [];

    // ─── 1. Tài khoản PENDING chờ duyệt (chỉ admin thấy) ───────────────────
    if (isAdmin) {
      const pendingUsers = await withSchemaCheck(
        () => prisma.user.findMany({
          where: { status: 'PENDING' },
          select: { id: true, name: true, email: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
          take: 10,
        }),
        []
      );

      if (pendingUsers.length > 0) {
        alerts.push({
          id: 'pending-users-summary',
          type: 'pending-user',
          title: `${pendingUsers.length} tài khoản chờ duyệt`,
          message: pendingUsers.length === 1
            ? `${(pendingUsers as any)[0].name || (pendingUsers as any)[0].email} đang chờ phê duyệt`
            : `${(pendingUsers as any[]).map((u) => u.name || u.email).slice(0, 2).join(', ')}${pendingUsers.length > 2 ? ` và ${pendingUsers.length - 2} người khác` : ''} đang chờ phê duyệt`,
          link: '/users',
          severity: pendingUsers.length >= 3 ? 'high' : 'medium',
        });
      }
    }

    // ─── 2. Task đến hạn trong 2 ngày tới ─────────────────────────────────────
    const twoDaysFromNow = addDays(new Date(), 2);
    const taskWhere: any = {
      dueDate: {
        gte: new Date(),
        lte: twoDaysFromNow,
      },
      status: { notIn: ['DONE', 'CANCELLED'] },
    };
    // Không phải admin → chỉ thấy task của mình
    if (!isAdmin && currentUserId) {
      taskWhere.assignedToId = currentUserId;
    }

    const urgentTasks = await withSchemaCheck(
      () => prisma.task.findMany({
        where: taskWhere,
        select: {
          id: true,
          title: true,
          dueDate: true,
          status: true,
          project: { select: { id: true, projectNo: true, name: true } },
          assignee: { select: { name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      []
    );

    (urgentTasks as any[]).forEach((task) => {
      if (!task.dueDate) return;
      const hoursLeft = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60));
      const daysLeft = Math.ceil(hoursLeft / 24);
      const timeLabel = hoursLeft <= 24 ? `${hoursLeft} giờ nữa` : `${daysLeft} ngày nữa`;

      alerts.push({
        id: `task-due-${task.id}`,
        type: 'task-due',
        title: `Task đến hạn: ${timeLabel}`,
        message: `${task.title}${task.project ? ` — ${task.project.projectNo}` : ''}${task.assignee ? ` (${task.assignee.name})` : ''}`,
        link: task.project ? `/projects/${task.project.id}` : undefined,
        severity: hoursLeft <= 24 ? 'high' : 'medium',
        date: task.dueDate,
      });
    });

    // ─── 3. Deadline dự án sắp đến (7 ngày) ──────────────────────────────────
    const sevenDaysFromNow = addDays(new Date(), 7);
    const projectsWithDeadlines = await withSchemaCheck(
      () => prisma.project.findMany({
        where: {
          endDate: { gte: new Date(), lte: sevenDaysFromNow },
          status: { in: ['PLANNING', 'IN_PROGRESS', 'ACTIVE'] },
        },
        select: { id: true, projectNo: true, name: true, endDate: true },
        orderBy: { endDate: 'asc' },
      }),
      []
    );

    (projectsWithDeadlines as any[]).forEach((project) => {
      if (!project.endDate) return;
      const daysRemaining = Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `deadline-${project.id}`,
        type: 'deadline',
        title: `Deadline sắp đến: ${project.projectNo}`,
        message: `"${project.name}" còn ${daysRemaining} ngày`,
        link: `/projects/${project.id}`,
        severity: daysRemaining <= 3 ? 'high' : daysRemaining <= 5 ? 'medium' : 'low',
        date: project.endDate,
      });
    });

    // ─── 4. Dự án quá hạn ────────────────────────────────────────────────────
    const overdueProjects = await withSchemaCheck(
      () => prisma.project.findMany({
        where: {
          endDate: { lt: new Date() },
          status: { in: ['PLANNING', 'IN_PROGRESS', 'ACTIVE'] },
        },
        select: { id: true, projectNo: true, name: true, endDate: true },
        take: 5,
        orderBy: { endDate: 'desc' },
      }),
      []
    );

    (overdueProjects as any[]).forEach((project) => {
      if (!project.endDate) return;
      const daysOverdue = Math.ceil((Date.now() - new Date(project.endDate).getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `overdue-${project.id}`,
        type: 'overdue',
        title: `Dự án quá hạn: ${project.projectNo}`,
        message: `"${project.name}" đã quá hạn ${daysOverdue} ngày`,
        link: `/projects/${project.id}`,
        severity: 'high',
        date: project.endDate,
      });
    });

    // Sort: high → medium → low
    const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return NextResponse.json({ alerts, count: alerts.length });
  } catch (error: unknown) {
    console.error('Error fetching alerts:', error);
    if (isMissingTableError(error)) {
      return NextResponse.json({ alerts: [], count: 0 });
    }
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}
