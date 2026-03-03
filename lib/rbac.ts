/**
 * ZFENIX RBAC – Role-Based Access Control Matrix
 *
 * NGUỒN SỰ THẬT DUY NHẤT cho toàn hệ thống.
 * Mọi quyết định phân quyền đều phải tham chiếu tại đây.
 *
 * =====================================================
 * ROLE HIERARCHY (System-level):
 *   ADMIN  → Toàn quyền hệ thống
 *   PM     → Quản lý dự án, báo giá, khách hàng
 *   USER   → Xem và thao tác trong phạm vi được giao
 *
 * PROJECT-LEVEL ROLE (per-project):
 *   MANAGER → Tương đương PM nhưng cho 1 project cụ thể
 *   MEMBER  → Thành viên thực hiện tasks
 *   VIEWER  → Chỉ xem, không edit
 * =====================================================
 */

export type SystemRole = 'ADMIN' | 'PM' | 'USER';
export type ProjectRole = 'MANAGER' | 'MEMBER' | 'VIEWER';

// =====================================================
// PERMISSION KEYS — Toàn bộ actions trong hệ thống
// =====================================================
export type Permission =
  // --- NAVIGATION ---
  | 'nav:dashboard'
  | 'nav:projects'
  | 'nav:quotations'
  | 'nav:customers'
  | 'nav:outsourcing_staff'
  | 'nav:reports'
  | 'nav:users'
  | 'nav:company_profile'
  | 'nav:settings'

  // --- DASHBOARD ---
  | 'dashboard:view'
  | 'dashboard:view_financials'   // Xem số liệu tài chính tổng hợp
  | 'dashboard:view_all_projects' // Xem tất cả dự án (admin/pm)

  // --- PROJECTS ---
  | 'project:create'
  | 'project:view'
  | 'project:view_own'            // Chỉ xem dự án mình tạo hoặc là thành viên
  | 'project:edit'
  | 'project:edit_own'
  | 'project:delete'
  | 'project:manage_members'
  | 'project:view_financials'     // Xem: doanh thu, chi phí, lợi nhuận

  // --- QUOTATIONS ---
  | 'quotation:create'
  | 'quotation:view'
  | 'quotation:view_own'
  | 'quotation:edit'
  | 'quotation:edit_own'
  | 'quotation:delete'
  | 'quotation:approve'           // ADMIN/PM: set ACCEPTED
  | 'quotation:export'
  | 'quotation:manage_templates'

  // --- CUSTOMERS ---
  | 'customer:create'
  | 'customer:view'
  | 'customer:edit'
  | 'customer:delete'

  // --- TASKS ---
  | 'task:create'
  | 'task:view'
  | 'task:edit'
  | 'task:edit_own'               // Chỉ edit task được giao cho mình
  | 'task:delete'
  | 'task:view_all'               // Xem tất cả task trong dự án

  // --- CASH FLOWS ---
  | 'cashflow:create'
  | 'cashflow:view'
  | 'cashflow:edit'
  | 'cashflow:delete'

  // --- OUTSOURCING STAFF ---
  | 'outsourcing:create'
  | 'outsourcing:view'
  | 'outsourcing:edit'
  | 'outsourcing:delete'

  // --- REPORTS ---
  | 'report:view'
  | 'report:export'

  // --- COMPANY PROFILE ---
  | 'company_profile:view'
  | 'company_profile:edit'

  // --- SETTINGS (Catalog, Units, Custom Fields) ---
  | 'settings:view'
  | 'settings:edit'

  // --- USER MANAGEMENT ---
  | 'user:create'
  | 'user:view'
  | 'user:edit'
  | 'user:delete'
  | 'user:manage_roles'
  | 'user:toggle_status';

// =====================================================
// SYSTEM-LEVEL PERMISSION MATRIX
// =====================================================
const SYSTEM_PERMISSIONS: Record<SystemRole, Permission[]> = {
  ADMIN: [
    // Navigation — tất cả
    'nav:dashboard', 'nav:projects', 'nav:quotations', 'nav:customers',
    'nav:outsourcing_staff', 'nav:reports', 'nav:users', 'nav:company_profile', 'nav:settings',
    // Dashboard
    'dashboard:view', 'dashboard:view_financials', 'dashboard:view_all_projects',
    // Projects — toàn quyền
    'project:create', 'project:view', 'project:edit', 'project:delete',
    'project:manage_members', 'project:view_financials',
    // Quotations — toàn quyền
    'quotation:create', 'quotation:view', 'quotation:edit', 'quotation:delete',
    'quotation:approve', 'quotation:export', 'quotation:manage_templates',
    // Customers — toàn quyền
    'customer:create', 'customer:view', 'customer:edit', 'customer:delete',
    // Tasks — toàn quyền
    'task:create', 'task:view', 'task:edit', 'task:delete', 'task:view_all',
    // Cash flows — toàn quyền
    'cashflow:create', 'cashflow:view', 'cashflow:edit', 'cashflow:delete',
    // Outsourcing — toàn quyền
    'outsourcing:create', 'outsourcing:view', 'outsourcing:edit', 'outsourcing:delete',
    // Reports
    'report:view', 'report:export',
    // Company Profile
    'company_profile:view', 'company_profile:edit',
    // Settings
    'settings:view', 'settings:edit',
    // Users — toàn quyền
    'user:create', 'user:view', 'user:edit', 'user:delete', 'user:manage_roles', 'user:toggle_status',
  ],

  PM: [
    // Navigation — không có User Management
    'nav:dashboard', 'nav:projects', 'nav:quotations', 'nav:customers',
    'nav:outsourcing_staff', 'nav:reports', 'nav:company_profile', 'nav:settings',
    // Dashboard
    'dashboard:view', 'dashboard:view_financials', 'dashboard:view_all_projects',
    // Projects — tạo, sửa, xóa dự án của mình (không del dự án của người khác)
    'project:create', 'project:view', 'project:edit', 'project:edit_own', 'project:delete',
    'project:manage_members', 'project:view_financials',
    // Quotations — toàn quyền trừ delete (chỉ xóa DRAFT)
    'quotation:create', 'quotation:view', 'quotation:edit', 'quotation:edit_own',
    'quotation:approve', 'quotation:export', 'quotation:manage_templates',
    // Customers
    'customer:create', 'customer:view', 'customer:edit',
    // Tasks
    'task:create', 'task:view', 'task:edit', 'task:delete', 'task:view_all',
    // Cash flows
    'cashflow:create', 'cashflow:view', 'cashflow:edit', 'cashflow:delete',
    // Outsourcing
    'outsourcing:create', 'outsourcing:view', 'outsourcing:edit',
    // Reports
    'report:view', 'report:export',
    // Company Profile — chỉ xem
    'company_profile:view',
    // Settings — chỉ xem
    'settings:view',
  ],

  USER: [
    // Navigation — giới hạn
    'nav:dashboard', 'nav:projects', 'nav:quotations',
    // Dashboard — xem nhưng không thấy tài chính tổng
    'dashboard:view',
    // Projects — chỉ xem dự án mình là thành viên
    'project:view', 'project:view_own',
    // Quotations — tự tạo và sửa của mình
    'quotation:create', 'quotation:view', 'quotation:view_own',
    'quotation:edit_own', 'quotation:export',
    // Tasks — tạo và sửa task được giao
    'task:create', 'task:view', 'task:edit_own',
    // Cash flows — chỉ xem
    'cashflow:view',
  ],
};

// =====================================================
// PROJECT-LEVEL PERMISSION MATRIX (override system-role khi trong context project)
// =====================================================
const PROJECT_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  MANAGER: [
    'project:view', 'project:edit', 'project:manage_members', 'project:view_financials',
    'task:create', 'task:view', 'task:edit', 'task:delete', 'task:view_all',
    'cashflow:create', 'cashflow:view', 'cashflow:edit', 'cashflow:delete',
    'report:view', 'report:export',
    'quotation:create', 'quotation:view', 'quotation:edit', 'quotation:export',
  ],
  MEMBER: [
    'project:view',
    'task:create', 'task:view', 'task:edit_own', 'task:view_all',
    'cashflow:view',
    'report:view',
    'quotation:view',
  ],
  VIEWER: [
    'project:view',
    'task:view',
    'cashflow:view',
    'report:view',
    'quotation:view',
  ],
};

// =====================================================
// CORE PERMISSION CHECKER
// =====================================================

/**
 * Kiểm tra system-level permission.
 * Dùng khi không có context của project cụ thể.
 */
export function can(
  userRole: string | null | undefined,
  permission: Permission
): boolean {
  if (!userRole) return false;
  const role = userRole.toUpperCase() as SystemRole;
  return SYSTEM_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Kiểm tra permission có xét đến project membership.
 * Project role sẽ được THÊM VÀO (không thay thế) system role permissions.
 */
export function canInProject(
  userRole: string | null | undefined,
  projectMemberRole: string | null | undefined,
  permission: Permission
): boolean {
  // Kiểm tra system role trước
  if (can(userRole, permission)) return true;

  // Nếu không có project membership → deny
  if (!projectMemberRole) return false;

  const pRole = projectMemberRole.toUpperCase() as ProjectRole;
  return PROJECT_PERMISSIONS[pRole]?.includes(permission) ?? false;
}

/**
 * Lấy tất cả permissions của user (có thể dùng để debug)
 */
export function getAllPermissions(
  userRole: string | null | undefined,
  projectMemberRole?: string | null | undefined
): Permission[] {
  const role = (userRole ?? '').toUpperCase() as SystemRole;
  const systemPerms = SYSTEM_PERMISSIONS[role] ?? [];

  if (!projectMemberRole) return systemPerms;

  const pRole = projectMemberRole.toUpperCase() as ProjectRole;
  const projectPerms = PROJECT_PERMISSIONS[pRole] ?? [];
  return [...new Set([...systemPerms, ...projectPerms])];
}

/**
 * Kiểm tra nếu user là ADMIN
 */
export function isAdmin(userRole: string | null | undefined): boolean {
  return (userRole ?? '').toUpperCase() === 'ADMIN';
}

/**
 * Kiểm tra nếu user là ADMIN hoặc PM
 */
export function isAdminOrPM(userRole: string | null | undefined): boolean {
  const role = (userRole ?? '').toUpperCase();
  return role === 'ADMIN' || role === 'PM';
}

/**
 * Lấy label tiếng Việt của role
 */
export function getRoleLabel(role: string | null | undefined): string {
  switch ((role ?? '').toUpperCase()) {
    case 'ADMIN': return 'Quản trị viên';
    case 'PM': return 'Quản lý dự án';
    case 'USER': return 'Nhân viên';
    case 'MANAGER': return 'Trưởng nhóm';
    case 'MEMBER': return 'Thành viên';
    case 'VIEWER': return 'Chỉ xem';
    default: return role ?? 'Không xác định';
  }
}

/**
 * Lấy màu badge cho role
 */
export function getRoleBadgeStyle(role: string | null | undefined): string {
  switch ((role ?? '').toUpperCase()) {
    case 'ADMIN':
      return 'bg-red-50 text-red-700 border border-red-200';
    case 'PM':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'USER':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'MANAGER':
      return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'MEMBER':
      return 'bg-teal-50 text-teal-700 border border-teal-200';
    case 'VIEWER':
      return 'bg-gray-50 text-gray-600 border border-gray-200';
    default:
      return 'bg-gray-50 text-gray-500';
  }
}
