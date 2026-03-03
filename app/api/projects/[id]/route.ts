import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { projectUpdateSchema, type ProjectUpdateInput } from '@/lib/validation/project';
import { ensureCoreSchema, isMissingTableError } from '@/lib/db-schema';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        // Handle both sync and async params (Next.js 15+)
        const resolvedParams = params instanceof Promise ? await params : params;
        
        // First, try to get the project with minimal includes to check if it exists
        let project = await prisma.project.findUnique({
            where: { id: resolvedParams.id },
            include: {
                customer: true,
            },
        });

        if (!project) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }

        // Now fetch related data separately to handle errors gracefully
        try {
            const [createdBy, quotations, cashFlows, members] = await Promise.all([
                // Fetch createdBy user
                prisma.user.findUnique({
                    where: { id: project.createdById },
                    select: { id: true, name: true, email: true },
                }).catch(() => null), // Return null if user doesn't exist
                
                // Fetch quotations
                prisma.quotation.findMany({
                    where: { projectId: resolvedParams.id },
                    include: {
                        customer: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                }).catch(() => []), // Return empty array on error
                
                // Fetch cash flows with safe includes
                prisma.cashFlow.findMany({
                    where: { projectId: resolvedParams.id },
                    include: {
                        quotation: {
                            select: { id: true, quotationNo: true },
                        },
                        createdBy: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { date: 'desc' },
                    take: 100,
                }).catch((err: { message?: string; code?: string; meta?: unknown }) => {
                    console.warn('Error fetching cash flows with createdBy:', err);
                    console.warn('Error details:', {
                        message: err?.message,
                        code: err?.code,
                        meta: err?.meta,
                    });
                    // Try without createdBy include if it fails
                    return prisma.cashFlow.findMany({
                        where: { projectId: resolvedParams.id },
                        include: {
                            quotation: {
                                select: { id: true, quotationNo: true },
                            },
                        },
                        orderBy: { date: 'desc' },
                        take: 100,
                    }).catch((fallbackErr: { message?: string; code?: string; meta?: unknown }) => {
                        console.error('Error fetching cash flows without createdBy:', fallbackErr);
                        return [];
                    });
                }),
                
                // Fetch project members
                prisma.projectMember.findMany({
                    where: { projectId: resolvedParams.id },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                }).catch(() => []), // Return empty array on error
            ]);

            // If createdBy is null but we have a createdById, try to get a fallback user
            if (!createdBy && project.createdById) {
                console.warn(`Project ${resolvedParams.id} has invalid createdById: ${project.createdById}`);
                try {
                    const fallbackUser = await prisma.user.findFirst({
                        select: { id: true, name: true, email: true },
                        orderBy: { createdAt: 'asc' },
                    });
                    if (fallbackUser) {
                        (project as any).createdBy = fallbackUser;
                    }
                } catch (userError) {
                    console.warn('Could not get fallback user:', userError);
                }
            } else {
                (project as any).createdBy = createdBy;
            }

            // Attach related data
            (project as any).quotations = quotations || [];
            (project as any).cashFlows = cashFlows || [];
            (project as any).members = (members || []).map((member: any) => ({
                id: member.id,
                userId: member.userId,
                role: member.role,
                user: member.user,
                createdAt: member.createdAt,
            }));

            return NextResponse.json({ success: true, data: project });
        } catch (relationError: any) {
            console.error('Error fetching project relations:', relationError);
            // Return project with minimal data if relations fail
            (project as any).quotations = [];
            (project as any).cashFlows = [];
            (project as any).members = [];
            return NextResponse.json({ success: true, data: project });
        }
    } catch (error: any) {
        console.error('Failed to fetch project:', error);
        console.error('Error details:', {
            message: error?.message,
            code: error?.code,
            meta: error?.meta,
            stack: error?.stack,
        });
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể tải thông tin dự án',
                details:
                    process.env.NODE_ENV === 'development'
                        ? {
                              message: error?.message,
                              code: error?.code,
                              meta: error?.meta,
                          }
                        : undefined,
            },
            { status: 500 },
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        // Đảm bảo schema tồn tại trước khi thao tác với database
        await ensureCoreSchema();

        // Handle both sync and async params (Next.js 15+)
        const resolvedParams = params instanceof Promise ? await params : params;

        const json = await request.json();
        const parsed = projectUpdateSchema.safeParse(json);

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

        const body: ProjectUpdateInput = parsed.data;
        const { name, code, description, customerId, location, startDate, endDate, totalArea, status, notes, imageUrl } = body;

        // Verify project exists before updating
        const existingProject = await prisma.project.findUnique({
            where: { id: resolvedParams.id },
            select: { id: true },
        });

        if (!existingProject) {
            return NextResponse.json(
                { success: false, error: 'Dự án không tồn tại' },
                { status: 404 },
            );
        }

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
                    console.warn('[API] Customers table missing, attempting to create schema and retry...');
                    await ensureCoreSchema();
                    // Sau khi tạo schema, customer vẫn không tồn tại → trả lỗi
                    return NextResponse.json({ success: false, error: 'Khách hàng không tồn tại' }, { status: 400 });
                }
                throw error;
            }
        }

        let project;
        try {
            // Sử dụng transaction để đảm bảo atomicity
            project = await prisma.$transaction(async (tx) => {
                const updated = await tx.project.update({
                    where: { id: resolvedParams.id },
                    data: {
                        name,
                        code,
                        description,
                        customerId: customerId === undefined ? undefined : customerId || null,
                        location,
                        startDate: startDate === undefined ? undefined : startDate ? new Date(startDate) : null,
                        endDate: endDate === undefined ? undefined : endDate ? new Date(endDate) : null,
                        totalArea,
                        status,
                        notes,
                        imageUrl: imageUrl === undefined ? undefined : typeof imageUrl === 'string' ? imageUrl : imageUrl === null ? null : undefined,
                    },
                    include: {
                        customer: true,
                    },
                });

                // Verify ngay trong transaction để đảm bảo data được commit
                const verify = await tx.project.findUnique({
                    where: { id: updated.id },
                    select: { id: true, name: true, code: true },
                });

                if (!verify) {
                    throw new Error('Project was updated but cannot be verified in database');
                }

                return updated;
            });

            // Log success sau khi transaction commit thành công
            if (process.env.NODE_ENV === 'development') {
                console.log('[API] Project updated and verified successfully:', {
                    id: project.id,
                    name: project.name,
                    code: project.code,
                });
            }
        } catch (error: any) {
            // Log error để debug
            if (process.env.NODE_ENV === 'development') {
                console.error('[API] Error updating project:', {
                    error: error?.message,
                    code: error?.code,
                    projectId: resolvedParams.id,
                });
            }

            if (isMissingTableError(error)) {
                console.warn('[API] Projects table missing, attempting to create schema and retry...');
                await ensureCoreSchema();
                // Retry sau khi tạo schema - sử dụng transaction
                try {
                    project = await prisma.$transaction(async (tx) => {
                        const updated = await tx.project.update({
                            where: { id: resolvedParams.id },
                            data: {
                                name,
                                code,
                                description,
                                customerId: customerId === undefined ? undefined : customerId || null,
                                location,
                                startDate: startDate === undefined ? undefined : startDate ? new Date(startDate) : null,
                                endDate: endDate === undefined ? undefined : endDate ? new Date(endDate) : null,
                                totalArea,
                                status,
                                notes,
                                imageUrl: imageUrl === undefined ? undefined : typeof imageUrl === 'string' ? imageUrl : imageUrl === null ? null : undefined,
                            },
                            include: {
                                customer: true,
                            },
                        });

                        // Verify ngay trong transaction
                        const verify = await tx.project.findUnique({
                            where: { id: updated.id },
                            select: { id: true, name: true, code: true },
                        });

                        if (!verify) {
                            throw new Error('Project was updated but cannot be verified in database');
                        }

                        return updated;
                    });

                    // Log success sau khi transaction commit
                    if (process.env.NODE_ENV === 'development') {
                        console.log('[API] Project updated and verified successfully after schema ensure:', {
                            id: project.id,
                            name: project.name,
                            code: project.code,
                        });
                    }
                } catch (retryError: any) {
                    // Nếu vẫn lỗi sau khi ensure schema, log và throw
                    console.error('[API] Error updating project after schema ensure:', retryError);
                    if (process.env.NODE_ENV === 'development') {
                        console.error('[API] Retry error details:', {
                            message: retryError?.message,
                            code: retryError?.code,
                            meta: retryError?.meta,
                        });
                    }
                    throw retryError;
                }
            } else if (error?.code === 'P2025') {
                // Record not found
                return NextResponse.json(
                    { success: false, error: 'Dự án không tồn tại hoặc đã bị xóa' },
                    { status: 404 },
                );
            } else if (error?.code === 'P2002') {
                // Unique constraint violation
                if (error?.meta?.target?.includes('code')) {
                    return NextResponse.json(
                        { success: false, error: 'Mã dự án đã tồn tại. Vui lòng sử dụng mã khác.' },
                        { status: 409 }, // Conflict
                    );
                } else if (error?.meta?.target?.includes('projectNo')) {
                    return NextResponse.json(
                        { success: false, error: 'Số dự án đã tồn tại. Vui lòng thử lại.' },
                        { status: 409 }, // Conflict
                    );
                } else {
                    throw error;
                }
            } else if (error?.code === 'P2003') {
                // Foreign key constraint violation
                if (error?.meta?.field_name?.includes('customerId')) {
                    return NextResponse.json(
                        { success: false, error: 'Khách hàng không hợp lệ. Vui lòng chọn khách hàng khác.' },
                        { status: 400 },
                    );
                } else {
                    throw error;
                }
            } else {
                throw error;
            }
        }

        // Trigger email if endDate was updated and is defined
        if (endDate) {
            const { getAdminEmails, sendDeadlineReminderEmail, buildProjectUrl } = await import('@/lib/email/send');
            const admins = await getAdminEmails();
            if (admins.length > 0) {
                const deadlineDate = new Date(endDate);
                const diffTime = deadlineDate.getTime() - new Date().getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                await sendDeadlineReminderEmail({
                    to: admins,
                    projectName: project.name,
                    projectNo: project.code || 'N/A',
                    deadline: deadlineDate,
                    daysRemaining: diffDays,
                    projectUrl: buildProjectUrl(project.id),
                });
            }
        }

        // Clear project list cache sau khi update project
        const { cache, cacheKeys } = await import('@/lib/cache');
        cache.clearByPattern('projects:list:');

        return NextResponse.json({
            success: true,
            data: project,
            message: 'Cập nhật dự án thành công',
        });
    } catch (error: any) {
        console.error('Failed to update project:', error);

        if (process.env.NODE_ENV === 'development') {
            console.error('[API] Project update error details:', {
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
                            'Cơ sở dữ liệu đã được khởi tạo. Vui lòng thử lại cập nhật dự án. Nếu vẫn lỗi, vui lòng liên hệ admin.',
                    },
                    { status: 500 },
                );
            } catch (schemaError: any) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Không thể khởi tạo cơ sở dữ liệu. Vui lòng liên hệ admin.',
                        details: process.env.NODE_ENV === 'development' ? schemaError?.message : undefined,
                    },
                    { status: 500 },
                );
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: error?.message || 'Không thể cập nhật dự án. Vui lòng thử lại.',
                details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
            },
            { status: 500 },
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        // Handle both sync and async params (Next.js 15+)
        const resolvedParams = params instanceof Promise ? await params : params;
        
        await prisma.project.delete({
            where: { id: resolvedParams.id },
        });

        return NextResponse.json({
            success: true,
            message: 'Xóa dự án thành công',
        });
    } catch (error: any) {
        console.error('Failed to delete project:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể xóa dự án',
                details:
                    process.env.NODE_ENV === 'development'
                        ? { message: error?.message, code: error?.code, meta: error?.meta }
                        : undefined,
            },
            { status: 500 },
        );
    }
}
