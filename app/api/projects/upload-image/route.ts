import { NextRequest, NextResponse } from 'next/server';

// Lưu ảnh dự án dưới dạng data URL (base64) để hoạt động ổn trên môi trường serverless (Vercel)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Không có file được upload' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)' },
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/png';

    // Lưu trực tiếp vào DB dưới dạng data URL (không ghi file lên filesystem)
    const url = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({ success: true, data: { url } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upload file';
    console.error('Failed to upload project image:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

