import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const MAX_FILE_SIZE = 45 * 1024 * 1024; // 45MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [
    ...ALLOWED_IMAGE_TYPES,
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'text/plain',
    'text/csv',
];

// GET comments + activities for a cashflow
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; cashflowId: string }> | { id: string; cashflowId: string } }
) {
    try {
        const p = params instanceof Promise ? await params : params;

        const [comments, activities] = await Promise.all([
            prisma.cashFlowComment.findMany({
                where: { cashFlowId: p.cashflowId },
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    attachments: {
                        select: { id: true, fileName: true, fileType: true, fileSize: true, url: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.cashFlowActivity.findMany({
                where: { cashFlowId: p.cashflowId },
                include: { user: { select: { id: true, name: true, image: true } } },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
        ]);

        // Parse mentions JSON for each comment
        const enrichedComments = comments.map((c) => ({
            ...c,
            mentions: c.mentions ? JSON.parse(c.mentions) : [],
        }));

        return NextResponse.json({ success: true, data: { comments: enrichedComments, activities } });
    } catch (error: any) {
        console.error('Failed to load comments/activities:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể tải bình luận' },
            { status: 500 }
        );
    }
}

// POST a new comment (supports FormData with files or JSON)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; cashflowId: string }> | { id: string; cashflowId: string } }
) {
    try {
        const p = params instanceof Promise ? await params : params;
        const session = await getServerSession(authOptions);
        const userId = session?.user && (session.user as any).id;

        let resolvedUserId: string;
        if (!userId) {
            const defaultUser = await prisma.user.findFirst({
                orderBy: { createdAt: 'asc' },
                select: { id: true },
            });
            if (!defaultUser) {
                return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
            }
            resolvedUserId = defaultUser.id;
        } else {
            resolvedUserId = userId;
        }

        // Verify cashflow exists and belongs to project
        const cf = await prisma.cashFlow.findUnique({
            where: { id: p.cashflowId },
            select: { id: true, projectId: true },
        });
        if (!cf || cf.projectId !== p.id) {
            return NextResponse.json({ success: false, error: 'Dòng tiền không tồn tại' }, { status: 404 });
        }

        let content = '';
        let mentionIds: string[] = [];
        const fileBuffers: Array<{ fileName: string; fileType: string; fileSize: number; base64: string }> = [];

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            // Handle FormData (files + text)
            const formData = await request.formData();
            content = (formData.get('content') as string) || '';
            const mentionsRaw = formData.get('mentions') as string;
            if (mentionsRaw) {
                try { mentionIds = JSON.parse(mentionsRaw); } catch { }
            }

            // Process files
            const files = formData.getAll('files') as File[];
            for (const file of files) {
                if (file.size > MAX_FILE_SIZE) {
                    return NextResponse.json(
                        { success: false, error: `File "${file.name}" vượt quá 45MB` },
                        { status: 400 }
                    );
                }
                if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                    return NextResponse.json(
                        { success: false, error: `Loại file "${file.name}" không được hỗ trợ` },
                        { status: 400 }
                    );
                }

                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

                fileBuffers.push({
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    base64,
                });
            }
        } else {
            // Handle JSON
            const body = await request.json();
            content = body.content || '';
            mentionIds = body.mentions || [];
        }

        if (!content.trim() && fileBuffers.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Nội dung hoặc file không được trống' },
                { status: 400 }
            );
        }

        // Create comment with attachments in a transaction
        const comment = await prisma.$transaction(async (tx) => {
            const created = await tx.cashFlowComment.create({
                data: {
                    cashFlowId: p.cashflowId,
                    userId: resolvedUserId,
                    content: content.trim(),
                    mentions: mentionIds.length > 0 ? JSON.stringify(mentionIds) : null,
                },
            });

            // Create attachments
            if (fileBuffers.length > 0) {
                await tx.cashFlowCommentAttachment.createMany({
                    data: fileBuffers.map((f) => ({
                        commentId: created.id,
                        fileName: f.fileName,
                        fileType: f.fileType,
                        fileSize: f.fileSize,
                        url: f.base64,
                    })),
                });
            }

            // Return with relations
            return tx.cashFlowComment.findUnique({
                where: { id: created.id },
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    attachments: {
                        select: { id: true, fileName: true, fileType: true, fileSize: true, url: true },
                    },
                },
            });
        });

        // Log activity
        await prisma.cashFlowActivity.create({
            data: {
                cashFlowId: p.cashflowId,
                userId: resolvedUserId,
                action: 'COMMENT',
                summary: fileBuffers.length > 0
                    ? `Đã thêm bình luận với ${fileBuffers.length} file đính kèm`
                    : 'Đã thêm bình luận',
            },
        });

        // Create notifications for mentioned users
        if (mentionIds.length > 0) {
            const commenterName = comment?.user?.name || 'Ai đó';
            const uniqueMentions = [...new Set(mentionIds)].filter((uid) => uid !== resolvedUserId);

            if (uniqueMentions.length > 0) {
                await prisma.notification.createMany({
                    data: uniqueMentions.map((uid) => ({
                        userId: uid,
                        type: 'MENTION',
                        title: `${commenterName} đã nhắc đến bạn`,
                        message: content.trim().length > 100
                            ? content.trim().slice(0, 100) + '...'
                            : content.trim() || 'trong bình luận dòng tiền',
                        link: `/projects/${p.id}`,
                    })),
                });
            }
        }

        return NextResponse.json({ success: true, data: comment }, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create comment:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể thêm bình luận' },
            { status: 500 }
        );
    }
}
