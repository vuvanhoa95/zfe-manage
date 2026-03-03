import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { projectCreateSchema, type ProjectCreateInput } from '@/lib/validation/project';
import { cache, cacheKeys } from '@/lib/cache';
import { ensureCoreSchema, isMissingTableError } from '@/lib/db-schema';




export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const yearParam = searchParams.get('year');
        
        // Short TTL cache (10s) to avoid duplicate DB queries during rapid navigation
        if (!search) {
            const cacheKey = cacheKeys.projectList(searchParams.toString());
            const cached = cache.get(cacheKey);
            if (cached) {
                return NextResponse.json({ ...(cached as Record<string, unknown>), cached: true });
            }
        }

        const where: any = {};

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
                (typeof innerError?.code === 'string' &&
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

        // Cache for 10 seconds (only if no search)
        if (!search) {
            const cacheKey = cacheKeys.projectList(searchParams.toString());
            cache.set(cacheKey, result, 10000);
        }

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error('Failed to fetch projects:', error);

        // Kiểm tra xem có phải lỗi "table does not exist" không
        if (isMissingTableError(error)) {
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

        if (typeof (error as any)?.code === 'string' && (error as any).code.startsWith('P')) {
            const knownError = error as any;
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
                if (isMissingTableError(error)) {
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
                if (isMissingTableError(error)) {
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
                (typeof error?.code === 'string' &&
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
                (typeof error?.code === 'string' &&
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
        if (isMissingTableError(error)) {
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
        // Đảm bảo schema tồn tại trước khi thao tác với database
        try {
            await ensureCoreSchema();
        } catch (schemaError: any) {
            // Log nhưng không throw - có thể schema đã tồn tại một phần
            if (process.env.NODE_ENV === 'development') {
                console.warn('[API] ensureCoreSchema warning (may be safe to ignore):', schemaError?.message);
            }
        }

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
            if (isMissingTableError(error)) {
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
            if (isMissingTableError(error)) {
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
            // Sử dụng transaction để đảm bảo atomicity
            project = await prisma.$transaction(async (tx) => {
                const created = await tx.project.create({
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

                // Verify ngay trong transaction để đảm bảo data được commit
                const verify = await tx.project.findUnique({
                    where: { id: created.id },
                    select: { id: true, projectNo: true, name: true },
                });
                
                if (!verify) {
                    throw new Error('Project was created but cannot be verified in database');
                }

                return created;
            });

            // Log success sau khi transaction commit thành công
            if (process.env.NODE_ENV === 'development') {
                console.log('[API] Project created and verified successfully:', {
                    id: project.id,
                    projectNo: project.projectNo,
                    name: project.name,
                });
            }
        } catch (error: any) {
            // Log error để debug
            if (process.env.NODE_ENV === 'development') {
                console.error('[API] Error creating project:', {
                    error: error?.message,
                    code: error?.code,
                    projectNo,
                    name,
                    finalUserId,
                });
            }

            if (isMissingTableError(error)) {
                await ensureCoreSchema();
                // Retry sau khi tạo schema - sử dụng transaction để đảm bảo atomicity
                try {
                    project = await prisma.$transaction(async (tx) => {
                        const created = await tx.project.create({
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

                        // Verify ngay trong transaction để đảm bảo data được commit
                        const verify = await tx.project.findUnique({
                            where: { id: created.id },
                            select: { id: true, projectNo: true, name: true },
                        });
                        
                        if (!verify) {
                            throw new Error('Project was created but cannot be verified in database');
                        }

                        return created;
                    });
                    
                    // Log success sau khi transaction commit thành công
                    if (process.env.NODE_ENV === 'development') {
                        console.log('[API] Project created and verified successfully after schema ensure:', {
                            id: project.id,
                            projectNo: project.projectNo,
                            name: project.name,
                        });
                    }
                } catch (retryError: any) {
                    // Nếu vẫn lỗi sau khi ensure schema, log và throw
                    console.error('[API] Error creating project after schema ensure:', retryError);
                    if (process.env.NODE_ENV === 'development') {
                        console.error('[API] Retry error details:', {
                            message: retryError?.message,
                            code: retryError?.code,
                            meta: retryError?.meta,
                        });
                    }
                    throw retryError;
                }
            } else {
                // Nếu là lỗi unique constraint (projectNo đã tồn tại), thử generate lại
                if (error?.code === 'P2002' && error?.meta?.target?.includes('projectNo')) {
                    // ProjectNo đã tồn tại, thử tăng số sequence
                    const maxRetries = 10;
                    for (let i = 1; i <= maxRetries; i++) {
                        try {
                            const newSeq = parseInt(projectNo.split('-')[2]) + i;
                            const newProjectNo = `PRJ-${currentYear}-${newSeq.toString().padStart(4, '0')}`;
                            
                            project = await prisma.project.create({
                                data: {
                                    projectNo: newProjectNo,
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
                            break; // Thành công, thoát loop
                        } catch (retryError: any) {
                            if (i === maxRetries) {
                                // Đã thử hết, throw lỗi
                                throw new Error('Không thể tạo số dự án duy nhất. Vui lòng thử lại.');
                            }
                            // Tiếp tục thử với số tiếp theo
                        }
                    }
                } else {
                    throw error;
                }
                }
            }

            // Clear project list cache sau khi tạo project mới
            cache.clearByPattern('projects:list:');

            return NextResponse.json({ success: true, data: project }, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create project:', error);
        
        // Log chi tiết trong development
        if (process.env.NODE_ENV === 'development') {
            console.error('[API] Project creation error details:', {
                message: error?.message,
                code: error?.code,
                meta: error?.meta,
                stack: error?.stack,
            });
        }

        if (isMissingTableError(error)) {
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

        // Xử lý các loại lỗi cụ thể
        let errorMessage = error?.message || 'Không thể tạo dự án. Vui lòng thử lại.';
        let statusCode = 500;

        // Prisma error codes
        if (error?.code === 'P2002') {
            // Unique constraint violation
            const target = error?.meta?.target;
            if (Array.isArray(target) && target.includes('projectNo')) {
                errorMessage = 'Số dự án đã tồn tại. Vui lòng thử lại.';
            } else if (Array.isArray(target) && target.includes('code')) {
                errorMessage = 'Mã dự án đã tồn tại. Vui lòng sử dụng mã khác.';
            } else {
                errorMessage = 'Dữ liệu đã tồn tại trong hệ thống.';
            }
            statusCode = 400;
        } else if (error?.code === 'P2003') {
            // Foreign key constraint violation
            errorMessage = 'Dữ liệu tham chiếu không hợp lệ (khách hàng hoặc người dùng không tồn tại).';
            statusCode = 400;
        } else if (error?.message && (error.message.includes('validation') || error.message.includes('invalid'))) {
            // Validation errors
            errorMessage = error.message;
            statusCode = 400;
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? {
                    message: error?.message,
                    code: error?.code,
                    meta: error?.meta,
                } : undefined,
            },
            { status: statusCode }
        );
    }
}
