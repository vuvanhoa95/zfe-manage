import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RBAC_DEFAULTS, computePermissions, type PermissionOverrides, type SystemRole } from '@/lib/rbac';

const CONFIG_KEY = 'permission_overrides';

/**
 * GET /api/admin/permissions/runtime
 * Trả về permission matrix hiện tại (defaults + overrides từ DB)
 * Dùng bởi client để khởi tạo runtime RBAC
 * Cache ngắn: 60s (revalidate khi admin save)
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key: CONFIG_KEY },
            select: { value: true, updatedAt: true, updatedBy: true },
        });

        let overrides: PermissionOverrides = {};
        if (config?.value) {
            try {
                overrides = JSON.parse(config.value) as PermissionOverrides;
            } catch {
                overrides = {};
            }
        }

        // Tính runtime permissions (defaults + overrides)
        const runtimeSets = computePermissions(overrides);

        // Convert Set → Array để serialize
        const runtime: Record<SystemRole, string[]> = {
            ADMIN: Array.from(runtimeSets.ADMIN),
            PM:    Array.from(runtimeSets.PM),
            USER:  Array.from(runtimeSets.USER),
        };

        return NextResponse.json(
            {
                success: true,
                data: {
                    runtime,
                    overrides,
                    hasOverrides: Object.keys(overrides).length > 0,
                    updatedAt: config?.updatedAt ?? null,
                    updatedBy: config?.updatedBy ?? null,
                },
            },
            {
                headers: {
                    'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
                },
            }
        );
    } catch (error) {
        console.error('[API] Failed to get runtime permissions:', error);
        // Fallback to defaults
        const runtime: Record<SystemRole, string[]> = {
            ADMIN: RBAC_DEFAULTS.ADMIN,
            PM:    RBAC_DEFAULTS.PM,
            USER:  RBAC_DEFAULTS.USER,
        };
        return NextResponse.json({ success: true, data: { runtime, overrides: {}, hasOverrides: false } });
    }
}
