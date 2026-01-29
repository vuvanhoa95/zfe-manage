import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const companyProfileSchema = z.object({
    name: z.string().trim().min(1, 'Vui lòng nhập tên công ty').max(300),
    taxCode: z.string().trim().min(1, 'Vui lòng nhập mã số thuế').max(50),
    address: z.string().trim().min(1, 'Vui lòng nhập địa chỉ').max(500),
    email: z.string().trim().email('Email không hợp lệ').max(200),
    website: z
        .string()
        .trim()
        .max(300)
        .optional()
        .nullable()
        .refine((v) => !v || v.startsWith('http://') || v.startsWith('https://'), {
            message: 'Website phải bắt đầu bằng http:// hoặc https://',
        }),
    phone: z.string().trim().min(1, 'Vui lòng nhập số điện thoại').max(50),
    logoUrl: z.string().trim().max(500).optional().nullable(),
    projectSlogan: z.string().trim().max(300).optional().nullable(),
    signerName: z.string().trim().min(1, 'Vui lòng nhập người đại diện').max(200),
    signerTitle: z.string().trim().min(1, 'Vui lòng nhập chức vụ').max(200),
});

// GET /api/company-profile - Get company profile (single record)
export async function GET() {
    try {
        let profile = await prisma.companyProfile.findUnique({
            where: { id: 1 },
        });

        // Create default profile if doesn't exist
        if (!profile) {
            profile = await prisma.companyProfile.create({
                data: {
                    id: 1,
                    name: 'CÔNG TY TNHH ZFENIX',
                    taxCode: '0110760123',
                    address: 'Số 64 Yên Bình, Phường Phúc La, Quận Hà Đông, Thành phố Hà Nội, Việt Nam',
                    email: 'info@zfenix.vn',
                    website: 'https://zfenix.vn',
                    phone: '0965 999 195',
                    projectSlogan: 'Giải pháp BIM chuyên nghiệp cho dự án của bạn',
                    signerName: 'Vũ Văn Hòa',
                    signerTitle: 'Giám đốc',
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: profile,
        });
    } catch (error) {
        console.error('Error fetching company profile:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể tải thông tin công ty' },
            { status: 500 }
        );
    }
}

// PUT /api/company-profile - Update company profile
export async function PUT(request: NextRequest) {
    try {
        const rawBody: unknown = await request.json();
        const parsed = companyProfileSchema.safeParse(rawBody);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const body = parsed.data;

        const profile = await prisma.companyProfile.upsert({
            where: { id: 1 },
            update: {
                name: body.name,
                taxCode: body.taxCode,
                address: body.address,
                email: body.email,
                website: body.website || null,
                phone: body.phone,
                logoUrl: body.logoUrl || null,
                projectSlogan: body.projectSlogan || null,
                signerName: body.signerName,
                signerTitle: body.signerTitle,
            },
            create: {
                id: 1,
                name: body.name,
                taxCode: body.taxCode,
                address: body.address,
                email: body.email,
                website: body.website || null,
                phone: body.phone,
                logoUrl: body.logoUrl || null,
                projectSlogan: body.projectSlogan || null,
                signerName: body.signerName,
                signerTitle: body.signerTitle,
            },
        });

        return NextResponse.json({
            success: true,
            data: profile,
            message: 'Cập nhật thông tin công ty thành công',
        });
    } catch (error) {
        console.error('Error updating company profile:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể cập nhật thông tin công ty' },
            { status: 500 }
        );
    }
}
