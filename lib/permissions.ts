import { type Quotation } from '@prisma/client';
import { type AuthenticatedUser } from '@/types/auth';

/**
 * Kiểm tra quyền chỉnh sửa báo giá cơ bản.
 * Hiện tại rule đơn giản:
 * - ADMIN: được sửa mọi báo giá
 * - USER: chỉ sửa được báo giá do mình tạo
 */
export function assertCanEditQuotation(user: AuthenticatedUser, quotation: Pick<Quotation, 'createdById'>) {
    if (user.role === 'ADMIN') return;
    if (quotation.createdById === user.id) return;

    throw new Error('Bạn không có quyền chỉnh sửa báo giá này');
}

