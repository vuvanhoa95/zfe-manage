import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache, cacheKeys } from '@/lib/cache';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const statusFilter = searchParams.get('status'); // Optional: filter by status (ACCEPTED, SENT, etc.)

        // Check cache first
        const cacheKey = cacheKeys.dashboardStats(statusFilter || undefined);
        const cached = cache.get(cacheKey);
        if (cached) {
            return NextResponse.json({ success: true, data: cached, cached: true });
        }

        // Build where clause
        const where: any = {};
        if (statusFilter) {
            where.status = statusFilter;
        }

        // Financials must come from FINAL quotations only (Project.finalQuotationId)
        // Optimize: Only select needed fields and limit to recent projects
        const projects = await prisma.project.findMany({
            where: {
                // Chỉ tính các dự án có báo giá chốt
                finalQuotationId: { not: null },
                // Và chỉ lấy các dự án đang thực hiện hoặc đã hoàn thành
                status: {
                    in: ['ACTIVE', 'COMPLETED'],
                },
            },
            select: {
                id: true,
                customer: { select: { name: true } },
                finalQuotation: {
                    select: {
                        id: true,
                        quotationNo: true,
                        projectName: true,
                        date: true,
                        status: true,
                        totalBeforeVat: true,
                        vatAmount: true,
                        totalAfterVat: true,
                        outsourceCost: true,
                        taxCost: true,
                        commissionCost: true,
                        customer: { select: { name: true } },
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const finalQuotations = projects
            .map((p) => p.finalQuotation)
            .filter((q): q is NonNullable<typeof q> => Boolean(q));

        const finalQuotationIds = finalQuotations.map((q) => q.id);

        // Still keep status breakdown for all quotations if filter provided (optional), but default to final quotations only
        const quotationsByStatus = finalQuotations.reduce(
            (acc, q) => {
                if (q.status === 'DRAFT') acc.draft += 1;
                else if (q.status === 'SENT') acc.sent += 1;
                else if (q.status === 'ACCEPTED') acc.accepted += 1;
                else if (q.status === 'REJECTED') acc.rejected += 1;
                return acc;
            },
            { draft: 0, sent: 0, accepted: 0, rejected: 0 }
        );

        const totalQuotations = finalQuotations.length;

        const totalRevenueBeforeVat = finalQuotations.reduce((sum, q) => sum + (q.totalBeforeVat ?? 0), 0);
        const totalRevenueAfterVat = finalQuotations.reduce((sum, q) => sum + (q.totalAfterVat ?? 0), 0);
        const totalVatAmount = finalQuotations.reduce((sum, q) => sum + (q.vatAmount ?? 0), 0);
        const totalOutsourceCost = finalQuotations.reduce((sum, q) => sum + (q.outsourceCost ?? 0), 0);
        const totalTaxCost = finalQuotations.reduce((sum, q) => sum + (q.taxCost ?? 0), 0);
        const totalCommissionCost = finalQuotations.reduce((sum, q) => sum + (q.commissionCost ?? 0), 0);

        const totalCosts = totalOutsourceCost + totalTaxCost + totalCommissionCost;
        const totalProfit = totalRevenueBeforeVat - totalCosts;
        const profitMargin = totalRevenueBeforeVat > 0 ? (totalProfit / totalRevenueBeforeVat) * 100 : 0;

        // Recent FINAL quotations (last 10)
        const recentQuotations = finalQuotations.slice(0, 10).map((q) => ({
            id: q.id,
            quotationNo: q.quotationNo,
            customerName: q.customer?.name || 'N/A',
            projectName: q.projectName,
            totalAfterVat: q.totalAfterVat || 0,
            status: q.status,
            date: q.date.toISOString(),
        }));

        // Aggregate payment milestones from FINAL quotations
        const paymentMilestones = finalQuotationIds.length
            ? await prisma.paymentMilestone.findMany({
                  where: {
                      quotationId: {
                          in: finalQuotationIds,
                      },
                  },
                  include: {
                      quotation: {
                          select: {
                              id: true,
                              quotationNo: true,
                              projectName: true,
                              totalAfterVat: true,
                              customer: {
                                  select: { name: true },
                              },
                          },
                      },
                  },
                  orderBy: [
                      { quotationId: 'asc' },
                      { order: 'asc' },
                  ],
              })
            : [];

        const paymentMilestonesSummary = paymentMilestones.map((m) => {
            const quotation = m.quotation;
            const totalAfterVat = quotation.totalAfterVat || 0;
            const expectedAmount = (m.percent / 100) * totalAfterVat;

            return {
                id: m.id,
                quotationId: quotation.id,
                quotationNo: quotation.quotationNo,
                customerName: quotation.customer?.name || 'N/A',
                projectName: quotation.projectName,
                no: m.no,
                title: m.title,
                percent: m.percent,
                expectedAmount,
                expectedDate: m.expectedDate ? m.expectedDate.toISOString() : null,
            };
        });

        // Prepare monthly data for charts (last 12 months)
        const monthlyData: { [key: string]: { revenue: number; costs: number; profit: number; count: number } } = {};
        const now = new Date();

        // Initialize last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[key] = { revenue: 0, costs: 0, profit: 0, count: 0 };
        }

        // Aggregate data by month
        finalQuotations.forEach((q) => {
            const date = new Date(q.createdAt);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[key]) {
                const revenue = q.totalBeforeVat || 0;
                const outsource = q.outsourceCost || 0;
                const tax = q.taxCost || 0;
                const commission = q.commissionCost || 0;
                const costs = outsource + tax + commission;

                monthlyData[key].revenue += revenue;
                monthlyData[key].costs += costs;
                monthlyData[key].profit += revenue - costs;
                monthlyData[key].count += 1;
            }
        });

        // Convert to array format for charts
        const monthlyChartData = Object.entries(monthlyData).map(([month, data]) => ({
            month: month,
            label: new Date(month + '-01').toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
            revenue: data.revenue,
            costs: data.costs,
            profit: data.profit,
            count: data.count,
        }));

        const result = {
                totalQuotations,
                quotationsByStatus,
                projectedRevenue: {
                    beforeVat: totalRevenueBeforeVat,
                    afterVat: totalRevenueAfterVat,
                },
                costs: {
                    outsource: totalOutsourceCost,
                    tax: totalTaxCost,
                    commission: totalCommissionCost,
                    total: totalCosts,
                },
                profit: {
                    amount: totalProfit,
                    margin: profitMargin,
                },
                monthlyChartData,
                recentQuotations,
                paymentMilestones: paymentMilestonesSummary,
        };

        // Cache for 30 seconds
        cache.set(cacheKey, result, 30000);

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        console.error('Error details:', {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
        });
        return NextResponse.json(
            {
                success: false,
                error: error?.message || 'Failed to fetch dashboard statistics',
                details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
            },
            { status: 500 }
        );
    }
}
