import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { projectCreateSchema, type ProjectCreateInput } from '@/lib/validation/project';
import { cache, cacheKeys } from '@/lib/cache';

/**
 * Tạo các bảng cơ bản nếu chưa tồn tại (users, customers, projects)
 * Được gọi tự động khi detect lỗi "table does not exist"
 */
async function ensureCoreSchema() {
    // 1. Tạo bảng users (cần thiết cho createdById)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "users" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "email" TEXT NOT NULL UNIQUE,
            "password" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "role" TEXT NOT NULL DEFAULT 'USER',
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 2. Tạo bảng customers (nếu chưa có)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "customers" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "taxCode" TEXT,
            "address" TEXT,
            "location" TEXT,
            "contactName" TEXT,
            "email" TEXT,
            "phone" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 3. Tạo bảng projects (phụ thuộc users và customers)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "projects" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "projectNo" TEXT NOT NULL UNIQUE,
            "name" TEXT NOT NULL,
            "code" TEXT,
            "description" TEXT,
            "customerId" TEXT,
            "location" TEXT NOT NULL DEFAULT 'Hà Nội',
            "startDate" DATETIME,
            "endDate" DATETIME,
            "totalArea" REAL,
            "totalBudget" REAL NOT NULL DEFAULT 0,
            "totalRevenue" REAL NOT NULL DEFAULT 0,
            "totalCost" REAL NOT NULL DEFAULT 0,
            "totalProfit" REAL NOT NULL DEFAULT 0,
            "status" TEXT NOT NULL DEFAULT 'PLANNING',
            "notes" TEXT,
            "imageUrl" TEXT,
            "createdById" TEXT NOT NULL,
            "finalQuotationId" TEXT UNIQUE,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE,
            CONSTRAINT "projects_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE CASCADE
        )
    `);

    // Tạo index cơ bản
    try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "projects_projectNo_idx" ON "projects"("projectNo")`);
    } catch {}
    try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "projects_createdById_idx" ON "projects"("createdById")`);
    } catch {}
    try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "projects_customerId_idx" ON "projects"("customerId")`);
    } catch {}
    try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects"("status")`);
    } catch {}
}

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
        let projects: any[];
        let total: number;

        try {
            [projects, total] = await Promise.all([
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
        } catch (innerError: any) {
            const message: string = innerError?.message ?? '';
            const isMissingTable =
                (innerError instanceof Prisma.PrismaClientKnownRequestError &&
                    (innerError.code === 'P2021' || innerError.code === 'P2022')) ||
                /does not exist in the current database/i.test(message) ||
                /no such table/i.test(message);

            if (isMissingTable) {
                // CSDL mới, chưa có bảng projects → tạo schema tối thiểu rồi trả về danh sách rỗng
                await ensureCoreSchema();
                projects = [];
                total = 0;
            } else {
                throw innerError;
            }
        }

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

        // Kiểm tra xem có phải lỗi "table does not exist" không
        const message: string = error instanceof Error ? error.message : '';
        const isMissingTable =
            (error instanceof Prisma.PrismaClientKnownRequestError &&
                (error.code === 'P2021' || error.code === 'P2022')) ||
            /does not exist in the current database/i.test(message) ||
            /no such table/i.test(message);

        if (isMissingTable) {
            // Tự động tạo schema và trả về danh sách rỗng
            try {
                await ensureCoreSchema();
                return NextResponse.json({
                    success: true,
                    data: [],
                    pagination: {
                        page: parseInt(new URL(request.url).searchParams.get('page') || '1'),
                        pageSize: parseInt(new URL(request.url).searchParams.get('pageSize') || '20'),
                        total: 0,
                        totalPages: 0,
                    },
                    hasData: false,
                    warning: 'Cơ sở dữ liệu chưa có dự án nào, đang hiển thị danh sách trống.',
                });
            } catch (schemaError: any) {
                console.error('Failed to create schema:', schemaError);
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Không thể khởi tạo cơ sở dữ liệu. Vui lòng liên hệ admin.',
                        details: process.env.NODE_ENV === 'development' ? schemaError?.message : undefined,
                    },
                    { status: 500 }
                );
            }
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            const knownError = error as Prisma.PrismaClientKnownRequestError;
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

        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json(
            {
                success: false,
                error: 'Lỗi hệ thống. Vui lòng thử lại.',
                details: process.env.NODE_ENV === 'development' ? { message: errorMessage } : undefined,
            },
            { status: 500 }
        );
    }
}

async function getUserIdFromSessionOrFallback(explicitUserId?: string | null): Promise<string | null> {
    try {
        // Đảm bảo schema tồn tại trước khi query (tránh lỗi "table does not exist")
        // Gọi ensureCoreSchema() một lần để đảm bảo các bảng cơ bản đã tồn tại
        // Function này sẽ không làm gì nếu schema đã tồn tại (CREATE TABLE IF NOT EXISTS)
        try {
            await ensureCoreSchema();
        } catch (schemaError: any) {
            // Ignore schema errors - có thể schema đã tồn tại một phần
            // Nếu thực sự thiếu bảng, các query sau sẽ catch và handle
            console.warn('ensureCoreSchema warning (may be safe to ignore):', schemaError?.message);
        }

        // 1. Nếu client truyền lên createdById thì ưu tiên dùng, nhưng phải tồn tại trong DB
        if (explicitUserId) {
            try {
                const user = await prisma.user.findUnique({
                    where: { id: explicitUserId },
                    select: { id: true },
                });
                if (user) {
                    return user.id;
                }
            } catch (error: any) {
                const message: string = error?.message ?? '';
                const isMissingTable =
                    (error instanceof Prisma.PrismaClientKnownRequestError &&
                        (error.code === 'P2021' || error.code === 'P2022')) ||
                    /does not exist in the current database/i.test(message) ||
                    /no such table/i.test(message);

                if (isMissingTable) {
                    await ensureCoreSchema();
                    // Sau khi tạo schema, tạo user mặc định nếu chưa có
                    return await ensureDefaultUser();
                }
                throw error;
            }
        }

        // 2. Thử lấy từ session đăng nhập hiện tại
        const session = await getServerSession(authOptions);
        const sessionUserId =
            session?.user && (session.user as any).id ? ((session.user as any).id as string) : null;
        if (sessionUserId) {
            try {
                const user = await prisma.user.findUnique({
                    where: { id: sessionUserId },
                    select: { id: true },
                });
                if (user) {
                    return user.id;
                }
            } catch (error: any) {
                const message: string = error?.message ?? '';
                const isMissingTable =
                    (error instanceof Prisma.PrismaClientKnownRequestError &&
                        (error.code === 'P2021' || error.code === 'P2022')) ||
                    /does not exist in the current database/i.test(message) ||
                    /no such table/i.test(message);

                if (isMissingTable) {
                    await ensureCoreSchema();
                    return await ensureDefaultUser();
                }
                throw error;
            }
        }

        // 3. Fallback: lấy user đầu tiên trong DB (dùng cho dev/seed)
        try {
            const defaultUser = await prisma.user.findFirst({
                orderBy: { createdAt: 'asc' },
                select: { id: true },
            });
            if (defaultUser) {
                return defaultUser.id;
            }
        } catch (error: any) {
            const message: string = error?.message ?? '';
            const isMissingTable =
                (error instanceof Prisma.PrismaClientKnownRequestError &&
                    (error.code === 'P2021' || error.code === 'P2022')) ||
                /does not exist in the current database/i.test(message) ||
                /no such table/i.test(message);

            if (isMissingTable) {
                await ensureCoreSchema();
                return await ensureDefaultUser();
            }
            throw error;
        }

        // 4. Nếu không có user nào, tạo user mặc định
        return await ensureDefaultUser();
    } catch (error: any) {
        console.error('Error in getUserIdFromSessionOrFallback:', error);
        return null;
    }
}

/**
 * Tạo user mặc định nếu chưa có user nào trong DB
 * User này dùng để làm createdById cho các dự án mới khi chưa có user đăng nhập
 */
async function ensureDefaultUser(): Promise<string | null> {
    try {
        // Đảm bảo schema đã tồn tại trước khi query
        await ensureCoreSchema();

        // Kiểm tra xem đã có user nào chưa
        let existingUser;
        try {
            existingUser = await prisma.user.findFirst({
                select: { id: true },
            });
        } catch (error: any) {
            const message: string = error?.message ?? '';
            const isMissingTable =
                (error instanceof Prisma.PrismaClientKnownRequestError &&
                    (error.code === 'P2021' || error.code === 'P2022')) ||
                /does not exist in the current database/i.test(message) ||
                /no such table/i.test(message);

            if (isMissingTable) {
                // Schema vừa tạo nhưng có thể chưa sync, thử lại
                await ensureCoreSchema();
                existingUser = null;
            } else {
                throw error;
            }
        }

        if (existingUser) {
            return existingUser.id;
        }

        // Tạo user mặc định (password hash cho "admin123" - chỉ dùng trong trường hợp DB mới)
        // ⚠️ User này chỉ để làm createdById, không dùng để đăng nhập
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const defaultUser = await prisma.user.create({
            data: {
                email: 'admin@zfenix.local',
                password: hashedPassword,
                name: 'Admin',
                role: 'ADMIN',
            },
            select: { id: true },
        });

        return defaultUser.id;
    } catch (error: any) {
        console.error('Failed to create default user:', error);
        // Nếu vẫn lỗi sau khi đã ensure schema, có thể là lỗi khác
        const message: string = error?.message ?? '';
        const isMissingTable =
            (error instanceof Prisma.PrismaClientKnownRequestError &&
                (error.code === 'P2021' || error.code === 'P2022')) ||
            /does not exist in the current database/i.test(message) ||
            /no such table/i.test(message);

        if (isMissingTable) {
            // Thử lại một lần nữa với schema mới
            try {
                await ensureCoreSchema();
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash('admin123', 10);
                const defaultUser = await prisma.user.create({
                    data: {
                        email: 'admin@zfenix.local',
                        password: hashedPassword,
                        name: 'Admin',
                        role: 'ADMIN',
                    },
                    select: { id: true },
                });
                return defaultUser.id;
            } catch (retryError) {
                console.error('Failed to create default user after retry:', retryError);
                return null;
            }
        }
        return null;
    }
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
            try {
                const customer = await prisma.customer.findUnique({
                    where: { id: customerId },
                });
                if (!customer) {
                    return NextResponse.json({ success: false, error: 'Khách hàng không tồn tại' }, { status: 400 });
                }
            } catch (error: any) {
                const message: string = error?.message ?? '';
                const isMissingTable =
                    (error instanceof Prisma.PrismaClientKnownRequestError &&
                        (error.code === 'P2021' || error.code === 'P2022')) ||
                    /does not exist in the current database/i.test(message) ||
                    /no such table/i.test(message);

                if (isMissingTable) {
                    await ensureCoreSchema();
                    // Sau khi tạo schema, customer vẫn không tồn tại → trả lỗi
                    return NextResponse.json({ success: false, error: 'Khách hàng không tồn tại' }, { status: 400 });
                }
                throw error;
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
        let lastProject;
        try {
            lastProject = await prisma.project.findFirst({
                where: { projectNo: { startsWith: `PRJ-${currentYear}-` } },
                orderBy: { projectNo: 'desc' },
            });
        } catch (error: any) {
            const message: string = error?.message ?? '';
            const isMissingTable =
                (error instanceof Prisma.PrismaClientKnownRequestError &&
                    (error.code === 'P2021' || error.code === 'P2022')) ||
                /does not exist in the current database/i.test(message) ||
                /no such table/i.test(message);

            if (isMissingTable) {
                await ensureCoreSchema();
                lastProject = null; // Không có project nào → bắt đầu từ 0001
            } else {
                throw error;
            }
        }

        let projectNo: string;
        if (!lastProject) {
            projectNo = `PRJ-${currentYear}-0001`;
        } else {
            const lastSeq = parseInt(lastProject.projectNo.split('-')[2]);
            projectNo = `PRJ-${currentYear}-${(lastSeq + 1).toString().padStart(4, '0')}`;
        }

        let project;
        try {
            project = await prisma.project.create({
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
        } catch (error: any) {
            const message: string = error?.message ?? '';
            const isMissingTable =
                (error instanceof Prisma.PrismaClientKnownRequestError &&
                    (error.code === 'P2021' || error.code === 'P2022')) ||
                /does not exist in the current database/i.test(message) ||
                /no such table/i.test(message);

            if (isMissingTable) {
                await ensureCoreSchema();
                // Retry sau khi tạo schema
                project = await prisma.project.create({
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
            } else {
                throw error;
            }
        }

        return NextResponse.json({ success: true, data: project }, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create project:', error);

        const message: string = error?.message ?? '';
        const isMissingTable =
            (error instanceof Prisma.PrismaClientKnownRequestError &&
                (error.code === 'P2021' || error.code === 'P2022')) ||
            /does not exist in the current database/i.test(message) ||
            /no such table/i.test(message);

        if (isMissingTable) {
            // Tự động tạo schema và thử lại (nếu chưa thử)
            try {
                await ensureCoreSchema();
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            'Cơ sở dữ liệu đã được khởi tạo. Vui lòng thử lại lưu dự án. Nếu vẫn lỗi, vui lòng liên hệ admin.',
                    },
                    { status: 500 }
                );
            } catch (schemaError: any) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Không thể khởi tạo cơ sở dữ liệu. Vui lòng liên hệ admin.',
                        details: process.env.NODE_ENV === 'development' ? schemaError?.message : undefined,
                    },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: error?.message || 'Không thể tạo dự án. Vui lòng thử lại.',
                details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
            },
            { status: 500 }
        );
    }
}
