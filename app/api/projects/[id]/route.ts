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
        
        const project = await prisma.project.findUnique({
            where: { id: resolvedParams.id },
            include: {
                customer: true,
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
                quotations: {
                    include: {
                        customer: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50, // Limit to last 50 quotations
                },
                cashFlows: {
                    include: {
                        quotation: {
                            select: { id: true, quotationNo: true },
                        },
                        createdBy: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { date: 'desc' },
                    take: 100, // Limit to last 100 cash flows
                },
            },
        });

        if (!project) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }

        // Handle case where createdBy user might not exist (data integrity issue)
        // This can happen if user was deleted or project was created with invalid user ID
        if (!project.createdBy && project.createdById) {
            console.warn(`Project ${resolvedParams.id} has invalid createdById: ${project.createdById}`);
            // Try to get first available user as fallback for display
            try {
                const fallbackUser = await prisma.user.findFirst({
                    select: { id: true, name: true, email: true },
                    orderBy: { createdAt: 'asc' },
                });
                if (fallbackUser) {
                    (project as any).createdBy = fallbackUser;
                }
            } catch (userError) {
                // If we can't get a fallback user, just leave it null
                console.warn('Could not get fallback user:', userError);
            }
        }

        return NextResponse.json({ success: true, data: project });
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
