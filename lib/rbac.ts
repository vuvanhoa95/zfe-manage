/**
 * ZFENIX RBAC – Role-Based Access Control Matrix
 *
 * Hỗ trợ DYNAMIC OVERRIDES: Admin có thể bật/tắt quyền qua UI
 * và lưu vào DB. Runtime sẽ merge defaults + overrides.
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

  | 'nav:reports'
  | 'nav:users'
  | 'nav:revit_licenses'
  | 'nav:company_profile'
  | 'nav:settings'

  // --- DASHBOARD ---
  | 'dashboard:view'
  | 'dashboard:view_financials'
  | 'dashboard:view_all_projects'

  // --- PROJECTS ---
  | 'project:create'
  | 'project:view'
  | 'project:view_own'
  | 'project:edit'
  | 'project:edit_own'
  | 'project:delete'
  | 'project:manage_members'
  | 'project:view_financials'

  // --- QUOTATIONS ---
  | 'quotation:create'
  | 'quotation:view'
  | 'quotation:view_own'
  | 'quotation:edit'
  | 'quotation:edit_own'
  | 'quotation:delete'
  | 'quotation:approve'
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
  | 'task:edit_own'
  | 'task:delete'
  | 'task:view_all'

  // --- CASH FLOWS ---
  | 'cashflow:create'
  | 'cashflow:view'
  | 'cashflow:edit'
  | 'cashflow:delete'



  // --- REPORTS ---
  | 'report:view'
  | 'report:export'

  // --- COMPANY PROFILE ---
  | 'company_profile:view'
  | 'company_profile:edit'

  // --- SETTINGS ---
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
// PERMISSION GROUPS — Dùng để hiển thị theo nhóm trên UI
// =====================================================
export type PermissionGroup = {
  group: string;
  icon: string;
  permissions: { key: Permission; label: string; description?: string }[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    group: 'Điều hướng',
    icon: '🗺️',
    permissions: [
      { key: 'nav:dashboard',        label: 'Menu: Tổng quan' },
      { key: 'nav:projects',         label: 'Menu: Dự án' },
      { key: 'nav:quotations',       label: 'Menu: Báo giá' },
      { key: 'nav:customers',        label: 'Menu: Khách hàng' },

      { key: 'nav:reports',          label: 'Menu: Báo cáo' },
      { key: 'nav:users',            label: 'Menu: Quản lý User', description: 'Trang quản lý tài khoản' },
      { key: 'nav:revit_licenses',   label: 'Menu: Revit License', description: 'Quản lý license Revit Add-in' },
      { key: 'nav:company_profile',  label: 'Menu: Hồ sơ công ty' },
      { key: 'nav:settings',         label: 'Menu: Cài đặt' },
    ],
  },
  {
    group: 'Dashboard',
    icon: '📊',
    permissions: [
      { key: 'dashboard:view',             label: 'Xem Dashboard' },
      { key: 'dashboard:view_financials',  label: 'Xem số liệu tài chính', description: 'Doanh thu, chi phí, lợi nhuận tổng hợp' },
      { key: 'dashboard:view_all_projects',label: 'Xem tất cả dự án', description: 'Không chỉ dự án mình tham gia' },
    ],
  },
  {
    group: 'Dự án',
    icon: '🏗️',
    permissions: [
      { key: 'project:create',          label: 'Tạo dự án mới' },
      { key: 'project:view',            label: 'Xem dự án' },
      { key: 'project:edit',            label: 'Sửa dự án' },
      { key: 'project:delete',          label: 'Xóa dự án' },
      { key: 'project:manage_members',  label: 'Quản lý thành viên' },
      { key: 'project:view_financials', label: 'Xem tài chính dự án', description: 'Ngân sách, doanh thu, chi phí của dự án' },
    ],
  },
  {
    group: 'Báo giá',
    icon: '📄',
    permissions: [
      { key: 'quotation:create',            label: 'Tạo báo giá' },
      { key: 'quotation:view',              label: 'Xem báo giá' },
      { key: 'quotation:edit',              label: 'Sửa báo giá' },
      { key: 'quotation:delete',            label: 'Xóa báo giá' },
      { key: 'quotation:approve',           label: 'Phê duyệt báo giá', description: 'Đặt trạng thái ACCEPTED' },
      { key: 'quotation:export',            label: 'Xuất PDF/DOCX' },
      { key: 'quotation:manage_templates',  label: 'Quản lý mẫu báo giá' },
    ],
  },
  {
    group: 'Khách hàng',
    icon: '🏢',
    permissions: [
      { key: 'customer:create', label: 'Tạo khách hàng' },
      { key: 'customer:view',   label: 'Xem khách hàng' },
      { key: 'customer:edit',   label: 'Sửa khách hàng' },
      { key: 'customer:delete', label: 'Xóa khách hàng' },
    ],
  },
  {
    group: 'Công việc (Task)',
    icon: '✅',
    permissions: [
      { key: 'task:create',   label: 'Tạo task' },
      { key: 'task:view',     label: 'Xem task' },
      { key: 'task:edit',     label: 'Sửa task' },
      { key: 'task:delete',   label: 'Xóa task' },
      { key: 'task:view_all', label: 'Xem tất cả task', description: 'Kể cả task chưa được giao cho mình' },
    ],
  },
  {
    group: 'Dòng tiền',
    icon: '💰',
    permissions: [
      { key: 'cashflow:create', label: 'Tạo giao dịch' },
      { key: 'cashflow:view',   label: 'Xem giao dịch' },
      { key: 'cashflow:edit',   label: 'Sửa giao dịch' },
      { key: 'cashflow:delete', label: 'Xóa giao dịch' },
    ],
  },

  {
    group: 'Báo cáo',
    icon: '📈',
    permissions: [
      { key: 'report:view',   label: 'Xem báo cáo' },
      { key: 'report:export', label: 'Xuất báo cáo' },
    ],
  },
  {
    group: 'Hệ thống',
    icon: '⚙️',
    permissions: [
      { key: 'company_profile:view', label: 'Xem hồ sơ công ty' },
      { key: 'company_profile:edit', label: 'Sửa hồ sơ công ty' },
      { key: 'settings:view',        label: 'Xem cài đặt' },
      { key: 'settings:edit',        label: 'Sửa cài đặt (danh mục, đơn vị)' },
    ],
  },
  {
    group: 'Quản lý User',
    icon: '👥',
    permissions: [
      { key: 'user:create',        label: 'Tạo user mới' },
      { key: 'user:view',          label: 'Xem danh sách user' },
      { key: 'user:edit',          label: 'Sửa thông tin user' },
      { key: 'user:delete',        label: 'Xóa user' },
      { key: 'user:toggle_status', label: 'Kích hoạt / Khóa user' },
      { key: 'user:manage_roles',  label: 'Phân quyền role', description: 'Thay đổi role của user, chỉnh sửa permission' },
    ],
  },
];

// =====================================================
// DEFAULT PERMISSION MATRIX (hardcoded baseline)
// =====================================================
export const RBAC_DEFAULTS: Record<SystemRole, Permission[]> = {
  ADMIN: [
    'nav:dashboard', 'nav:projects', 'nav:quotations', 'nav:customers',
    'nav:reports', 'nav:users', 'nav:revit_licenses', 'nav:company_profile', 'nav:settings',
    'dashboard:view', 'dashboard:view_financials', 'dashboard:view_all_projects',
    'project:create', 'project:view', 'project:edit', 'project:delete',
    'project:manage_members', 'project:view_financials',
    'quotation:create', 'quotation:view', 'quotation:edit', 'quotation:delete',
    'quotation:approve', 'quotation:export', 'quotation:manage_templates',
    'customer:create', 'customer:view', 'customer:edit', 'customer:delete',
    'task:create', 'task:view', 'task:edit', 'task:delete', 'task:view_all',
    'cashflow:create', 'cashflow:view', 'cashflow:edit', 'cashflow:delete',

    'report:view', 'report:export',
    'company_profile:view', 'company_profile:edit',
    'settings:view', 'settings:edit',
    'user:create', 'user:view', 'user:edit', 'user:delete', 'user:manage_roles', 'user:toggle_status',
  ],

  PM: [
    'nav:dashboard', 'nav:projects', 'nav:quotations', 'nav:customers',
    'nav:reports', 'nav:company_profile', 'nav:settings',
    'dashboard:view', 'dashboard:view_financials', 'dashboard:view_all_projects',
    'project:create', 'project:view', 'project:edit', 'project:edit_own', 'project:delete',
    'project:manage_members', 'project:view_financials',
    'quotation:create', 'quotation:view', 'quotation:edit', 'quotation:edit_own',
    'quotation:approve', 'quotation:export', 'quotation:manage_templates',
    'customer:create', 'customer:view', 'customer:edit',
    'task:create', 'task:view', 'task:edit', 'task:delete', 'task:view_all',
    'cashflow:create', 'cashflow:view', 'cashflow:edit', 'cashflow:delete',

    'report:view', 'report:export',
    'company_profile:view',
    'settings:view',
  ],

  USER: [
    'nav:dashboard', 'nav:projects', 'nav:quotations',
    'dashboard:view',
    'project:view', 'project:view_own',
    'quotation:create', 'quotation:view', 'quotation:view_own',
    'quotation:edit_own', 'quotation:export',
    'task:create', 'task:view', 'task:edit_own',
    'cashflow:view',
  ],
};

// =====================================================
// TYPE cho overrides (lưu trong DB)
// override[role][permission] = true (grant) | false (revoke)
// Chỉ lưu những gì KHÁC với defaults
// =====================================================
export type PermissionOverrides = Partial<Record<SystemRole, Partial<Record<Permission, boolean>>>>;

// =====================================================
// RUNTIME STATE — Loaded from DB overrides
// Được hydrate khi app start hoặc sau khi admin save
// =====================================================

/**
 * Runtime permission matrix (defaults + overrides).
 * Client dùng cái này thông qua /api/admin/permissions/runtime
 */
let _runtimePermissions: Record<SystemRole, Set<Permission>> | null = null;

/**
 * Tính toán runtime permissions từ defaults + overrides
 */
export function computePermissions(
  overrides: PermissionOverrides
): Record<SystemRole, Set<Permission>> {
  const result: Record<SystemRole, Set<Permission>> = {
    ADMIN: new Set(RBAC_DEFAULTS.ADMIN),
    PM:    new Set(RBAC_DEFAULTS.PM),
    USER:  new Set(RBAC_DEFAULTS.USER),
  };

  for (const roleKey of Object.keys(overrides) as SystemRole[]) {
    const roleOverrides = overrides[roleKey];
    if (!roleOverrides) continue;
    for (const [perm, granted] of Object.entries(roleOverrides) as [Permission, boolean][]) {
      if (granted) {
        result[roleKey].add(perm);
      } else {
        result[roleKey].delete(perm);
      }
    }
  }

  return result;
}

/**
 * Set runtime permissions (gọi sau khi load từ DB)
 */
export function setRuntimePermissions(overrides: PermissionOverrides) {
  _runtimePermissions = computePermissions(overrides);
}

/**
 * Lấy runtime permissions (nếu chưa có thì dùng defaults)
 */
function getRuntimePermissions(): Record<SystemRole, Set<Permission>> {
  if (_runtimePermissions) return _runtimePermissions;
  return {
    ADMIN: new Set(RBAC_DEFAULTS.ADMIN),
    PM:    new Set(RBAC_DEFAULTS.PM),
    USER:  new Set(RBAC_DEFAULTS.USER),
  };
}

// =====================================================
// PROJECT-LEVEL PERMISSION MATRIX (không thay đổi được qua UI)
// Đây là cấu trúc cứng — thay đổi qua code
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
// CORE PERMISSION CHECKERS
// =====================================================

/**
 * Kiểm tra system-level permission (dùng runtime matrix).
 */
export function can(
  userRole: string | null | undefined,
  permission: Permission
): boolean {
  if (!userRole) return false;
  const role = userRole.toUpperCase() as SystemRole;
  const runtime = getRuntimePermissions();
  return runtime[role]?.has(permission) ?? false;
}

/**
 * Kiểm tra permission có xét đến project membership.
 */
export function canInProject(
  userRole: string | null | undefined,
  projectMemberRole: string | null | undefined,
  permission: Permission
): boolean {
  if (can(userRole, permission)) return true;
  if (!projectMemberRole) return false;
  const pRole = projectMemberRole.toUpperCase() as ProjectRole;
  return PROJECT_PERMISSIONS[pRole]?.includes(permission) ?? false;
}

/**
 * Lấy tất cả permissions của user (runtime)
 */
export function getAllPermissions(
  userRole: string | null | undefined,
  projectMemberRole?: string | null | undefined
): Permission[] {
  const role = (userRole ?? '').toUpperCase() as SystemRole;
  const runtime = getRuntimePermissions();
  const systemPerms = Array.from(runtime[role] ?? []);

  if (!projectMemberRole) return systemPerms;
  const pRole = projectMemberRole.toUpperCase() as ProjectRole;
  const projectPerms = PROJECT_PERMISSIONS[pRole] ?? [];
  return [...new Set([...systemPerms, ...projectPerms])];
}

export function isAdmin(userRole: string | null | undefined): boolean {
  return (userRole ?? '').toUpperCase() === 'ADMIN';
}

export function isAdminOrPM(userRole: string | null | undefined): boolean {
  const role = (userRole ?? '').toUpperCase();
  return role === 'ADMIN' || role === 'PM';
}

export function getRoleLabel(role: string | null | undefined): string {
  switch ((role ?? '').toUpperCase()) {
    case 'ADMIN':   return 'Quản trị viên';
    case 'PM':      return 'Quản lý dự án';
    case 'USER':    return 'Nhân viên';
    case 'MANAGER': return 'Trưởng nhóm';
    case 'MEMBER':  return 'Thành viên';
    case 'VIEWER':  return 'Chỉ xem';
    default:        return role ?? 'Không xác định';
  }
}

export function getRoleBadgeStyle(role: string | null | undefined): string {
  switch ((role ?? '').toUpperCase()) {
    case 'ADMIN':   return 'bg-red-50 text-red-700 border border-red-200';
    case 'PM':      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'USER':    return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'MANAGER': return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'MEMBER':  return 'bg-teal-50 text-teal-700 border border-teal-200';
    case 'VIEWER':  return 'bg-gray-50 text-gray-600 border border-gray-200';
    default:        return 'bg-gray-50 text-gray-500';
  }
}
