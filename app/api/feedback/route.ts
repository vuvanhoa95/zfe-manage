import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { logInfo, logError } from '@/lib/logging';

const feedbackSchema = z.object({
    module: z.enum(['dashboard', 'report', 'task', 'other']),
    type: z.enum(['bug', 'feature', 'improvement', 'other']),
    message: z.string().min(5).max(2000),
    projectId: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = feedbackSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Dữ liệu feedback không hợp lệ',
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const { module, type, message, projectId, metadata } = parsed.data;

        // Lưu feedback vào database (hoặc external service)
        // Tạm thời chỉ log, có thể tạo Feedback model sau
        logInfo('Feedback received', {
            module,
            action: 'submit_feedback',
            userId: (session.user as any).id,
            projectId,
            metadata: {
                type,
                message: message.substring(0, 100), // Log first 100 chars
                ...metadata,
            },
        });

        // TODO: Lưu vào database khi có Feedback model
        // await prisma.feedback.create({
        //     data: {
        //         userId: (session.user as any).id,
        //         module,
        //         type,
        //         message,
        //         projectId,
        //         metadata: metadata || {},
        //     },
        // });

        return NextResponse.json({
            success: true,
            message: 'Cảm ơn bạn đã gửi feedback! Chúng tôi sẽ xem xét và cải thiện.',
        });
    } catch (error) {
        logError('Failed to submit feedback', error, {
            module: 'other',
            action: 'submit_feedback',
        });

        return NextResponse.json(
            {
                success: false,
                error: 'Không thể gửi feedback. Vui lòng thử lại sau.',
            },
            { status: 500 },
        );
    }
}
