import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache, cacheKeys } from '@/lib/cache';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const yearParam = searchParams.get('year');

        // Check cache
        const cacheKey = cacheKeys.projectStatusReport(yearParam || undefined);
        const cached = cache.get(cacheKey);
        if (cached) {
            return NextResponse.json({ ...cached, cached: true });
        }

        // Build where clause for year filter
        const where: any = {};
        if (yearParam) {
            const year = Number.parseInt(yearParam, 10);
            if (!Number.isNaN(year)) {
                const startOfYear = new Date(year, 0, 1);
                const startOfNextYear = new Date(year + 1, 0, 1);
                where.createdAt = {
                    gte: startOfYear,
                    lt: startOfNextYear,
                };
            }
        }

        // Fetch all projects with relations
        const projects = await prisma.project.findMany({
            where,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                finalQuotation: {
                    select: {
                        id: true,
                        quotationNo: true,
                        totalAfterVat: true,
                        outsourceCost: true,
                        taxCost: true,
                        commissionCost: true,
                        totalBeforeVat: true,
                        status: true,
                    },
                },
                _count: {
                    select: {
                        quotations: true,
                        cashFlows: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate financials for each project
        const projectsWithFinancials = projects.map((project: (typeof projects)[number]) => {
            const baseQuotation = project.finalQuotation ?? null;
            const finalRevenue = baseQuotation?.totalAfterVat ?? 0;
            const totalCost =
                (baseQuotation?.outsourceCost ?? 0) +
                (baseQuotation?.taxCost ?? 0) +
                (baseQuotation?.commissionCost ?? 0);

            const totalRevenue = finalRevenue;
            const totalBudget = finalRevenue;
            const totalProfit = totalRevenue - totalCost;

            return {
                id: project.id,
                projectNo: project.projectNo,
                name: project.name,
                code: project.code,
                status: project.status,
                customer: project.customer,
                location: project.location,
                startDate: project.startDate?.toISOString() || null,
                endDate: project.endDate?.toISOString() || null,
                totalArea: project.totalArea,
                totalBudget,
                totalRevenue,
                totalCost,
                totalProfit,
                profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
                quotationCount: project._count.quotations,
                cashFlowCount: project._count.cashFlows,
                hasFinalQuotation: !!baseQuotation,
                createdAt: project.createdAt.toISOString(),
            };
        });

        // Status breakdown
        const statusBreakdown = {
            PLANNING: projectsWithFinancials.filter((p: (typeof projectsWithFinancials)[number]) => p.status === 'PLANNING').length,
            ACTIVE: projectsWithFinancials.filter((p: (typeof projectsWithFinancials)[number]) => p.status === 'ACTIVE').length,
            COMPLETED: projectsWithFinancials.filter((p: (typeof projectsWithFinancials)[number]) => p.status === 'COMPLETED').length,
            CANCELLED: projectsWithFinancials.filter((p: (typeof projectsWithFinancials)[number]) => p.status === 'CANCELLED').length,
        };

        // Financial summary
        const financialSummary = {
            totalBudget: projectsWithFinancials.reduce(
                (sum: number, p: (typeof projectsWithFinancials)[number]) => sum + p.totalBudget,
                0,
            ),
            totalRevenue: projectsWithFinancials.reduce(
                (sum: number, p: (typeof projectsWithFinancials)[number]) => sum + p.totalRevenue,
                0,
            ),
            totalCost: projectsWithFinancials.reduce(
                (sum: number, p: (typeof projectsWithFinancials)[number]) => sum + p.totalCost,
                0,
            ),
            totalProfit: projectsWithFinancials.reduce(
                (sum: number, p: (typeof projectsWithFinancials)[number]) => sum + p.totalProfit,
                0,
            ),
            averageProfitMargin:
                projectsWithFinancials.length > 0
                    ? projectsWithFinancials.reduce(
                          (sum: number, p: (typeof projectsWithFinancials)[number]) => sum + p.profitMargin,
                          0,
                      ) / projectsWithFinancials.length
                    : 0,
        };

        // Projects with issues
        const now = new Date();
        const projectsWithIssues = projectsWithFinancials
            .filter((p: (typeof projectsWithFinancials)[number]) => {
                // Negative profit
                if (p.totalProfit < 0) return true;
                // Overdue (endDate passed but status is ACTIVE)
                if (p.status === 'ACTIVE' && p.endDate) {
                    const endDate = new Date(p.endDate);
                    if (endDate < now) return true;
                }
                // No final quotation but has quotations
                if (!p.hasFinalQuotation && p.quotationCount > 0) return true;
                return false;
            })
            .map((p: (typeof projectsWithFinancials)[number]) => {
                const issues: string[] = [];
                if (p.totalProfit < 0) {
                    issues.push('Lợi nhuận âm');
                }
                if (p.status === 'ACTIVE' && p.endDate) {
                    const endDate = new Date(p.endDate);
                    if (endDate < now) {
                        const daysOverdue = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
                        issues.push(`Quá hạn ${daysOverdue} ngày`);
                    }
                }
                if (!p.hasFinalQuotation && p.quotationCount > 0) {
                    issues.push('Chưa có báo giá chốt');
                }
                return {
                    ...p,
                    issues,
                };
            });

        // Projects by customer
        const projectsByCustomer = projectsWithFinancials.reduce(
            (
                acc: Record<
                    string,
                    {
                        customerId: string;
                        customerName: string;
                        projectCount: number;
                        totalBudget: number;
                        totalRevenue: number;
                        totalCost: number;
                        totalProfit: number;
                        projects: Array<{ id: string; projectNo: string; name: string; status: string }>;
                    }
                >,
                project: (typeof projectsWithFinancials)[number],
            ) => {
                const customerId = project.customer?.id || 'unknown';
                const customerName = project.customer?.name || 'Không xác định';

                if (!acc[customerId]) {
                    acc[customerId] = {
                        customerId,
                        customerName,
                        projectCount: 0,
                        totalBudget: 0,
                        totalRevenue: 0,
                        totalCost: 0,
                        totalProfit: 0,
                        projects: [],
                    };
                }

                acc[customerId].projectCount += 1;
                acc[customerId].totalBudget += project.totalBudget;
                acc[customerId].totalRevenue += project.totalRevenue;
                acc[customerId].totalCost += project.totalCost;
                acc[customerId].totalProfit += project.totalProfit;
                acc[customerId].projects.push({
                    id: project.id,
                    projectNo: project.projectNo,
                    name: project.name,
                    status: project.status,
                });

                return acc;
            },
            {} as Record<
                string,
                {
                    customerId: string;
                    customerName: string;
                    projectCount: number;
                    totalBudget: number;
                    totalRevenue: number;
                    totalCost: number;
                    totalProfit: number;
                    projects: Array<{ id: string; projectNo: string; name: string; status: string }>;
                }
            >
        );

        const customerSummary = (Object.values(projectsByCustomer) as Array<{
            customerId: string;
            customerName: string;
            projectCount: number;
            totalBudget: number;
            totalRevenue: number;
            totalCost: number;
            totalProfit: number;
            projects: Array<{ id: string; projectNo: string; name: string; status: string }>;
        }>)
            .map((c) => ({
                ...c,
                profitMargin: c.totalRevenue > 0 ? (c.totalProfit / c.totalRevenue) * 100 : 0,
            }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue);

        // Monthly trend (last 12 months)
        const monthlyTrend: Record<
            string,
            {
                month: string;
                label: string;
                projectCount: number;
                totalRevenue: number;
                totalCost: number;
                totalProfit: number;
            }
        > = {};

        const nowDate = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyTrend[key] = {
                month: key,
                label: date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
                projectCount: 0,
                totalRevenue: 0,
                totalCost: 0,
                totalProfit: 0,
            };
        }

        projectsWithFinancials.forEach((project: (typeof projectsWithFinancials)[number]) => {
            const date = new Date(project.createdAt);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyTrend[key]) {
                monthlyTrend[key].projectCount += 1;
                monthlyTrend[key].totalRevenue += project.totalRevenue;
                monthlyTrend[key].totalCost += project.totalCost;
                monthlyTrend[key].totalProfit += project.totalProfit;
            }
        });

        const monthlyTrendArray = Object.values(monthlyTrend);

        const result = {
            summary: {
                totalProjects: projectsWithFinancials.length,
                statusBreakdown,
                financialSummary,
            },
            projectsWithIssues,
            customerSummary,
            monthlyTrend: monthlyTrendArray,
            projects: projectsWithFinancials,
        };

        // Cache for 30 seconds
        cache.set(cacheKey, result, 30000);

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error('Failed to fetch project status report:', error);
        return NextResponse.json(
            {
                success: false,
                error: error?.message || 'Lỗi hệ thống. Vui lòng thử lại.',
                details: process.env.NODE_ENV === 'development' ? { message: error?.message, stack: error?.stack } : undefined,
            },
            { status: 500 }
        );
    }
}
