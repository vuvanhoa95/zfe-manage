import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, ApiAuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { RBAC_DEFAULTS, type PermissionOverrides } from '@/lib/rbac';

const CONFIG_KEY = 'permission_overrides';

/**
 * GET /api/admin/permissions
 * Lấy permission config hiện tại (defaults + overrides từ DB)
 */
export async function GET() {
    try {
        await requirePermission('user:manage_roles');

        const config = await prisma.systemConfig.findUnique({
            where: { key: CONFIG_KEY },
        });

        let overrides: PermissionOverrides = {};
        if (config?.value) {
            try {
                overrides = JSON.parse(config.value) as PermissionOverrides;
            } catch {
                overrides = {};
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                defaults: RBAC_DEFAULTS,
                overrides,
                updatedAt: config?.updatedAt ?? null,
                updatedBy: config?.updatedBy ?? null,
            },
        });
    } catch (error) {
        if (error instanceof ApiAuthError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        console.error('[API] Failed to get permission config:', error);
        return NextResponse.json({ success: false, error: 'Lỗi khi tải cấu hình quyền' }, { status: 500 });
    }
}

/**
 * POST /api/admin/permissions
 * Lưu permission overrides (chỉ lưu những gì khác với defaults)
 */
export async function POST(request: NextRequest) {
    try {
        const user = await requirePermission('user:manage_roles');

        const body = await request.json() as { overrides: PermissionOverrides };
        const { overrides } = body;

        if (!overrides || typeof overrides !== 'object') {
            return NextResponse.json({ success: false, error: 'Dữ liệu không hợp lệ' }, { status: 400 });
        }

        // Validate: chỉ chứa các role và permission hợp lệ
        const validRoles = ['ADMIN', 'PM', 'USER'];
        for (const role of Object.keys(overrides)) {
            if (!validRoles.includes(role)) {
                return NextResponse.json({ success: false, error: `Role không hợp lệ: ${role}` }, { status: 400 });
            }
        }

        await prisma.systemConfig.upsert({
            where: { key: CONFIG_KEY },
            create: {
                key: CONFIG_KEY,
                value: JSON.stringify(overrides),
                label: 'Cấu hình phân quyền theo role',
                updatedBy: user.email,
            },
            update: {
                value: JSON.stringify(overrides),
                updatedBy: user.email,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Đã lưu cấu hình phân quyền',
        });
    } catch (error) {
        if (error instanceof ApiAuthError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        console.error('[API] Failed to save permission config:', error);
        return NextResponse.json({ success: false, error: 'Lỗi khi lưu cấu hình quyền' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/permissions
 * Reset về defaults (xóa overrides)
 */
export async function DELETE() {
    try {
        const user = await requirePermission('user:manage_roles');

        await prisma.systemConfig.deleteMany({
            where: { key: CONFIG_KEY },
        });

        return NextResponse.json({
            success: true,
            message: 'Đã reset về cấu hình mặc định',
        });
    } catch (error) {
        if (error instanceof ApiAuthError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        console.error('[API] Failed to reset permission config:', error);
        return NextResponse.json({ success: false, error: 'Lỗi khi reset cấu hình' }, { status: 500 });
    }
}
