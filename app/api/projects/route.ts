import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { projectCreateSchema, type ProjectCreateInput } from '@/lib/validation/project';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const yearParam = searchParams.get('year');

        const where: Prisma.ProjectWhereInput = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { code: { contains: search } },
                { projectNo: { contains: search } },
            ];
        }

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

        // Fetch projects with relations
        const projects = await prisma.project.findMany({
            where,
            include: {
                customer: true,
                finalQuotation: {
                    select: {
                        id: true,
                        totalAfterVat: true,
                        outsourceCost: true,
                        taxCost: true,
                        commissionCost: true,
                        totalBeforeVat: true,
                    },
                },
                _count: {
                    select: { quotations: true, cashFlows: true },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const projectsWithComputedTotals = projects.map((project) => {
            // Rule: financial numbers MUST come from finalQuotation only.
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
                ...project,
                totalBudget,
                totalRevenue,
                totalCost,
                totalProfit,
            };
        });

        return NextResponse.json({ success: true, data: projectsWithComputedTotals });
    } catch (error: unknown) {
        console.error('Failed to fetch projects:', error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2021') {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            'Cơ sở dữ liệu chưa được khởi tạo/migrate. Vui lòng chạy migrate (và seed nếu cần) rồi thử lại.',
                        details:
                            process.env.NODE_ENV === 'development'
                                ? { code: error.code, meta: error.meta, message: error.message }
                                : undefined,
                    },
                    { status: 500 }
                );
            }

            return NextResponse.json(
                {
                    success: false,
                    error: 'Lỗi truy vấn cơ sở dữ liệu. Vui lòng thử lại.',
                    details:
                        process.env.NODE_ENV === 'development'
                            ? { code: error.code, meta: error.meta, message: error.message }
                            : undefined,
                },
                { status: 500 }
            );
        }

        if (error instanceof Error && /no such table/i.test(error.message)) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'Cơ sở dữ liệu chưa có bảng cần thiết. Vui lòng chạy migrate/seed để tạo schema trước khi sử dụng.',
                    details: process.env.NODE_ENV === 'development' ? { message: error.message } : undefined,
                },
                { status: 500 }
            );
        }

        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json(
            {
                success: false,
                error: 'Lỗi hệ thống. Vui lòng thử lại.',
                details: process.env.NODE_ENV === 'development' ? { message } : undefined,
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const json = await request.json();
        const parsed = projectCreateSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Dữ liệu dự án không hợp lệ', details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const body: ProjectCreateInput = parsed.data;
        const { name, code, description, customerId, location, startDate, endDate, totalArea, notes, createdById, imageUrl } = body;

        // Verify customer exists if provided
        if (customerId) {
            const customer = await prisma.customer.findUnique({
                where: { id: customerId },
            });
            if (!customer) {
                return NextResponse.json({ success: false, error: 'Khách hàng không tồn tại' }, { status: 400 });
            }
        }

        // Get user from session or fallback to first user
        let userId = createdById;

        if (!userId) {
            // Try to get user from session first
            const session = await getServerSession(authOptions);

            if (session?.user && (session.user as any).id) {
                userId = (session.user as any).id;
            } else {
                // Fallback: get first user from database (for development/testing)
                try {
                    const defaultUser = await prisma.user.findFirst({
                        orderBy: { createdAt: 'asc' },
                    });

                    if (!defaultUser) {
                        // If no user exists, return error - user should run seed first
                        return NextResponse.json({
                            success: false,
                            error: 'Không tìm thấy người dùng. Vui lòng đăng nhập hoặc chạy seed database trước.'
                        }, { status: 400 });
                    }

                    userId = defaultUser.id;
                } catch (userError: any) {
                    console.error('Could not get user:', userError?.message);
                    return NextResponse.json({
                        success: false,
                        error: 'Lỗi khi lấy thông tin người dùng. Vui lòng thử lại.'
                    }, { status: 500 });
                }
            }
        }

        if (!userId) {
            return NextResponse.json({
                success: false,
                error: 'Không xác định được người dùng'
            }, { status: 400 });
        }

        // Verify userId exists in database
        const userExists = await prisma.user.findUnique({
            where: { id: userId as string },
        });

        if (!userExists) {
            return NextResponse.json({
                success: false,
                error: 'Người dùng không tồn tại'
            }, { status: 400 });
        }

        const finalUserId = userId as string;

        // Generate project number
        const currentYear = new Date().getFullYear();
        const lastProject = await prisma.project.findFirst({
            where: { projectNo: { startsWith: `PRJ-${currentYear}-` } },
            orderBy: { projectNo: 'desc' },
        });

        let projectNo: string;
        if (!lastProject) {
            projectNo = `PRJ-${currentYear}-0001`;
        } else {
            const lastSeq = parseInt(lastProject.projectNo.split('-')[2]);
            projectNo = `PRJ-${currentYear}-${(lastSeq + 1).toString().padStart(4, '0')}`;
        }

        const project = await prisma.project.create({
            data: {
                projectNo,
                name,
                code,
                description,
                customerId: customerId || null,
                location: location || 'Hà Nội',
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                totalArea,
                notes,
                imageUrl: imageUrl || null,
                createdById: finalUserId,
            },
            include: {
                customer: true,
            },
        });

        return NextResponse.json({ success: true, data: project }, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create project:', error);
        return NextResponse.json({ success: false, error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}
