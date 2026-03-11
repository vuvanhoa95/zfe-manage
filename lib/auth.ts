import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/lib/api-security';
// Local const thay thế @prisma/client enum — tránh lỗi Turbopack resolution
const UserStatus = { ACTIVE: 'ACTIVE', PENDING: 'PENDING', SUSPENDED: 'SUSPENDED' } as const;
type UserStatusType = typeof UserStatus[keyof typeof UserStatus];

const isDevelopment = process.env.NODE_ENV === 'development';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            allowDangerousEmailAccountLinking: true,
        }),
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID || '',
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
            tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
            allowDangerousEmailAccountLinking: true,
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                // Debug logging
                if (process.env.NODE_ENV === 'development') {
                    console.log('Authorize called with:', {
                        hasEmail: !!credentials?.email,
                        hasPassword: !!credentials?.password,
                        emailLength: credentials?.email?.length || 0
                    });
                }

                const email = credentials?.email?.trim();
                const password = credentials?.password?.trim();

                if (!email || !password) {
                    throw new Error('Vui lòng nhập đầy đủ email và mật khẩu');
                }

                // 🛡️ Rate limit: 10 attempts per email per 15 minutes
                if (!checkRateLimit(`web-login:${email}`, 10, 15 * 60 * 1000)) {
                    throw new Error('Quá nhiều lần thử đăng nhập. Vui lòng chờ 15 phút.');
                }

                try {
                    // Check DATABASE_URL before attempting connection
                    if (!process.env.DATABASE_URL) {
                        throw new Error('DATABASE_URL_MISSING');
                    }

                    const user = await prisma.user.findUnique({
                        where: { email },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            status: true,
                            password: true,
                            mustChangePassword: true,
                        },
                    });

                    // ===== Nếu tìm thấy trong bảng users (project staff) =====
                    if (user) {
                        if (user.status !== UserStatus.ACTIVE) {
                            if (user.status === UserStatus.PENDING) {
                                throw new Error('ACCOUNT_PENDING');
                            }
                            throw new Error('ACCOUNT_SUSPENDED');
                        }

                        if (!user.password) {
                            throw new Error('Tài khoản này đã được đăng ký qua mạng xã hội. Vui lòng đăng nhập bằng Google hoặc Microsoft.');
                        }

                        const isValid = await bcrypt.compare(password, user.password);
                        if (!isValid) {
                            throw new Error('Mật khẩu không chính xác');
                        }

                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            status: user.status,
                            mustChangePassword: user.mustChangePassword,
                            userType: 'staff', // User dự án
                        };
                    }

                    // ===== Fallback: tìm trong bảng revit_users =====
                    const revitUser = await prisma.revitUser.findUnique({
                        where: { email },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            status: true,
                            password: true,
                            licensePlan: true,
                            licenseActive: true,
                            licenseStart: true,
                            licenseExpiry: true,
                            machineId: true,
                            lastLogin: true,
                        },
                    });

                    if (!revitUser) {
                        throw new Error('Không tìm thấy người dùng với email này');
                    }

                    if (revitUser.status !== 'ACTIVE') {
                        throw new Error('ACCOUNT_SUSPENDED');
                    }

                    if (!revitUser.password) {
                        throw new Error('Tài khoản chưa được thiết lập mật khẩu. Vui lòng liên hệ quản trị viên.');
                    }

                    const isRevitValid = await bcrypt.compare(password, revitUser.password);
                    if (!isRevitValid) {
                        throw new Error('Mật khẩu không chính xác');
                    }

                    return {
                        id: revitUser.id,
                        name: revitUser.name,
                        email: revitUser.email,
                        role: 'REVIT_USER',
                        status: revitUser.status,
                        mustChangePassword: false,
                        userType: 'revit', // User Revit License
                    };
                } catch (error: any) {
                    // Log error for debugging (only in development)
                    if (process.env.NODE_ENV === 'development') {
                        console.error('Auth error:', error);
                        console.error('Error code:', error?.code);
                        console.error('Error message:', error?.message);
                        if (error?.filePath) {
                            console.error('Database file path:', error.filePath);
                        }
                        // Prisma errors có thể có meta field
                        if (error?.meta) {
                            console.error('Prisma error meta:', error.meta);
                        }
                    }

                    // Extract error code và message
                    // Prisma errors có code trong error.code
                    // Custom errors có thể có code trong error.code hoặc message
                    const errorMessage = error?.message || '';
                    let errorCode = error?.code || '';

                    // Check for Prisma error codes (P1001, P1002, etc.)
                    if (!errorCode && errorMessage) {
                        // Try to extract Prisma error code from message
                        const prismaCodeMatch = errorMessage.match(/P\d{4}/);
                        if (prismaCodeMatch) {
                            errorCode = prismaCodeMatch[0];
                        }
                    }

                    // Check if it's a database connection error
                    const isDatabaseError =
                        errorCode === 'DATABASE_URL_MISSING' ||
                        errorCode === 'DATABASE_FILE_NOT_FOUND' ||
                        errorCode === 'P1001' || // Can't reach database server
                        errorCode === 'P1002' || // Database server timed out
                        errorCode === 'P1003' || // Database does not exist
                        errorCode === 'P1017' || // Server has closed the connection
                        errorCode === 'P1012' || // Schema mismatch
                        errorCode === 'P2002' || // Unique constraint (might indicate DB is working but data issue)
                        errorMessage.includes('DATABASE_URL_MISSING') ||
                        errorMessage.includes('DATABASE_FILE_NOT_FOUND') ||
                        errorMessage.includes('Database file not found') ||
                        errorMessage.includes('Unable to create database connection') ||
                        errorMessage.includes('Can\'t reach database server') ||
                        errorMessage.includes('connect') ||
                        errorMessage.includes('connection') ||
                        errorMessage.includes('DATABASE_URL') ||
                        errorMessage.includes('ECONNREFUSED') ||
                        errorMessage.includes('ENOTFOUND') ||
                        errorMessage.includes('timeout') ||
                        errorMessage.includes('schema');

                    if (isDatabaseError) {
                        // Encode error code vào message để login page có thể parse
                        // Format: "database|ERROR_CODE|ERROR_MESSAGE"
                        const encodedError = errorCode
                            ? `database|${errorCode}|${errorMessage || 'Database connection error'}`
                            : `database|UNKNOWN|${errorMessage || 'Database connection error'}`;
                        throw new Error(encodedError);
                    }

                    // Check if it's a credentials error (user not found or wrong password)
                    if (errorMessage.includes('Không tìm thấy') || errorMessage.includes('Mật khẩu')) {
                        throw error; // Re-throw original error
                    }

                    // For other errors, throw generic error
                    throw new Error('Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại sau.');
                }
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log(`[NextAuth signIn] provider=${account?.provider}, email=${user?.email}, userId=${user?.id}`);

            // Super Admin: Always ADMIN + ACTIVE — không thể xóa, luôn active
            const SUPER_ADMIN_EMAILS = [
                '7604vuhoa@gmail.com',   // Google Admin
                'hoavv@zfenix.com',      // Microsoft Admin
            ];

            // Only handle OAuth providers (Google, Microsoft)
            if (account?.provider !== 'credentials') {
                const userEmail = user?.email?.toLowerCase();
                if (!userEmail) {
                    console.error('[NextAuth signIn] No email from OAuth provider');
                    return false;
                }

                // Email thực từ Google/Microsoft profile — source of truth
                const realEmail = (profile?.email ?? userEmail).toLowerCase();
                const realName = (profile as any)?.name ?? (profile as any)?.displayName ?? user.name;

                // Tìm user theo EMAIL trước — đây là cách duy nhất đảm bảo không conflict.
                // PrismaAdapter có thể tạo user mới với ID khác nếu lần đầu login OAuth,
                // nhưng email là unique identifier mà ta biết chắc từ provider.
                let dbUser = await prisma.user.findUnique({
                    where: { email: realEmail },
                    select: { id: true, status: true, role: true, email: true, name: true }
                });

                // Fallback: tìm theo userEmail nếu realEmail khác
                if (!dbUser && realEmail !== userEmail) {
                    dbUser = await prisma.user.findUnique({
                        where: { email: userEmail },
                        select: { id: true, status: true, role: true, email: true, name: true }
                    });
                }

                if (!dbUser) {
                    // User chưa có trong hệ thống
                    // Super admin: cho phép login, NextAuth sẽ tạo user mới
                    if (SUPER_ADMIN_EMAILS.includes(realEmail)) {
                        // Sau khi PrismaAdapter tạo xong, user sẽ được tìm lại trong jwt callback
                        return true;
                    }
                    // User thường: chưa được phê duyệt
                    return '/login?error=ACCOUNT_PENDING';
                }

                // Đảm bảo user.id trong token trỏ đến đúng user trong DB
                // (tránh trường hợp PrismaAdapter tạo user mới với ID khác)
                user.id = dbUser.id;

                // Cập nhật name nếu có thay đổi từ Google/Microsoft profile
                // KHÔNG bao giờ cập nhật email (đã tìm theo email → không cần update)
                const needsUpdate =
                    (realName && dbUser.name !== realName) ||
                    (SUPER_ADMIN_EMAILS.includes(realEmail) &&
                        (dbUser.role !== 'ADMIN' || dbUser.status !== UserStatus.ACTIVE));

                if (needsUpdate) {
                    const updateData: Record<string, any> = {};
                    if (realName && dbUser.name !== realName) updateData.name = realName;
                    if (SUPER_ADMIN_EMAILS.includes(realEmail)) {
                        updateData.role = 'ADMIN';
                        updateData.status = UserStatus.ACTIVE;
                    }
                    if (Object.keys(updateData).length > 0) {
                        await prisma.user.update({
                            where: { id: dbUser.id },
                            data: updateData,
                        });
                        Object.assign(dbUser, updateData);
                    }
                }

                // Kiểm tra status
                if (dbUser.status !== UserStatus.ACTIVE) {
                    if (dbUser.status === UserStatus.PENDING) {
                        return '/login?error=ACCOUNT_PENDING';
                    }
                    return '/login?error=ACCOUNT_SUSPENDED';
                }

                return true;
            }

            return true;
        },

        async jwt({ token, user, account, profile }) {

            if (user) {
                // First sign-in: lưu id, role, status, userType
                token.id = user.id;
                token.role = (user as any).role;
                token.status = (user as any).status;
                token.mustChangePassword = (user as any).mustChangePassword ?? false;
                // OAuth users từ PrismaAdapter không có userType → mặc định 'staff'
                token.userType = (user as any).userType ?? 'staff';
            }

            // Luôn lấy email/name từ nguồn ĐÚNG:
            // - OAuth: profile chứa thông tin thực từ Google/Microsoft
            // - Credentials: user.email là email đăng nhập
            if (profile?.email) {
                // OAuth login: dùng email + name từ Google/Microsoft profile
                token.email = profile.email;
                token.name = (profile as any).name ?? (profile as any).displayName ?? token.name;
            } else if (account?.provider === 'credentials' && user?.email) {
                // Credentials login: dùng email đăng nhập
                token.email = user.email;
                token.name = user.name ?? token.name;
            }

            // Refresh role/status từ DB mỗi lần sign-in (tránh stale token)
            // QUAN TRỌNG: OAuth users (Google/Microsoft) không có role/status từ PrismaAdapter
            // → BẮT BUỘC phải refresh từ DB để lấy đầy đủ thông tin
            if (user && token.id) {
                try {
                    if (token.userType === 'revit') {
                        // RevitUser — refresh từ revit_users table
                        const dbRevitUser = await prisma.revitUser.findUnique({
                            where: { id: token.id as string },
                            select: { status: true }
                        });
                        if (dbRevitUser) {
                            token.status = dbRevitUser.status;
                        }
                    } else {
                        // Staff user — refresh từ users table
                        // Với OAuth login, đây là lúc DUY NHẤT lấy được role/status từ DB
                        const dbUser = await prisma.user.findUnique({
                            where: { id: token.id as string },
                            select: { role: true, status: true, mustChangePassword: true }
                        });
                        if (dbUser) {
                            token.role = dbUser.role;
                            token.status = dbUser.status;
                            token.mustChangePassword = dbUser.mustChangePassword;
                        } else if (account?.provider !== 'credentials') {
                            // OAuth user vừa được tạo bởi PrismaAdapter nhưng chưa có trong DB
                            // Thử tìm theo email
                            const emailToSearch = (token.email as string)?.toLowerCase();
                            if (emailToSearch) {
                                const dbUserByEmail = await prisma.user.findUnique({
                                    where: { email: emailToSearch },
                                    select: { id: true, role: true, status: true, mustChangePassword: true }
                                });
                                if (dbUserByEmail) {
                                    token.id = dbUserByEmail.id;
                                    token.role = dbUserByEmail.role;
                                    token.status = dbUserByEmail.status;
                                    token.mustChangePassword = dbUserByEmail.mustChangePassword;
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error('[NextAuth jwt] DB refresh failed:', err);
                    // Ignore DB errors - dùng giá trị đã có trong token
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).status = token.status;
                (session.user as any).mustChangePassword = token.mustChangePassword ?? false;
                (session.user as any).userType = token.userType ?? 'staff';
                // Luôn dùng email/name từ token (đã được set đúng từ profile OAuth hoặc credentials)
                if (token.email) session.user.email = token.email as string;
                if (token.name) session.user.name = token.name as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    events: {
        async signIn({ user, account }) {
            console.log(`[NextAuth Event] signIn success: ${user?.email} via ${account?.provider}`);
        },
        async linkAccount({ user, account }) {
            console.log(`[NextAuth Event] linkAccount: ${user?.email} with ${account?.provider}`);
        },
        async createUser({ user }) {
            console.log(`[NextAuth Event] createUser: ${user?.email}`);
        },
    },
    logger: {
        error(code, metadata) {
            console.error(`[NextAuth Error] code=${code}`, JSON.stringify(metadata, null, 2));
        },
        warn(code) {
            console.warn(`[NextAuth Warn] ${code}`);
        },
        debug(code, metadata) {
            if (isDevelopment) {
                console.log(`[NextAuth Debug] ${code}`, JSON.stringify(metadata));
            }
        },
    },
    // Chỉ set secret nếu có trong môi trường.
    // Trong development nếu thiếu, NextAuth sẽ tự generate secret tạm thời.
    ...(process.env.NEXTAUTH_SECRET ? { secret: process.env.NEXTAUTH_SECRET } : {}),
    debug: isDevelopment,
};

