import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ONE-TIME USE: Resets the super admin user so Google OAuth can create it fresh
// Protected by a secret token to prevent abuse
// DELETE THIS FILE AFTER USE!

const SUPER_ADMIN_EMAIL = '7604vuhoa@gmail.com';
const RESET_SECRET = process.env.RESET_SECRET || '';

export async function POST(req: Request) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    if (!RESET_SECRET || secret !== RESET_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Delete accounts linked to this user first (cascade)
        const user = await prisma.user.findUnique({
            where: { email: SUPER_ADMIN_EMAIL },
            include: { accounts: true },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found - already clean' });
        }

        // Delete linked accounts
        await prisma.account.deleteMany({
            where: { userId: user.id },
        });

        // Delete sessions
        await prisma.session.deleteMany({
            where: { userId: user.id },
        });

        // Delete user
        await prisma.user.delete({
            where: { email: SUPER_ADMIN_EMAIL },
        });

        return NextResponse.json({
            success: true,
            message: `User ${SUPER_ADMIN_EMAIL} deleted. Please login with Google now - will be auto-created as ADMIN.`,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
