import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'Không có file được upload' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP, SVG)' },
                { status: 400 }
            );
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: 'Kích thước file không được vượt quá 5MB' },
                { status: 400 }
            );
        }

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const ext = file.name.split('.').pop() || 'png';
        const filename = `company-logo/${timestamp}-${randomStr}.${ext}`;

        // Upload lên Vercel Blob (persistent cloud storage)
        const blob = await put(filename, file, {
            access: 'public',
            contentType: file.type,
        });

        return NextResponse.json({ success: true, data: { url: blob.url } }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to upload file';
        console.error('Failed to upload company logo:', error);

        // Fallback nếu Vercel Blob chưa được cấu hình (BLOB_READ_WRITE_TOKEN chưa set)
        if (message.includes('BLOB_READ_WRITE_TOKEN') || message.includes('token')) {
            return NextResponse.json(
                { success: false, error: 'Chưa cấu hình Vercel Blob Storage. Vui lòng thêm BLOB_READ_WRITE_TOKEN vào biến môi trường.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
