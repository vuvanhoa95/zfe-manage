/**
 * Revit Add-in Authentication Helper
 * 
 * Quản lý xác thực cho Revit Add-in desktop app.
 * Sử dụng random token + DB storage (không dùng JWT)
 * để hỗ trợ Single Device Lock (đá máy cũ khi login máy mới).
 * 
 * ⚡ v2: Kiểm tra CẢ 2 bảng — User (nhân sự) + RevitUser (standalone)
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const TOKEN_EXPIRY_DAYS = 30;

export interface RevitUser {
  email: string;
  name: string;
  role: string;
  company: string | null;
}

export interface RevitLicenseInfo {
  plan: string | null;
  active: boolean;
  start: string | null;
  expiry: string | null;
  isTrial?: boolean;
}

export interface RevitLoginResult {
  success: boolean;
  token?: string;
  user?: RevitUser;
  expiresAt?: string;
  message?: string;
  license?: RevitLicenseInfo;
  mcpLicense?: RevitLicenseInfo;
}

export interface RevitVerifyResult {
  valid: boolean;
  user?: RevitUser;
  message?: string;
  mcpLicense?: { active: boolean; expiry: string | null };
}

/**
 * Tìm user từ CẢ 2 bảng theo email.
 * Trả về source = 'staff' (User) hoặc 'revit' (RevitUser).
 */
async function findByEmail(email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  // Ưu tiên tìm trong bảng User (nhân sự) trước
  const staffUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (staffUser && staffUser.revitLicenseActive) {
    return {
      source: 'staff' as const,
      id: staffUser.id,
      email: staffUser.email,
      name: staffUser.name,
      password: staffUser.password,
      status: staffUser.status,
      role: staffUser.role,
      department: staffUser.department,
      licenseActive: staffUser.revitLicenseActive,
      licensePlan: staffUser.revitLicensePlan,
      licenseStart: staffUser.revitLicenseStart,
      licenseExpiry: staffUser.revitLicenseExpiry,
      activeToken: staffUser.revitActiveToken,
      machineId: staffUser.revitMachineId,
      mcpLicenseActive: staffUser.mcpLicenseActive,
      mcpLicensePlan: staffUser.mcpLicensePlan,
      mcpLicenseStart: staffUser.mcpLicenseStart,
      mcpLicenseExpiry: staffUser.mcpLicenseExpiry,
    };
  }

  // Tìm trong bảng RevitUser
  const revitUser = await prisma.revitUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (revitUser) {
    return {
      source: 'revit' as const,
      id: revitUser.id,
      email: revitUser.email,
      name: revitUser.name,
      password: revitUser.password,
      status: revitUser.status,
      role: 'USER',
      department: null as string | null,
      licenseActive: revitUser.licenseActive,
      licensePlan: revitUser.licensePlan,
      licenseStart: revitUser.licenseStart,
      licenseExpiry: revitUser.licenseExpiry,
      activeToken: revitUser.activeToken,
      machineId: revitUser.machineId,
      mcpLicenseActive: revitUser.mcpLicenseActive,
      mcpLicensePlan: revitUser.mcpLicensePlan,
      mcpLicenseStart: revitUser.mcpLicenseStart,
      mcpLicenseExpiry: revitUser.mcpLicenseExpiry,
    };
  }

  // Nếu staffUser tồn tại nhưng chưa có revit license
  if (staffUser) {
    return {
      source: 'staff_no_license' as const,
      id: staffUser.id,
      email: staffUser.email,
      name: staffUser.name,
      password: staffUser.password,
      status: staffUser.status,
      role: staffUser.role,
      department: staffUser.department,
      licenseActive: false,
      licensePlan: null as string | null,
      licenseStart: null as Date | null,
      licenseExpiry: null as Date | null,
      activeToken: null as string | null,
      machineId: null as string | null,
      mcpLicenseActive: staffUser.mcpLicenseActive,
      mcpLicensePlan: staffUser.mcpLicensePlan,
      mcpLicenseStart: staffUser.mcpLicenseStart,
      mcpLicenseExpiry: staffUser.mcpLicenseExpiry,
    };
  }

  return null;
}

/**
 * Tìm user theo token từ CẢ 2 bảng.
 */
export async function findByToken(token: string) {
  // Tìm trong User
  const staffUser = await prisma.user.findFirst({
    where: { revitActiveToken: token },
  });

  if (staffUser) {
    return {
      source: 'staff' as const,
      id: staffUser.id,
      email: staffUser.email,
      name: staffUser.name,
      role: staffUser.role,
      department: staffUser.department,
      status: staffUser.status,
      licenseActive: staffUser.revitLicenseActive,
      licenseExpiry: staffUser.revitLicenseExpiry,
      mcpLicenseActive: staffUser.mcpLicenseActive,
      mcpLicenseExpiry: staffUser.mcpLicenseExpiry,
    };
  }

  // Tìm trong RevitUser
  const revitUser = await prisma.revitUser.findFirst({
    where: { activeToken: token },
  });

  if (revitUser) {
    return {
      source: 'revit' as const,
      id: revitUser.id,
      email: revitUser.email,
      name: revitUser.name,
      role: 'USER',
      department: null as string | null,
      status: revitUser.status,
      licenseActive: revitUser.licenseActive,
      licenseExpiry: revitUser.licenseExpiry,
      mcpLicenseActive: revitUser.mcpLicenseActive,
      mcpLicenseExpiry: revitUser.mcpLicenseExpiry,
    };
  }

  return null;
}

/**
 * Cập nhật token + machine sau login thành công.
 */
async function updateAfterLogin(
  source: 'staff' | 'revit',
  userId: string,
  newToken: string,
  machineId: string,
) {
  if (source === 'staff') {
    await prisma.user.update({
      where: { id: userId },
      data: {
        revitActiveToken: newToken,
        revitMachineId: machineId,
        revitLastLogin: new Date(),
      },
    });
  } else {
    await prisma.revitUser.update({
      where: { id: userId },
      data: {
        activeToken: newToken,
        machineId: machineId,
        lastLogin: new Date(),
      },
    });
  }
}

/**
 * Xác thực user từ Revit Add-in.
 * Kiểm tra CẢ 2 bảng (User + RevitUser).
 */
export async function revitLogin(
  email: string,
  password: string,
  machineId: string,
  addinVersion?: string
): Promise<RevitLoginResult> {
  // 1. Tìm user từ cả 2 bảng
  const found = await findByEmail(email);

  if (!found) {
    return { success: false, message: 'Email không tồn tại trong hệ thống.' };
  }

  // Staff tồn tại nhưng chưa có license
  if (found.source === 'staff_no_license') {
    return {
      success: false,
      message: 'Tài khoản chưa được cấp quyền sử dụng Revit Add-in. Liên hệ Admin.',
    };
  }

  // 2. Kiểm tra password
  if (!found.password) {
    return {
      success: false,
      message: 'Tài khoản chưa có mật khẩu. Đăng nhập trên web để tạo mật khẩu.',
    };
  }

  const passwordMatch = await bcrypt.compare(password, found.password);
  if (!passwordMatch) {
    return { success: false, message: 'Sai mật khẩu. Vui lòng thử lại.' };
  }

  // 3. Kiểm tra trạng thái
  const allowedStatuses = ['ACTIVE', 'TRIAL'];
  if (!allowedStatuses.includes(found.status)) {
    const statusMsg = found.status === 'SUSPENDED'
      ? 'Tài khoản đã bị đình chỉ. Liên hệ Admin để được hỗ trợ.'
      : `Tài khoản đang ở trạng thái "${found.status}". Liên hệ admin.`;
    return { success: false, message: statusMsg };
  }

  // 4. Kiểm tra license
  if (!found.licenseActive) {
    return {
      success: false,
      message: 'Tài khoản chưa được cấp quyền sử dụng Revit Add-in. Liên hệ Admin.',
    };
  }

  // 5. Kiểm tra expiry — phân biệt TRIAL hết hạn vs License hết hạn
  if (found.licenseExpiry && found.licenseExpiry < new Date()) {
    const isTrialExpired = found.status === 'TRIAL' || found.licensePlan === 'TRIAL_30D';
    return {
      success: false,
      message: isTrialExpired
        ? 'Thời gian dùng thử 30 ngày đã hết. Liên hệ ZFenix để mua license chính thức.'
        : 'License Revit Add-in đã hết hạn. Liên hệ Admin để gia hạn.',
    };
  }

  // 6. Tạo token mới → invalidate máy cũ
  const newToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  // 7. Cập nhật DB
  await updateAfterLogin(found.source, found.id, newToken, machineId);

  console.log(
    `[Revit Auth] Login: ${email} (${found.source}) on ${machineId} (v${addinVersion || 'unknown'})`
  );

  const isTrial = found.status === 'TRIAL' || found.licensePlan === 'TRIAL_30D';

  return {
    success: true,
    token: newToken,
    user: {
      email: found.email,
      name: found.name || email.split('@')[0],
      role: found.role,
      company: found.department || null,
    },
    expiresAt: expiresAt.toISOString(),
    license: {
      plan: found.licensePlan || null,
      active: found.licenseActive,
      start: found.licenseStart?.toISOString() || null,
      expiry: found.licenseExpiry?.toISOString() || null,
      isTrial,
    },
    mcpLicense: {
      plan: found.mcpLicensePlan || null,
      active: found.mcpLicenseActive,
      start: found.mcpLicenseStart?.toISOString() || null,
      expiry: found.mcpLicenseExpiry?.toISOString() || null,
    },
  };
}

/**
 * Xác minh token từ Revit Add-in.
 * Kiểm tra CẢ 2 bảng (User + RevitUser).
 */
export async function revitVerify(token: string): Promise<RevitVerifyResult> {
  if (!token) {
    return { valid: false, message: 'Token không hợp lệ.' };
  }

  const found = await findByToken(token);

  if (!found) {
    return {
      valid: false,
      message: 'Phiên đăng nhập đã hết hạn hoặc tài khoản đã được đăng nhập từ máy khác. Vui lòng đăng nhập lại.',
    };
  }

  // Kiểm tra tài khoản vẫn active
  const allowedVerifyStatuses = ['ACTIVE', 'TRIAL'];
  if (!allowedVerifyStatuses.includes(found.status)) {
    return {
      valid: false,
      message: found.status === 'SUSPENDED'
        ? 'Tài khoản đã bị đình chỉ. Liên hệ Admin.'
        : `Tài khoản đang ở trạng thái "${found.status}". Liên hệ Admin.`,
    };
  }

  // Kiểm tra license vẫn active
  if (!found.licenseActive) {
    return {
      valid: false,
      message: 'Quyền sử dụng Revit Add-in đã bị thu hồi. Liên hệ Admin.',
    };
  }

  // Kiểm tra expiry
  if (found.licenseExpiry && found.licenseExpiry < new Date()) {
    return {
      valid: false,
      message: 'License Revit Add-in đã hết hạn. Liên hệ Admin để gia hạn.',
    };
  }

  return {
    valid: true,
    user: {
      email: found.email,
      name: found.name || found.email.split('@')[0],
      role: found.role,
      company: found.department || null,
    },
    mcpLicense: {
      active: found.mcpLicenseActive,
      expiry: found.mcpLicenseExpiry?.toISOString() || null,
    },
  };
}
