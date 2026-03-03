'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import {
    setRuntimePermissions,
    can as staticCan,
    canInProject as staticCanInProject,
    type Permission,
    type PermissionOverrides,
    type SystemRole,
} from '@/lib/rbac';

// =====================================================
// CONTEXT
// =====================================================

interface RBACContextType {
    isLoaded: boolean;
    hasOverrides: boolean;
    can: (permission: Permission) => boolean;
    canInProject: (projectMemberRole: string | null | undefined, permission: Permission) => boolean;
    reload: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType>({
    isLoaded: false,
    hasOverrides: false,
    can: () => false,
    canInProject: () => false,
    reload: async () => {},
});

// =====================================================
// PROVIDER
// =====================================================

interface RBACProviderProps {
    children: ReactNode;
}

/**
 * RBACProvider — Load runtime permissions từ DB và inject vào context.
 *
 * Đặt trong layout.tsx bên ngoài tất cả components cần kiểm tra quyền.
 * Sau khi admin thay đổi permissions, gọi `reload()` để refresh.
 */
export function RBACProvider({ children }: RBACProviderProps) {
    const { data: session, status } = useSession();
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasOverrides, setHasOverrides] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/permissions/runtime', {
                cache: 'no-store',
            });
            if (!res.ok) return;
            const data = await res.json() as {
                success: boolean;
                data: {
                    runtime: Record<SystemRole, string[]>;
                    overrides: PermissionOverrides;
                    hasOverrides: boolean;
                };
            };
            if (data.success && data.data) {
                // Convert string[][] → Set, then set runtime
                const overrides = data.data.overrides;
                setRuntimePermissions(overrides);
                setHasOverrides(data.data.hasOverrides);
            }
        } catch (e) {
            console.warn('Failed to load runtime permissions, using defaults');
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Load khi user đã đăng nhập
    useEffect(() => {
        if (status === 'authenticated') {
            const role = (session?.user as any)?.role as string | null;
            setUserRole(role);
            void load();
        } else if (status === 'unauthenticated') {
            setIsLoaded(true);
            setUserRole(null);
        }
    }, [status, session, load]);

    const canFn = useCallback(
        (permission: Permission): boolean => {
            return staticCan(userRole, permission);
        },
        [userRole]
    );

    const canInProjectFn = useCallback(
        (projectMemberRole: string | null | undefined, permission: Permission): boolean => {
            return staticCanInProject(userRole, projectMemberRole, permission);
        },
        [userRole]
    );

    return (
        <RBACContext.Provider
            value={{
                isLoaded,
                hasOverrides,
                can: canFn,
                canInProject: canInProjectFn,
                reload: load,
            }}
        >
            {children}
        </RBACContext.Provider>
    );
}

// =====================================================
// HOOK
// =====================================================

/**
 * Hook để sử dụng RBAC trong component.
 *
 * ```tsx
 * const { can, canInProject } = useRBAC();
 * if (can('project:delete')) { ... }
 * ```
 */
export function useRBAC() {
    return useContext(RBACContext);
}

/**
 * Hook để reload permissions sau khi admin thay đổi.
 */
export function useReloadPermissions() {
    const { reload } = useContext(RBACContext);
    return reload;
}
