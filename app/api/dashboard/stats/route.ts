import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { cache, cacheKeys } from '@/lib/cache';

function getEmptyDashboardStats() {
    const quotationsByStatus = { draft: 0, sent: 0, accepted: 0, rejected: 0 };

    return {
        totalQuotations: 0,
        quotationsByStatus,
        projectedRevenue: {
            beforeVat: 0,
            afterVat: 0,
        },
        costs: {
            outsource: 0,
            tax: 0,
            commission: 0,
            total: 0,
        },
        profit: {
            amount: 0,
            margin: 0,
        },
        monthlyChartData: [],
        recentQuotations: [],
        paymentMilestones: [],
    };
}

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
    try {
        const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
        if (!databaseUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'Chưa cấu hình DATABASE_URL nên không thể tải Dashboard. ' +
                        'Vui lòng xem `docs/LOCAL_DEVELOPMENT_SETUP.md` để cấu hình local (SQLite).',
                    code: 'DATABASE_URL_MISSING',
                },
                { status: 500 },
            );
        }

        // Schema hiện tại dùng provider = "postgresql"
        // DATABASE_URL có thể là:
        // - PostgreSQL: postgresql://user:password@host:port/database
        // - Prisma Accelerate: prisma://host:port/database?api_key=...
        // - Prisma Data Proxy: prisma+postgres://host:port/database?api_key=...
        // Không cần check format cụ thể, để Prisma tự validate

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

        // Step 1: Aggregate totals from FINAL quotations of ACTIVE/COMPLETED projects
        const totals = await prisma.quotation.aggregate({
            where: {
                finalForProject: {
                    status: { in: ['ACTIVE', 'COMPLETED'] }
                }
            },
            _sum: {
                totalBeforeVat: true,
                totalAfterVat: true,
                vatAmount: true,
                outsourceCost: true,
                taxCost: true,
                commissionCost: true,
            },
            _count: {
                id: true
            }
        });

        // Step 2: Group by status for final quotations
        const statusGroups = await prisma.quotation.groupBy({
            by: ['status'],
            where: {
                finalForProject: {
                    status: { in: ['ACTIVE', 'COMPLETED'] }
                }
            },
            _count: {
                id: true
            }
        });

        const quotationsByStatus = { draft: 0, sent: 0, accepted: 0, rejected: 0 };
        statusGroups.forEach((g: { status: string; _count: { id: number } }) => {
            if (g.status === 'DRAFT') quotationsByStatus.draft = g._count.id;
            else if (g.status === 'SENT') quotationsByStatus.sent = g._count.id;
            else if (g.status === 'ACCEPTED') quotationsByStatus.accepted = g._count.id;
            else if (g.status === 'REJECTED') quotationsByStatus.rejected = g._count.id;
        });

        const totalQuotations = totals._count.id;
        const totalRevenueBeforeVat = totals._sum.totalBeforeVat ?? 0;
        const totalRevenueAfterVat = totals._sum.totalAfterVat ?? 0;
        const totalOutsourceCost = totals._sum.outsourceCost ?? 0;
        const totalTaxCost = totals._sum.taxCost ?? 0;
        const totalCommissionCost = totals._sum.commissionCost ?? 0;

        const totalCosts = totalOutsourceCost + totalTaxCost + totalCommissionCost;
        const totalProfit = totalRevenueAfterVat - totalCosts;
        const profitMargin = totalRevenueAfterVat > 0 ? (totalProfit / totalRevenueAfterVat) * 100 : 0;

        // Step 3: Recent FINAL quotations (last 10)
        const recentQuotationsRaw = await prisma.quotation.findMany({
            where: {
                finalForProject: {
                    status: { in: ['ACTIVE', 'COMPLETED'] }
                }
            },
            select: {
                id: true,
                quotationNo: true,
                projectName: true,
                totalAfterVat: true,
                status: true,
                date: true,
                customer: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        const recentQuotations = recentQuotationsRaw.map((q: {
            id: string;
            quotationNo: string;
            projectName: string | null;
            totalAfterVat: number | null;
            status: string;
            date: Date;
            customer: { name: string } | null;
        }) => ({
            id: q.id,
            quotationNo: q.quotationNo,
            customerName: q.customer?.name || 'N/A',
            projectName: q.projectName,
            totalAfterVat: q.totalAfterVat || 0,
            status: q.status,
            date: q.date.toISOString(),
        }));

        // Step 4: Get final quotation IDs for payment milestones
        const finalProjQuotes = await prisma.project.findMany({
            where: {
                finalQuotationId: { not: null },
                status: { in: ['ACTIVE', 'COMPLETED'] },
            },
            select: { finalQuotationId: true }
        });
        const finalQuotationIds = finalProjQuotes.map((p: { finalQuotationId: string | null }) => p.finalQuotationId as string);

        // Aggregate payment milestones
        const paymentMilestones = finalQuotationIds.length
            ? await prisma.paymentMilestone.findMany({
                where: {
                    quotationId: { in: finalQuotationIds },
                },
                include: {
                    quotation: {
                        select: {
                            id: true,
                            quotationNo: true,
                            projectName: true,
                            totalAfterVat: true,
                            customer: { select: { name: true } },
                        },
                    },
                },
                orderBy: [
                    { quotationId: 'asc' },
                    { order: 'asc' },
                ],
                take: 50, // Limit to prevent massive payload
            })
            : [];

        const paymentMilestonesSummary = paymentMilestones.map((m: {
            id: string;
            quotationId: string;
            no: number;
            title: string | null;
            percent: number;
            expectedDate: Date | null;
            quotation: {
                id: string;
                quotationNo: string;
                projectName: string | null;
                totalAfterVat: number | null;
                customer: { name: string } | null;
            };
        }) => {
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

        // Step 5: Monthly data for charts (last 12 months)
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

        const monthlyDataRaw = await prisma.quotation.findMany({
            where: {
                finalForProject: {
                    status: { in: ['ACTIVE', 'COMPLETED'] }
                },
                createdAt: { gte: twelveMonthsAgo }
            },
            select: {
                createdAt: true,
                totalBeforeVat: true,
                totalAfterVat: true,
                outsourceCost: true,
                taxCost: true,
                commissionCost: true
            }
        });

        const monthlyData: { [key: string]: { revenue: number; costs: number; profit: number; count: number } } = {};
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[key] = { revenue: 0, costs: 0, profit: 0, count: 0 };
        }

        monthlyDataRaw.forEach((q: {
            createdAt: Date;
            totalBeforeVat: number | null;
            totalAfterVat: number | null;
            outsourceCost: number | null;
            taxCost: number | null;
            commissionCost: number | null;
        }) => {
            const date = new Date(q.createdAt);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[key]) {
                const revenue = q.totalAfterVat || 0;
                const costs = (q.outsourceCost || 0) + (q.taxCost || 0) + (q.commissionCost || 0);
                monthlyData[key].revenue += revenue;
                monthlyData[key].costs += costs;
                monthlyData[key].profit += revenue - costs;
                monthlyData[key].count += 1;
            }
        });

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

        const isPrismaKnownError = error instanceof Prisma.PrismaClientKnownRequestError;
        const message: string = error?.message ?? '';

        const isMissingTable =
            (isPrismaKnownError && (error.code === 'P2021' || error.code === 'P2022')) ||
            /does not exist in the current database/i.test(message) ||
            /no such table/i.test(message);

        if (isMissingTable) {
            // DB / bảng báo giá chưa được khởi tạo → coi như "chưa có dữ liệu", không phải lỗi 500.
            const emptyResult = getEmptyDashboardStats();
            return NextResponse.json({
                success: true,
                data: emptyResult,
                hasData: false,
                warning: 'Cơ sở dữ liệu chưa có báo giá nào, Dashboard đang hiển thị dữ liệu trống.',
            });
        }

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
