/**
 * Permission system for Dashboard/Report access control
 */

export type UserRole = 'ADMIN' | 'USER' | 'PM' | 'LEAD' | 'MEMBER' | 'VIEWER';
export type ProjectMemberRole = 'MANAGER' | 'MEMBER' | 'VIEWER';

export type Permission = 'view_dashboard' | 'view_report' | 'export_report' | 'view_all_projects';

/**
 * Check if user has permission to view Dashboard
 */
export function canViewDashboard(userRole?: string | null, projectMemberRole?: string | null): boolean {
    // Admin và PM có thể xem tất cả
    if (userRole === 'ADMIN' || userRole === 'PM') {
        return true;
    }

    // Project Manager trong project có thể xem
    if (projectMemberRole === 'MANAGER') {
        return true;
    }

    // Lead và Member có thể xem
    if (userRole === 'LEAD' || projectMemberRole === 'MEMBER') {
        return true;
    }

    // Viewer chỉ xem một số phần (có thể customize sau)
    if (projectMemberRole === 'VIEWER') {
        return true; // Cho phép xem nhưng có thể ẩn một số thông tin nhạy cảm
    }

    return false;
}

/**
 * Check if user has permission to view Report
 */
export function canViewReport(userRole?: string | null, projectMemberRole?: string | null): boolean {
    // Tương tự Dashboard
    return canViewDashboard(userRole, projectMemberRole);
}

/**
 * Check if user has permission to export Report
 */
export function canExportReport(userRole?: string | null, projectMemberRole?: string | null): boolean {
    // Admin, PM, và Project Manager có thể export
    if (userRole === 'ADMIN' || userRole === 'PM' || projectMemberRole === 'MANAGER') {
        return true;
    }

    // Lead có thể export
    if (userRole === 'LEAD') {
        return true;
    }

    // Member và Viewer không thể export (chỉ xem)
    return false;
}

/**
 * Check if user can view sensitive data (e.g., cost, budget)
 */
export function canViewSensitiveData(userRole?: string | null, projectMemberRole?: string | null): boolean {
    // Chỉ Admin, PM, và Project Manager
    if (userRole === 'ADMIN' || userRole === 'PM' || projectMemberRole === 'MANAGER') {
        return true;
    }

    return false;
}

/**
 * Get user's effective role for a project
 * Priority: Project Member Role > User Role
 */
export function getEffectiveRole(userRole?: string | null, projectMemberRole?: string | null): UserRole | ProjectMemberRole | null {
    if (projectMemberRole) {
        return projectMemberRole as ProjectMemberRole;
    }
    if (userRole) {
        return userRole as UserRole;
    }
    return null;
}

/**
 * Quotation permissions
 *
 * Lưu ý: file này đang được dùng rộng rãi cho permission (dashboard/report).
 * Các API routes báo giá đang import `assertCanEditQuotation` từ đây, nên cần export ổn định.
 */
export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | (string & {});

export type QuotationForPermission = {
    id: string;
    createdById: string | null;
    status?: QuotationStatus | null;
};

export type UserForPermission = {
    id: string;
    role?: string | null;
};

export function canEditQuotation(user: UserForPermission, quotation: QuotationForPermission): boolean {
    const role = (user.role ?? '').toUpperCase();
    if (role === 'ADMIN' || role === 'PM') return true;
    if (!quotation.createdById) return false;
    return quotation.createdById === user.id;
}

export function assertCanEditQuotation(user: UserForPermission, quotation: QuotationForPermission): void {
    if (!canEditQuotation(user, quotation)) {
        throw new Error('FORBIDDEN');
    }

    // Khóa chỉnh sửa nếu báo giá đã ACCEPTED (chỉ Admin/PM được phép can thiệp)
    const role = (user.role ?? '').toUpperCase();
    if ((quotation.status ?? '') === 'ACCEPTED' && role !== 'ADMIN' && role !== 'PM') {
        throw new Error('FORBIDDEN_ACCEPTED_QUOTATION');
    }
}