import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, isPast, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { withSchemaCheck, isMissingTableError } from '@/lib/db-schema';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const alerts: Array<{
      id: string;
      type: 'deadline' | 'overdue' | 'low-cash' | 'pending-quotation';
      title: string;
      message: string;
      link?: string;
      severity: 'high' | 'medium' | 'low';
      date?: Date;
    }> = [];

    // 1. Check upcoming deadlines (next 7 days)
    const sevenDaysFromNow = addDays(new Date(), 7);
    const projectsWithDeadlines = await withSchemaCheck(
      () => prisma.project.findMany({
      where: {
        endDate: {
          gte: new Date(),
          lte: sevenDaysFromNow,
        },
        status: {
          in: ['PLANNING', 'IN_PROGRESS'],
        },
      },
      select: {
        id: true,
        projectNo: true,
        name: true,
        endDate: true,
      },
      orderBy: {
        endDate: 'asc',
      },
      }),
      [] // fallback: empty array nếu table không tồn tại
    );

    projectsWithDeadlines.forEach((project: { id: string; projectNo: string; name: string; endDate: Date | null }) => {
      if (!project.endDate) return;
      
      const daysRemaining = Math.ceil(
        (project.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      alerts.push({
        id: `deadline-${project.id}`,
        type: 'deadline',
        title: `Deadline sắp đến: ${project.projectNo}`,
        message: `Dự án "${project.name}" còn ${daysRemaining} ngày`,
        link: `/projects/${project.id}`,
        severity: daysRemaining <= 3 ? 'high' : daysRemaining <= 5 ? 'medium' : 'low',
        date: project.endDate,
      });
    });

    // 2. Check overdue projects
    const overdueProjects = await withSchemaCheck(
      () => prisma.project.findMany({
      where: {
        endDate: {
          lt: new Date(),
        },
        status: {
          in: ['PLANNING', 'IN_PROGRESS'],
        },
      },
      select: {
        id: true,
        projectNo: true,
        name: true,
        endDate: true,
      },
      take: 5,
      orderBy: {
        endDate: 'desc',
      },
      }),
      [] // fallback: empty array nếu table không tồn tại
    );

    overdueProjects.forEach((project: { id: string; projectNo: string; name: string; endDate: Date | null }) => {
      if (!project.endDate) return;

      const daysOverdue = Math.ceil(
        (new Date().getTime() - project.endDate.getTime()) / (1000 * 60 * 60 * 24)
      );

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

    // 3. Check low cash flow (< 10M VND)
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const cashFlowSummary = await withSchemaCheck(
      () => prisma.cashFlow.groupBy({
      by: ['type'],
      where: {
        date: {
          gte: startOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
      }),
      [] // fallback: empty array nếu table không tồn tại
    );

    const revenue = cashFlowSummary.find((cf: { type: string; _sum: { amount: number | null } }) => cf.type === 'REVENUE')?._sum.amount || 0;
    const expense = cashFlowSummary.find((cf: { type: string; _sum: { amount: number | null } }) => cf.type === 'EXPENSE')?._sum.amount || 0;
    const netCashFlow = revenue - expense;

    if (netCashFlow < 10000000) {
      alerts.push({
        id: 'low-cash-flow',
        type: 'low-cash',
        title: 'Dòng tiền thấp',
        message: `Dòng tiền tháng này: ${new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(netCashFlow)}`,
        link: '/dashboard',
        severity: netCashFlow < 0 ? 'high' : 'medium',
      });
    }

    // 4. Check pending quotations (DRAFT status > 7 days old)
    const sevenDaysAgo = addDays(new Date(), -7);
    const pendingQuotations = await withSchemaCheck(
      () => prisma.quotation.findMany({
      where: {
        status: 'DRAFT',
        createdAt: {
          lt: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        quotationNo: true,
        projectName: true,
        createdAt: true,
      },
      take: 5,
      orderBy: {
        createdAt: 'asc',
      },
      }),
      [] // fallback: empty array nếu table không tồn tại
    );

    pendingQuotations.forEach((quotation: { id: string; quotationNo: string; projectName: string | null; createdAt: Date }) => {
      const daysOld = Math.ceil(
        (new Date().getTime() - quotation.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      alerts.push({
        id: `pending-${quotation.id}`,
        type: 'pending-quotation',
        title: `Báo giá chưa hoàn thành: ${quotation.quotationNo}`,
        message: `"${quotation.projectName}" đã tạo ${daysOld} ngày trước`,
        link: `/quotations/${quotation.id}`,
        severity: daysOld > 14 ? 'high' : 'medium',
        date: quotation.createdAt,
      });
    });

    // Sort alerts by severity (high -> medium -> low)
    const severityOrder = { high: 0, medium: 1, low: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return NextResponse.json({
      alerts,
      count: alerts.length,
    });
  } catch (error: unknown) {
    console.error('Error fetching alerts:', error);
    
    // Nếu là lỗi "table does not exist", trả về empty alerts thay vì 500
    if (isMissingTableError(error)) {
      return NextResponse.json({
        alerts: [],
        count: 0,
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
