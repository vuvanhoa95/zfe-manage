'use client';

import { useSession } from 'next-auth/react';
import { can, canInProject, type Permission } from '@/lib/rbac';

interface PermissionGuardProps {
  /** Permission cần kiểm tra */
  permission: Permission;
  /** Role của user trong project (nếu có context project) */
  projectMemberRole?: string | null;
  /** Nội dung hiển thị khi có quyền */
  children: React.ReactNode;
  /** Nội dung thay thế khi KHÔNG có quyền (mặc định: ẩn hoàn toàn) */
  fallback?: React.ReactNode;
  /** Nếu true, render children nhưng disabled thay vì ẩn */
  disabledInstead?: boolean;
}

/**
 * PermissionGuard — Component bọc nội dung cần phân quyền.
 *
 * Cách dùng:
 * ```tsx
 * <PermissionGuard permission="project:delete">
 *   <button>Xóa dự án</button>
 * </PermissionGuard>
 * ```
 *
 * Với project context:
 * ```tsx
 * <PermissionGuard permission="task:edit" projectMemberRole={memberRole}>
 *   <EditButton />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  permission,
  projectMemberRole,
  children,
  fallback = null,
  disabledInstead = false,
}: PermissionGuardProps) {
  const { data: session, status } = useSession();

  // Đang tải session → không render gì (tránh flash)
  if (status === 'loading') return null;

  const userRole = (session?.user as any)?.role as string | undefined;
  const hasPermission = projectMemberRole !== undefined
    ? canInProject(userRole, projectMemberRole, permission)
    : can(userRole, permission);

  if (!hasPermission) {
    if (disabledInstead) {
      return (
        <span
          className="inline-flex opacity-40 cursor-not-allowed pointer-events-none select-none"
          title="Bạn không có quyền thực hiện hành động này"
        >
          {children}
        </span>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook để kiểm tra permission trong component logic (không dùng RBAC wrapper)
 *
 * ```tsx
 * const { can: userCan } = usePermissions();
 * if (userCan('project:delete')) { ... }
 * ```
 */
export function usePermissions(projectMemberRole?: string | null) {
  const { data: session, status } = useSession();
  const userRole = (session?.user as any)?.role as string | undefined;
  const isLoading = status === 'loading';

  return {
    isLoading,
    userRole,
    can: (permission: Permission) =>
      projectMemberRole !== undefined
        ? canInProject(userRole, projectMemberRole, permission)
        : can(userRole, permission),
    isAdmin: (userRole ?? '').toUpperCase() === 'ADMIN',
    isPM: (userRole ?? '').toUpperCase() === 'PM',
    isAdminOrPM: ['ADMIN', 'PM'].includes((userRole ?? '').toUpperCase()),
  };
}
