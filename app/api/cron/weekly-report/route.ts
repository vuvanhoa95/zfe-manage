import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  sendWeeklyReportEmail, 
  getAdminEmails, 
  buildDashboardUrl 
} from '@/lib/email/send';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Check for CRON_SECRET to secure the endpoint
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Calculate last week's range
    const lastWeek = subWeeks(new Date(), 1);
    const weekStart = startOfWeek(lastWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(lastWeek, { weekStartsOn: 1 });

    const weekStartStr = format(weekStart, 'dd/MM/yyyy');
    const weekEndStr = format(weekEnd, 'dd/MM/yyyy');

    // Fetch data for the report
    const [
      quotationsCreatedCount,
      quotationsAcceptedCount,
      acceptedQuotationsData,
      activeProjectsCount
    ] = await Promise.all([
      // Count quotations created last week
      prisma.quotation.count({
        where: {
          createdAt: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      }),
      // Count quotations accepted last week
      prisma.quotation.count({
        where: {
          status: 'ACCEPTED',
          updatedAt: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      }),
      // Get revenue/profit from accepted quotations
      prisma.quotation.findMany({
        where: {
          status: 'ACCEPTED',
          updatedAt: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        select: {
          totalAfterVat: true,
          totalBeforeVat: true,
          outsourceCost: true,
          taxCost: true,
          commissionCost: true,
        },
      }),
      // Count active projects
      prisma.project.count({
        where: {
          status: 'IN_PROGRESS',
        },
      }),
    ]);

    // Calculate totals
    let totalRevenue = 0;
    let totalCosts = 0;

    acceptedQuotationsData.forEach((q: { totalAfterVat: number | null; outsourceCost: number | null; taxCost: number | null; commissionCost: number | null }) => {
      totalRevenue += q.totalAfterVat || 0;
      totalCosts += (q.outsourceCost || 0) + (q.taxCost || 0) + (q.commissionCost || 0);
    });

    const totalProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Send email to admins
    const admins = await getAdminEmails();
    if (admins.length > 0) {
      await sendWeeklyReportEmail({
        to: admins,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        totalRevenue,
        totalProfit,
        profitMargin,
        quotationsCreated: quotationsCreatedCount,
        quotationsAccepted: quotationsAcceptedCount,
        projectsActive: activeProjectsCount,
        dashboardUrl: buildDashboardUrl(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly report cron executed successfully',
      data: {
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        stats: {
          totalRevenue,
          totalProfit,
          profitMargin,
          quotationsCreated: quotationsCreatedCount,
          quotationsAccepted: quotationsAcceptedCount,
          projectsActive: activeProjectsCount,
        }
      }
    });
  } catch (error: any) {
    console.error('Weekly report cron failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute weekly report cron',
      details: error.message
    }, { status: 500 });
  }
}
