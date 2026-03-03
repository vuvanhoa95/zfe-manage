import { NextRequest, NextResponse } from 'next/server';

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

        const maxSize = 2 * 1024 * 1024; // 2MB (Base64 tăng ~33% kích thước)
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: 'Kích thước file không được vượt quá 2MB' },
                { status: 400 }
            );
        }

        // Chuyển file thành Base64 Data URL - lưu trực tiếp vào database
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        return NextResponse.json({ success: true, data: { url: dataUrl } }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to upload file';
        console.error('Failed to upload company logo:', error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
