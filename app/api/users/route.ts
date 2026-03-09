import { NextRequest, NextResponse } from 'next/server';
import { ensureCoreSchema, isMissingTableError } from '@/lib/db-schema';
import { requirePermission, requireAuth, ApiAuthError } from '@/lib/api-auth';
const UserStatus = { ACTIVE: 'ACTIVE', PENDING: 'PENDING', SUSPENDED: 'SUSPENDED' } as const;

/**
 * GET /api/users
 * Lấy danh sách users (để chọn người phụ trách, assign task, etc.)
 */
export async function GET(request: NextRequest) {
    try {
        // Dynamic import Prisma Client để tránh lỗi import ở module level
        const { prisma } = await import('@/lib/prisma');

        // Đảm bảo schema tồn tại trước khi thao tác với database
        try {
            await ensureCoreSchema();
        } catch (schemaError: any) {
            // Log nhưng không throw - có thể schema đã tồn tại một phần
            if (process.env.NODE_ENV === 'development') {
                console.warn('[API] ensureCoreSchema warning (may be safe to ignore):', schemaError?.message);
            }
        }

        // Kiểm tra authentication — mọi user đã login đều có thể xem danh sách
        const currentUser = await requireAuth();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const role = searchParams.get('role');
        const status = searchParams.get('status');
        // Tăng limit mặc định lên 1000 để hiển thị nhiều users hơn
        // Nếu cần nhiều hơn, có thể thêm pagination sau
        const limit = parseInt(searchParams.get('limit') || '1000', 10);

        const where: any = {};

        if (search) {
            // SQLite không hỗ trợ mode: 'insensitive', dùng contains thôi
            // Case-insensitive sẽ được xử lý ở application level nếu cần
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
            ];
        }

        if (role) {
            where.role = role;
        }

        if (status) {
            where.status = status;
        }

        // Lấy đầy đủ thông tin hồ sơ người dùng theo schema hiện tại
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                title: true,
                department: true,
                experience: true,
                bankAccount: true,
                taxCode: true,
                status: true,
                // Revit Add-in License fields
                revitLicenseActive: true,
                revitLicensePlan: true,
                revitLicenseStart: true,
                revitLicenseExpiry: true,
                revitMachineId: true,
                revitLastLogin: true,
            },
            orderBy: {
                name: 'asc',
            },
            take: limit,
        });

        return NextResponse.json({
            success: true,
            data: users,
            count: users.length,
        });
    } catch (error: any) {
        console.error('[API] Failed to fetch users:', error);

        // Log chi tiết trong development
        if (process.env.NODE_ENV === 'development') {
            console.error('[API] Fetch users error details:', {
                message: error?.message,
                code: error?.code,
                meta: error?.meta,
                stack: error?.stack,
                name: error?.name,
            });
        }

        // Xử lý các loại lỗi cụ thể
        let errorMessage = 'Không thể tải danh sách người dùng';
        let statusCode = 500;

        // Kiểm tra các loại lỗi cụ thể
        if (isMissingTableError(error)) {
            errorMessage = 'Cơ sở dữ liệu chưa được khởi tạo. Vui lòng thử lại sau.';
        } else if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database server')) {
            errorMessage = 'Không thể kết nối đến cơ sở dữ liệu. Vui lòng kiểm tra kết nối.';
        } else if (error?.code === 'P2002') {
            errorMessage = 'Lỗi dữ liệu trùng lặp trong cơ sở dữ liệu.';
        } else if (error?.code === 'P2025') {
            errorMessage = 'Không tìm thấy dữ liệu trong cơ sở dữ liệu.';
        } else if (error?.message) {
            // Trong development, hiển thị error message chi tiết hơn
            if (process.env.NODE_ENV === 'development') {
                errorMessage = `Lỗi: ${error.message}`;
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? {
                    message: error?.message,
                    code: error?.code,
                    meta: error?.meta,
                    name: error?.name,
                } : undefined,
            },
            { status: statusCode }
        );
    }
}

/**
 * PATCH /api/users
 * Cập nhật trạng thái user (Approve/Reject/Suspend)
 */
export async function PATCH(request: NextRequest) {
    try {
        const { prisma } = await import('@/lib/prisma');
        // Chỉ ADMIN mới toggle status
        const session = await requirePermission('user:toggle_status');

        const body = await request.json();
        const { userId, status, revitLicenseActive, revitLicensePlan, revitLicenseStart, revitLicenseExpiry, revitMachineId, revitActiveToken, mcpLicenseActive, mcpLicensePlan, mcpLicenseStart, mcpLicenseExpiry } = body;

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
        }

        // Build update data dynamically
        const updateData: Record<string, unknown> = {};

        // Toggle account status
        if (status !== undefined) {
            const validStatuses = Object.values(UserStatus);
            if (!validStatuses.includes(status as typeof UserStatus[keyof typeof UserStatus])) {
                return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
            }
            updateData.status = status;
        }

        // Toggle Revit License
        if (revitLicenseActive !== undefined) {
            updateData.revitLicenseActive = Boolean(revitLicenseActive);
        }

        // Set Revit License Plan
        if (revitLicensePlan !== undefined) {
            updateData.revitLicensePlan = revitLicensePlan || null;
        }

        // Set Revit License Start date
        if (revitLicenseStart !== undefined) {
            updateData.revitLicenseStart = revitLicenseStart ? new Date(revitLicenseStart) : null;
        }

        // Set Revit License Expiry
        if (revitLicenseExpiry !== undefined) {
            updateData.revitLicenseExpiry = revitLicenseExpiry ? new Date(revitLicenseExpiry) : null;
        }

        // Reset Revit device (set to null to allow re-login from another machine)
        if (revitMachineId !== undefined) {
            updateData.revitMachineId = revitMachineId;
        }
        if (revitActiveToken !== undefined) {
            updateData.revitActiveToken = revitActiveToken;
        }

        // MCP AI License fields
        if (mcpLicenseActive !== undefined) {
            updateData.mcpLicenseActive = Boolean(mcpLicenseActive);
        }
        if (mcpLicensePlan !== undefined) {
            updateData.mcpLicensePlan = mcpLicensePlan || null;
        }
        if (mcpLicenseStart !== undefined) {
            updateData.mcpLicenseStart = mcpLicenseStart ? new Date(mcpLicenseStart) : null;
        }
        if (mcpLicenseExpiry !== undefined) {
            updateData.mcpLicenseExpiry = mcpLicenseExpiry ? new Date(mcpLicenseExpiry) : null;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, error: 'No data to update' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                status: true,
                revitLicenseActive: true,
                revitLicensePlan: true,
                revitLicenseStart: true,
                revitLicenseExpiry: true,
                revitMachineId: true,
                revitLastLogin: true,
                mcpLicenseActive: true,
                mcpLicensePlan: true,
                mcpLicenseStart: true,
                mcpLicenseExpiry: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: updatedUser,
            message: `User ${updatedUser.email} has been updated`
        });
    } catch (error: any) {
        console.error('[API] Failed to update user:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Lỗi khi cập nhật user' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/users
 * Xóa user (chỉ ADMIN, không tự xóa chính mình, không xóa super admin)
 *
 * Safe-delete: chạy trong transaction để xử lý tất cả FK constraints
 *   - Nullable FKs (assignedToId, userId...) → set NULL
 *   - Non-nullable FKs (createdById) → chuyển sang admin đang thực hiện xóa
 */
export async function DELETE(request: NextRequest) {
    try {
        const { prisma } = await import('@/lib/prisma');
        // Chỉ ADMIN mới xóa user
        const session = await requirePermission('user:delete');

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Thiếu userId' }, { status: 400 });
        }

        // Không cho xóa chính mình
        if (session.id === userId) {
            return NextResponse.json({ success: false, error: 'Không thể xóa tài khoản đang đăng nhập' }, { status: 400 });
        }

        const adminId = session.id;

        // Kiểm tra user tồn tại
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy user' }, { status: 404 });
        }

        // Không cho xóa super admin (cả 2 tài khoản mặc định không thể xóa)
        const SUPER_ADMIN_EMAILS = [
            '7604vuhoa@gmail.com',  // Google Admin
            'hoavv@zfenix.com',     // Microsoft Admin
        ];
        if (SUPER_ADMIN_EMAILS.includes(targetUser.email?.toLowerCase() ?? '')) {
            return NextResponse.json({ success: false, error: 'Không thể xóa tài khoản Super Admin mặc định' }, { status: 403 });
        }

        await prisma.$transaction(async (tx) => {
            // 1. Xóa records có Cascade (Account, Session)
            await tx.account.deleteMany({ where: { userId } });
            await tx.session.deleteMany({ where: { userId } });

            // 2. Nullable FKs → set NULL
            await tx.task.updateMany({ where: { assignedToId: userId }, data: { assignedToId: null } });
            await tx.customFieldValue.updateMany({ where: { userId }, data: { userId: null } });

            // 3. TaskComment → reassign sang admin (giữ lại nội dung comment)
            await tx.taskComment.updateMany({ where: { userId }, data: { userId: adminId } });

            // 4. TaskAttachment → reassign sang admin (giữ lại file đính kèm)
            await tx.taskAttachment.updateMany({ where: { uploadedById: userId }, data: { uploadedById: adminId } });

            // 5. ProjectMember → reassign cẩn thận để tránh duplicate (unique: [projectId, userId])
            //    Lấy danh sách project mà user là member
            const userMemberships = await tx.projectMember.findMany({
                where: { userId },
                select: { id: true, projectId: true },
            });
            if (userMemberships.length > 0) {
                // Lấy project mà admin đã là member rồi
                const projectIds = userMemberships.map((m) => m.projectId);
                const adminExistingMemberships = await tx.projectMember.findMany({
                    where: { userId: adminId, projectId: { in: projectIds } },
                    select: { projectId: true },
                });
                const adminMemberProjectIds = new Set(adminExistingMemberships.map((m) => m.projectId));

                // Project admin chưa là member → reassign
                const toReassign = userMemberships
                    .filter((m) => !adminMemberProjectIds.has(m.projectId))
                    .map((m) => m.id);

                // Project admin đã là member rồi → xóa bản ghi cũ (tránh duplicate)
                const toDelete = userMemberships
                    .filter((m) => adminMemberProjectIds.has(m.projectId))
                    .map((m) => m.id);

                if (toReassign.length > 0) {
                    await tx.projectMember.updateMany({
                        where: { id: { in: toReassign } },
                        data: { userId: adminId },
                    });
                }
                if (toDelete.length > 0) {
                    await tx.projectMember.deleteMany({ where: { id: { in: toDelete } } });
                }
            }

            // 6. Non-nullable FKs (createdById) → chuyển sang admin để giữ dữ liệu nghiệp vụ
            await tx.project.updateMany({ where: { createdById: userId }, data: { createdById: adminId } });
            await tx.cashFlow.updateMany({ where: { createdById: userId }, data: { createdById: adminId } });
            await tx.quotation.updateMany({ where: { createdById: userId }, data: { createdById: adminId } });
            await tx.quotationRevision.updateMany({ where: { createdById: userId }, data: { createdById: adminId } });
            await tx.quotationTemplate.updateMany({ where: { createdById: userId }, data: { createdById: adminId } });

            // 7. Xóa user sau khi tất cả FK đã được xử lý an toàn
            await tx.user.delete({ where: { id: userId } });
        }, { maxWait: 10000, timeout: 30000 });

        return NextResponse.json({
            success: true,
            message: `Đã xóa user ${targetUser.email}`,
        });
    } catch (error: any) {
        if (error instanceof ApiAuthError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        console.error('[API] Failed to delete user:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Lỗi khi xóa user' },
            { status: 500 }
        );
    }
}

