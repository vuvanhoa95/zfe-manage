import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { projectCreateSchema, type ProjectCreateInput } from '@/lib/validation/project';
import { cache, cacheKeys } from '@/lib/cache';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const yearParam = searchParams.get('year');
        
        // Check cache (only for non-search queries to avoid stale data)
        if (!search) {
            const cacheKey = cacheKeys.projectList(searchParams.toString());
            const cached = cache.get(cacheKey);
            if (cached) {
                return NextResponse.json({ ...cached, cached: true });
            }
        }

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

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const skip = (page - 1) * pageSize;

        // Fetch projects with relations (with pagination)
        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            taxCode: true,
                        },
                    },
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
                skip,
                take: pageSize,
            }),
            prisma.project.count({ where }),
        ]);

        const projectsWithComputedTotals = projects.map((project: {
            finalQuotation: {
                id: string;
                totalAfterVat: number | null;
                outsourceCost: number | null;
                taxCost: number | null;
                commissionCost: number | null;
                totalBeforeVat: number | null;
            } | null;
        } & (typeof projects)[number]) => {
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

        const result = {
            success: true,
            data: projectsWithComputedTotals,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        };

        // Cache for 30 seconds (only if no search)
        if (!search) {
            const cacheKey = cacheKeys.projectList(searchParams.toString());
            cache.set(cacheKey, result, 30000);
        }

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error('Failed to fetch projects:', error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            const knownError = error as Prisma.PrismaClientKnownRequestError;
            if (knownError.code === 'P2021') {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            'Cơ sở dữ liệu chưa được khởi tạo/migrate. Vui lòng chạy migrate (và seed nếu cần) rồi thử lại.',
                        details:
                            process.env.NODE_ENV === 'development'
                                ? { code: knownError.code, meta: knownError.meta, message: knownError.message }
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
                            ? { code: knownError.code, meta: knownError.meta, message: knownError.message }
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

async function getUserIdFromSessionOrFallback(explicitUserId?: string | null) {
    // 1. Nếu client truyền lên createdById thì ưu tiên dùng, nhưng phải tồn tại trong DB
    if (explicitUserId) {
        const user = await prisma.user.findUnique({
            where: { id: explicitUserId },
            select: { id: true },
        });
        if (user) {
            return user.id;
        }
    }

    // 2. Thử lấy từ session đăng nhập hiện tại
    const session = await getServerSession(authOptions);
    const sessionUserId =
        session?.user && (session.user as any).id ? ((session.user as any).id as string) : null;
    if (sessionUserId) {
        const user = await prisma.user.findUnique({
            where: { id: sessionUserId },
            select: { id: true },
        });
        if (user) {
            return user.id;
        }
    }

    // 3. Fallback: lấy user đầu tiên trong DB (dùng cho dev/seed)
    const defaultUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true },
    });

    return defaultUser?.id ?? null;
}

export async function POST(request: NextRequest) {
    try {
        const json = await request.json();
        const parsed = projectCreateSchema.safeParse(json);

        if (!parsed.success) {
            const errors = parsed.error.flatten();
            const errorMessages = Object.entries(errors.fieldErrors)
                .map(([field, messages]) => {
                    if (messages && messages.length > 0) {
                        return `${field}: ${messages.join(', ')}`;
                    }
                    return null;
                })
                .filter(Boolean)
                .join('; ');

            return NextResponse.json(
                {
                    success: false,
                    error: errorMessages || 'Dữ liệu dự án không hợp lệ',
                    details: process.env.NODE_ENV === 'development' ? errors : undefined,
                },
                { status: 400 },
            );
        }

        const body: ProjectCreateInput = parsed.data;
        const {
            name,
            code,
            description,
            customerId,
            location,
            startDate,
            endDate,
            totalArea,
            notes,
            createdById,
            imageUrl,
        } = body;

        // Verify customer exists if provided
        if (customerId) {
            const customer = await prisma.customer.findUnique({
                where: { id: customerId },
            });
            if (!customer) {
                return NextResponse.json({ success: false, error: 'Khách hàng không tồn tại' }, { status: 400 });
            }
        }

        // Lấy userId hợp lệ từ createdById / session / user đầu tiên
        const finalUserId = await getUserIdFromSessionOrFallback(createdById ?? null);

        if (!finalUserId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Không tìm thấy người dùng. Vui lòng đăng nhập hoặc chạy seed database trước.',
                },
                { status: 400 },
            );
        }

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
