/**
 * Revit Add-in Authentication Helper
 * 
 * Quản lý xác thực cho Revit Add-in desktop app.
 * Sử dụng random token + DB storage (không dùng JWT)
 * để hỗ trợ Single Device Lock (đá máy cũ khi login máy mới).
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

export interface RevitLoginResult {
  success: boolean;
  token?: string;
  user?: RevitUser;
  expiresAt?: string;
  message?: string;
}

export interface RevitVerifyResult {
  valid: boolean;
  user?: RevitUser;
  message?: string;
}

/**
 * Xác thực user từ Revit Add-in.
 * - Kiểm tra email/password
 * - Kiểm tra revitLicenseActive
 * - Kiểm tra license chưa hết hạn
 * - Tạo token mới → invalidate máy cũ (single device lock)
 */
export async function revitLogin(
  email: string,
  password: string,
  machineId: string,
  addinVersion?: string
): Promise<RevitLoginResult> {
  // 1. Tìm user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    return { success: false, message: 'Email không tồn tại trong hệ thống.' };
  }

  // 2. Kiểm tra password
  if (!user.password) {
    return {
      success: false,
      message: 'Tài khoản chưa có mật khẩu. Đăng nhập trên web để tạo mật khẩu.',
    };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return { success: false, message: 'Sai mật khẩu. Vui lòng thử lại.' };
  }

  // 3. Kiểm tra trạng thái tài khoản
  if (user.status !== 'ACTIVE') {
    return {
      success: false,
      message: `Tài khoản đang ở trạng thái "${user.status}". Liên hệ admin.`,
    };
  }

  // 4. Kiểm tra Revit License
  if (!user.revitLicenseActive) {
    return {
      success: false,
      message: 'Tài khoản chưa được cấp quyền sử dụng Revit Add-in. Liên hệ Admin.',
    };
  }

  // 5. Kiểm tra license expiry
  if (user.revitLicenseExpiry && user.revitLicenseExpiry < new Date()) {
    return {
      success: false,
      message: 'License Revit Add-in đã hết hạn. Liên hệ Admin để gia hạn.',
    };
  }

  // 6. Tạo token mới → tự động invalidate token cũ (đá máy cũ)
  const newToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  // 7. Cập nhật DB — ghi token mới + machine ID mới
  await prisma.user.update({
    where: { id: user.id },
    data: {
      revitActiveToken: newToken,
      revitMachineId: machineId,
      revitLastLogin: new Date(),
    },
  });

  console.log(
    `[Revit Auth] Login: ${email} on ${machineId} (v${addinVersion || 'unknown'})`
  );

  return {
    success: true,
    token: newToken,
    user: {
      email: user.email,
      name: user.name || email.split('@')[0],
      role: user.role,
      company: user.department || null,
    },
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Xác minh token từ Revit Add-in.
 * Kiểm tra token có khớp với token đang active trong DB không.
 * Nếu không khớp → đã bị đá bởi login từ máy khác.
 */
export async function revitVerify(token: string): Promise<RevitVerifyResult> {
  if (!token) {
    return { valid: false, message: 'Token không hợp lệ.' };
  }

  // Tìm user có token này
  const user = await prisma.user.findFirst({
    where: { revitActiveToken: token },
  });

  if (!user) {
    return {
      valid: false,
      message: 'Phiên đăng nhập đã hết hạn hoặc tài khoản đã được đăng nhập từ máy khác. Vui lòng đăng nhập lại.',
    };
  }

  // Kiểm tra tài khoản vẫn active
  if (user.status !== 'ACTIVE') {
    return {
      valid: false,
      message: `Tài khoản đã bị ${user.status === 'SUSPENDED' ? 'đình chỉ' : 'vô hiệu hóa'}. Liên hệ Admin.`,
    };
  }

  // Kiểm tra license vẫn active
  if (!user.revitLicenseActive) {
    return {
      valid: false,
      message: 'Quyền sử dụng Revit Add-in đã bị thu hồi. Liên hệ Admin.',
    };
  }

  // Kiểm tra license expiry
  if (user.revitLicenseExpiry && user.revitLicenseExpiry < new Date()) {
    return {
      valid: false,
      message: 'License Revit Add-in đã hết hạn. Liên hệ Admin để gia hạn.',
    };
  }

  return {
    valid: true,
    user: {
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: user.role,
      company: user.department || null,
    },
  };
}
