import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { projectUpdateSchema, type ProjectUpdateInput } from '@/lib/validation/project';

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
            const [createdBy, quotations, cashFlows] = await Promise.all([
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
                }).catch((err) => {
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
                    }).catch((fallbackErr) => {
                        console.error('Error fetching cash flows without createdBy:', fallbackErr);
                        return [];
                    });
                }),
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

            return NextResponse.json({ success: true, data: project });
        } catch (relationError: any) {
            console.error('Error fetching project relations:', relationError);
            // Return project with minimal data if relations fail
            (project as any).quotations = [];
            (project as any).cashFlows = [];
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
        // Handle both sync and async params (Next.js 15+)
        const resolvedParams = params instanceof Promise ? await params : params;

        const json = await request.json();
        const parsed = projectUpdateSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Dữ liệu dự án không hợp lệ', details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const body: ProjectUpdateInput = parsed.data;
        const { name, code, description, customerId, location, startDate, endDate, totalArea, status, notes, imageUrl } = body;

        const project = await prisma.project.update({
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

        return NextResponse.json({
            success: true,
            data: project,
            message: 'Cập nhật dự án thành công',
        });
    } catch (error: any) {
        console.error('Failed to update project:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Không thể cập nhật dự án',
                details:
                    process.env.NODE_ENV === 'development'
                        ? { message: error?.message, code: error?.code, meta: error?.meta }
                        : undefined,
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
