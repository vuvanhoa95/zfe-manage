/**
 * API Route Permission Helpers
 *
 * Dùng trong các API route handlers để kiểm tra quyền phía server.
 *
 * Cách dùng trong API route:
 * ```ts
 * import { requirePermission, requireAuth } from '@/lib/api-auth';
 *
 * export async function DELETE(req: Request) {
 *   const user = await requirePermission('project:delete');
 *   // nếu không có quyền sẽ throw NextResponse 401/403 ngay
 *   ...
 * }
 * ```
 */

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { can, canInProject, type Permission } from '@/lib/rbac';

export type SessionUser = {
    id: string;
    email: string;
    name: string;
    role: string;
};

/**
 * Lấy user từ session. Trả về null nếu chưa đăng nhập.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    const user = session.user as any;
    if (!user.id) return null;

    return {
        id: user.id as string,
        email: user.email as string,
        name: user.name as string,
        role: (user.role ?? 'USER') as string,
    };
}

/**
 * Lấy user từ session, throw 401 nếu chưa đăng nhập.
 */
export async function requireAuth(): Promise<SessionUser> {
    const user = await getSessionUser();
    if (!user) {
        throw new ApiAuthError(401, 'Vui lòng đăng nhập để tiếp tục');
    }
    return user;
}

/**
 * Yêu cầu user đã đăng nhập VÀ có permission cụ thể.
 * Throw 401 nếu chưa đăng nhập, 403 nếu không đủ quyền.
 */
export async function requirePermission(
    permission: Permission,
    projectMemberRole?: string | null
): Promise<SessionUser> {
    const user = await requireAuth();

    const hasPermission = projectMemberRole !== undefined
        ? canInProject(user.role, projectMemberRole, permission)
        : can(user.role, permission);

    if (!hasPermission) {
        throw new ApiAuthError(
            403,
            `Bạn không có quyền thực hiện hành động này (${permission})`
        );
    }

    return user;
}

/**
 * Yêu cầu user phải là ADMIN.
 */
export async function requireAdmin(): Promise<SessionUser> {
    return requirePermission('user:manage_roles');
}

/**
 * Yêu cầu user phải là ADMIN hoặc PM.
 */
export async function requireAdminOrPM(): Promise<SessionUser> {
    return requirePermission('dashboard:view_all_projects');
}

/**
 * Custom error class cho auth errors trong API routes.
 * Dễ catch và convert thành NextResponse.
 */
export class ApiAuthError extends Error {
    constructor(
        public readonly statusCode: 401 | 403,
        message: string
    ) {
        super(message);
        this.name = 'ApiAuthError';
    }
}

/**
 * Helper để wrap async API handlers với error handling chuẩn.
 *
 * ```ts
 * export const DELETE = withAuth(async (req, user) => {
 *   // user đã được xác thực
 *   return NextResponse.json({ success: true });
 * }, 'project:delete');
 * ```
 */
export function withAuth(
    handler: (req: Request, user: SessionUser) => Promise<NextResponse>,
    permission?: Permission
) {
    return async (req: Request): Promise<NextResponse> => {
        try {
            const user = permission
                ? await requirePermission(permission)
                : await requireAuth();

            return await handler(req, user);
        } catch (error) {
            if (error instanceof ApiAuthError) {
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: error.statusCode }
                );
            }
            throw error;
        }
    };
}

/**
 * Tạo NextResponse lỗi auth để dùng trực tiếp trong catch blocks.
 */
export function authErrorResponse(error: unknown): NextResponse | null {
    if (error instanceof ApiAuthError) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.statusCode }
        );
    }
    return null;
}
