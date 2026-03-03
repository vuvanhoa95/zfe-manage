import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureCoreSchema, isMissingTableError } from '@/lib/db-schema';
const UserStatus = { ACTIVE: 'ACTIVE', PENDING: 'PENDING', SUSPENDED: 'SUSPENDED' } as const;
import { sendUserInvitationEmail } from '@/lib/email/send';

/**
 * API endpoint để cập nhật hoặc tạo user mới
 * POST /api/admin/update-user
 * Body: { email, password, name?, role? }
 */
export async function POST(request: NextRequest) {
    try {
        // Đảm bảo schema tồn tại trước khi thao tác với database
        try {
            await ensureCoreSchema();
        } catch (schemaError: any) {
            // Log nhưng không throw - có thể schema đã tồn tại một phần
            if (process.env.NODE_ENV === 'development') {
                console.warn('[API] ensureCoreSchema warning (may be safe to ignore):', schemaError?.message);
            }
        }

        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { email, password, name, role, title, department, experience, bankAccount, taxCode } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email và password là bắt buộc' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user exists
        let existingUser;
        try {
            existingUser = await prisma.user.findUnique({
                where: { email },
            });
        } catch (error: any) {
            if (isMissingTableError(error)) {
                await ensureCoreSchema();
                existingUser = null;
            } else {
                throw error;
            }
        }

        let user;
        try {
            // Sử dụng transaction để đảm bảo atomicity và không mất dữ liệu
            user = await prisma.$transaction(async (tx) => {
                let result;
                
                if (existingUser) {
                    // Update existing user - chỉ update các field được cung cấp, giữ nguyên các field khác
                    result = await tx.user.update({
                        where: { email },
                        data: {
                            name: name || existingUser.name,
                            password: hashedPassword,
                            role: role || existingUser.role,
                            title: title !== undefined ? (title || null) : existingUser.title,
                            department: department !== undefined ? (department || null) : existingUser.department,
                            experience: experience !== undefined ? (experience || null) : existingUser.experience,
                            bankAccount: bankAccount !== undefined ? (bankAccount || null) : existingUser.bankAccount,
                            taxCode: taxCode !== undefined ? (taxCode || null) : existingUser.taxCode,
                            status: UserStatus.ACTIVE, // Manually updated users are ACTIVE
                        },
                    });
                } else {
                    // Create new user
                    result = await tx.user.create({
                        data: {
                            email,
                            name: name || 'User',
                            password: hashedPassword,
                            role: role || 'USER',
                            title: title || null,
                            department: department || null,
                            experience: experience || null,
                            bankAccount: bankAccount || null,
                            taxCode: taxCode || null,
                            status: UserStatus.ACTIVE, // Manually created users are ACTIVE
                        },
                    });
                }

                // Verify ngay trong transaction để đảm bảo data được commit
                const verify = await tx.user.findUnique({
                    where: { id: result.id },
                    select: { id: true, email: true, name: true, role: true },
                });
                
                if (!verify) {
                    throw new Error('User was created/updated but cannot be verified in database');
                }

                return result;
            });
        } catch (error: any) {
            if (isMissingTableError(error)) {
                await ensureCoreSchema();
                // Retry after ensuring schema - sử dụng transaction
                user = await prisma.$transaction(async (tx) => {
                    let result;
                    
                    if (existingUser) {
                        result = await tx.user.update({
                            where: { email },
                            data: {
                                name: name || existingUser.name,
                                password: hashedPassword,
                                role: role || existingUser.role,
                                title: title !== undefined ? (title || null) : existingUser.title,
                                department: department !== undefined ? (department || null) : existingUser.department,
                                experience: experience !== undefined ? (experience || null) : existingUser.experience,
                                bankAccount: bankAccount !== undefined ? (bankAccount || null) : existingUser.bankAccount,
                                taxCode: taxCode !== undefined ? (taxCode || null) : existingUser.taxCode,
                                status: UserStatus.ACTIVE,
                            },
                        });
                    } else {
                        result = await tx.user.create({
                            data: {
                                email,
                                name: name || 'User',
                                password: hashedPassword,
                                role: role || 'USER',
                                title: title || null,
                                department: department || null,
                                experience: experience || null,
                                bankAccount: bankAccount || null,
                                taxCode: taxCode || null,
                                status: UserStatus.ACTIVE,
                            },
                        });
                    }

                    // Verify trong transaction
                    const verify = await tx.user.findUnique({
                        where: { id: result.id },
                        select: { id: true, email: true, name: true, role: true },
                    });
                    
                    if (!verify) {
                        throw new Error('User was created/updated but cannot be verified in database');
                    }

                    return result;
                });
            } else {
                throw error;
            }
        }

        // Log success sau khi transaction commit thành công
        // Verification đã được thực hiện trong transaction
        if (process.env.NODE_ENV === 'development') {
            console.log('[API] User created/updated and verified successfully:', {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            });
        }

        // Send invitation email for NEW users
        if (!existingUser) {
            try {
                await sendUserInvitationEmail({
                    to: user.email,
                    userName: user.name || 'User',
                    adminName: session.user?.name || 'Admin',
                    role: user.role,
                });
            } catch (emailError) {
                console.error('[API] Failed to send invitation email:', emailError);
                // Don't fail the whole request if email fails
            }
        }

        return NextResponse.json({
            success: true,
            message: existingUser ? 'Đã cập nhật user thành công' : 'Đã tạo user mới thành công',
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                title: user.title,
                department: user.department,
                experience: user.experience,
                bankAccount: user.bankAccount,
                taxCode: user.taxCode,
            },
        });
    } catch (error: any) {
        console.error('Update user error:', error);
        
        // Log chi tiết trong development
        if (process.env.NODE_ENV === 'development') {
            console.error('[API] Update user error details:', {
                message: error?.message,
                code: error?.code,
                meta: error?.meta,
                stack: error?.stack,
            });
        }

        // Xử lý các loại lỗi cụ thể
        let errorMessage = error?.message || 'Không thể tạo/cập nhật user';
        let statusCode = 500;

        if (isMissingTableError(error)) {
            errorMessage = 'Cơ sở dữ liệu chưa được khởi tạo. Vui lòng thử lại sau.';
        } else if (error?.code === 'P2002') {
            // Unique constraint violation (email đã tồn tại)
            errorMessage = 'Email này đã được sử dụng. Vui lòng sử dụng email khác.';
            statusCode = 400;
        } else if (error?.code === 'P2003') {
            // Foreign key constraint violation
            errorMessage = 'Dữ liệu tham chiếu không hợp lệ.';
            statusCode = 400;
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? {
                    message: error?.message,
                    code: error?.code,
                    meta: error?.meta,
                } : undefined,
            },
            { status: statusCode }
        );
    }
}
