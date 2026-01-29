import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'Không có file được upload' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: 'Kích thước file không được vượt quá 5MB' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'staff-avatars');
        if (!existsSync(uploadsDir)) {
            mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop();
        const filename = `${timestamp}-${randomString}.${fileExtension}`;
        const filepath = join(uploadsDir, filename);

        // Write file
        await writeFile(filepath, buffer);

        // Return URL
        const url = `/uploads/staff-avatars/${filename}`;

        return NextResponse.json({
            success: true,
            data: { url },
        });
    } catch (error: any) {
        console.error('Failed to upload file:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to upload file' },
            { status: 500 }
        );
    }
}
