import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendLicenseWelcomeEmail, generateResetToken } from '@/lib/email';

// ============================================================
// GET /api/revit-users — Danh sách RevitUser + User có revit license
// ============================================================
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const currentUser = session?.user as any;
        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 403 });
        }

        // 1. Lấy tất cả RevitUser
        const revitUsers = await prisma.revitUser.findMany({
            select: {
                id: true, email: true, name: true, status: true,
                organization: true,
                licensePlan: true, licenseActive: true,
                licenseStart: true, licenseExpiry: true,
                machineId: true, lastLogin: true,
                mcpLicenseActive: true, mcpLicensePlan: true,
                mcpLicenseStart: true, mcpLicenseExpiry: true,
                trialUsed: true, registrationProvider: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
        });

        // 2. Lấy User (nhân sự) có Revit license
        const staffWithLicense = await prisma.user.findMany({
            where: { OR: [{ revitLicenseActive: true }, { mcpLicenseActive: true }] },
            select: {
                id: true, email: true, name: true, role: true,
                status: true, department: true,
                revitLicenseActive: true, revitLicensePlan: true,
                revitLicenseStart: true, revitLicenseExpiry: true,
                revitMachineId: true, revitLastLogin: true,
                mcpLicenseActive: true, mcpLicensePlan: true,
                mcpLicenseStart: true, mcpLicenseExpiry: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Map ra format thống nhất
        const mappedRevitUsers = revitUsers.map((u) => ({
            id: u.id, email: u.email, name: u.name, status: u.status,
            source: 'revit' as const,
            organization: u.organization ?? null,
            licensePlan: u.licensePlan,
            licenseActive: u.licenseActive,
            licenseStart: u.licenseStart?.toISOString() ?? null,
            licenseExpiry: u.licenseExpiry?.toISOString() ?? null,
            machineId: u.machineId,
            lastLogin: u.lastLogin?.toISOString() ?? null,
            mcpLicenseActive: u.mcpLicenseActive,
            mcpLicensePlan: u.mcpLicensePlan,
            mcpLicenseStart: u.mcpLicenseStart?.toISOString() ?? null,
            mcpLicenseExpiry: u.mcpLicenseExpiry?.toISOString() ?? null,
            trialUsed: u.trialUsed,
            registrationProvider: u.registrationProvider ?? null,
            createdAt: u.createdAt.toISOString(),
        }));

        const mappedStaff = staffWithLicense.map((u) => ({
            id: u.id, email: u.email, name: u.name, status: u.status,
            source: 'staff' as const,
            role: u.role, department: u.department,
            organization: u.department ?? null,
            licensePlan: u.revitLicensePlan,
            licenseActive: u.revitLicenseActive,
            licenseStart: u.revitLicenseStart?.toISOString() ?? null,
            licenseExpiry: u.revitLicenseExpiry?.toISOString() ?? null,
            machineId: u.revitMachineId,
            lastLogin: u.revitLastLogin?.toISOString() ?? null,
            mcpLicenseActive: u.mcpLicenseActive,
            mcpLicensePlan: u.mcpLicensePlan,
            mcpLicenseStart: u.mcpLicenseStart?.toISOString() ?? null,
            mcpLicenseExpiry: u.mcpLicenseExpiry?.toISOString() ?? null,
            trialUsed: false,
            registrationProvider: null,
            createdAt: u.createdAt.toISOString(),
        }));

        return NextResponse.json({
            success: true,
            data: { revitUsers: mappedRevitUsers, staffWithLicense: mappedStaff },
        });
    } catch (error: any) {
        console.error('[GET /api/revit-users] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// ============================================================
// POST /api/revit-users — Tạo RevitUser mới + cấp license
// ============================================================
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const currentUser = session?.user as any;
        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 403 });
        }

        const body = await request.json();
        const { email, name, password, plan, organization } = body;

        if (!email || !name) {
            return NextResponse.json({ success: false, error: 'Thiếu email hoặc tên' }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingRevit = await prisma.revitUser.findUnique({ where: { email: normalizedEmail } });
        if (existingRevit) {
            return NextResponse.json({ success: false, error: 'Email đã tồn tại trong danh sách Revit License' }, { status: 400 });
        }
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            return NextResponse.json({
                success: false,
                error: 'Email này đã là nhân sự trong hệ thống. Hãy cấp Revit license từ trang Quản lý User.',
            }, { status: 400 });
        }

        const resetToken = generateResetToken();
        const resetExpiry = new Date();
        resetExpiry.setHours(resetExpiry.getHours() + 24);

        const startDate = new Date();
        let expiryDate: Date | null = null;
        let userStatus = 'ACTIVE';
        let isTrialPlan = plan === 'TRIAL_30D';

        if (isTrialPlan) {
            // Dùng thử 30 ngày
            userStatus = 'TRIAL';
            expiryDate = new Date(startDate);
            expiryDate.setDate(expiryDate.getDate() + 30);
        } else {
            const PLAN_MONTHS: Record<string, number | null> = {
                '1M': 1, '3M': 3, '6M': 6, '1Y': 12, 'LIFETIME': null,
            };
            const months = PLAN_MONTHS[plan];
            if (months !== null && months !== undefined) {
                expiryDate = new Date(startDate);
                expiryDate.setMonth(expiryDate.getMonth() + months);
            }
        }

        const tempPassword = password || `Zfenix_${Math.random().toString(36).slice(2, 10)}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        const user = await prisma.revitUser.create({
            data: {
                email: normalizedEmail, name: name.trim(),
                password: hashedPassword,
                status: userStatus,
                organization: organization?.trim() || null,
                licensePlan: plan || '1M', licenseActive: true,
                licenseStart: startDate, licenseExpiry: expiryDate,
                trialUsed: isTrialPlan,
                registrationProvider: isTrialPlan ? 'manual-trial' : 'manual',
                resetPasswordToken: resetToken, resetPasswordExpiry: resetExpiry,
            },
            select: { id: true, email: true, name: true, licensePlan: true, status: true },
        });

        const PLAN_LABELS: Record<string, string> = {
            '1M': '1 Month', '3M': '3 Months', '6M': '6 Months',
            '1Y': '1 Year', 'LIFETIME': 'Lifetime',
        };

        let emailResult: { success: boolean; error?: string } = { success: false, error: 'Not sent' };
        try {
            emailResult = await sendLicenseWelcomeEmail({
                toEmail: user.email, userName: user.name || '',
                planLabel: PLAN_LABELS[plan] || plan, resetToken,
            });
        } catch (emailError: any) {
            emailResult = { success: false, error: emailError.message };
        }

        return NextResponse.json({
            success: true, data: user,
            emailSent: emailResult.success,
            emailError: emailResult.success ? undefined : emailResult.error,
        });
    } catch (error: any) {
        console.error('[POST /api/revit-users] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// ============================================================
// PATCH /api/revit-users — Cập nhật RevitUser
// ============================================================
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const currentUser = session?.user as any;
        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 403 });
        }

        const body = await request.json();
        const {
            userId, licenseActive, licensePlan, licenseStart, licenseExpiry,
            machineId, activeToken, status, organization,
            mcpLicenseActive, mcpLicensePlan, mcpLicenseStart, mcpLicenseExpiry
        } = body;

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Thiếu userId' }, { status: 400 });
        }

        const updateData: any = {};
        if (licenseActive !== undefined) updateData.licenseActive = Boolean(licenseActive);
        if (licensePlan !== undefined) updateData.licensePlan = licensePlan || null;
        if (licenseStart !== undefined) updateData.licenseStart = licenseStart ? new Date(licenseStart) : null;
        if (licenseExpiry !== undefined) updateData.licenseExpiry = licenseExpiry ? new Date(licenseExpiry) : null;
        if (machineId !== undefined) updateData.machineId = machineId;
        if (activeToken !== undefined) updateData.activeToken = activeToken;
        if (status !== undefined) {
            updateData.status = status;
            // Khi upgrade từ TRIAL → ACTIVE, cập nhật flag
            if (status === 'ACTIVE' && licensePlan && licensePlan !== 'TRIAL_30D') {
                updateData.trialUsed = true; // giữ nguyên flag đã dùng trial
            }
        }
        if (organization !== undefined) updateData.organization = organization || null;
        if (mcpLicenseActive !== undefined) updateData.mcpLicenseActive = Boolean(mcpLicenseActive);
        if (mcpLicensePlan !== undefined) updateData.mcpLicensePlan = mcpLicensePlan || null;
        if (mcpLicenseStart !== undefined) updateData.mcpLicenseStart = mcpLicenseStart ? new Date(mcpLicenseStart) : null;
        if (mcpLicenseExpiry !== undefined) updateData.mcpLicenseExpiry = mcpLicenseExpiry ? new Date(mcpLicenseExpiry) : null;

        const updated = await prisma.revitUser.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true, email: true, name: true, status: true,
                licenseActive: true, licensePlan: true,
                licenseStart: true, licenseExpiry: true, machineId: true,
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        console.error('[PATCH /api/revit-users] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// ============================================================
// DELETE /api/revit-users — Xóa RevitUser
// ============================================================
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const currentUser = session?.user as any;
        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Thiếu userId' }, { status: 400 });
        }

        const target = await prisma.revitUser.findUnique({
            where: { id: userId },
            select: { id: true, email: true }
        });

        if (!target) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy người dùng' }, { status: 404 });
        }

        await prisma.revitLicenseKey.updateMany({
            where: { usedBy: target.email },
            data: { usedBy: null }
        });

        await prisma.revitUser.delete({ where: { id: userId } });

        return NextResponse.json({ success: true, message: `Đã xóa thành công ${target.email}` });
    } catch (error: any) {
        console.error('[DELETE /api/revit-users] Error:', error);
        let readableError = 'Lỗi hệ thống khi xóa người dùng';
        if (error.code === 'P2003') readableError = 'Không thể xóa vì user đang có dữ liệu liên quan.';
        else if (error.code === 'P2025') readableError = 'Người dùng không tồn tại hoặc đã bị xóa.';
        return NextResponse.json({ success: false, error: readableError }, { status: 500 });
    }
}
