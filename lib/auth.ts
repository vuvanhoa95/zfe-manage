import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserStatus } from '@prisma/client';

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
                    console.error('Missing credentials:', { 
                        email: !!credentials?.email, 
                        password: !!credentials?.password 
                    });
                    throw new Error('Vui lòng nhập đầy đủ email và mật khẩu');
                }

                try {
                    // Check DATABASE_URL before attempting connection
                    if (!process.env.DATABASE_URL) {
                        throw new Error('DATABASE_URL_MISSING');
                    }

                    const user = await prisma.user.findUnique({
                        where: { email },
                    });

                    if (!user) {
                        throw new Error('Không tìm thấy người dùng với email này');
                    }

                    // Check user status
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
            // Super Admin: Always ADMIN + ACTIVE
            const SUPER_ADMIN_EMAILS = ['7604vuhoa@gmail.com'];

            // OAuth auto-creation logic: PrismaAdapter already handles creation.
            // We just need to check the status of the user after they are looked up or created.
            if (account?.provider !== 'credentials' && user?.id) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { status: true, role: true, email: true }
                });

                // Auto-promote super admin
                if (dbUser && SUPER_ADMIN_EMAILS.includes(dbUser.email || '')) {
                    if (dbUser.role !== 'ADMIN' || dbUser.status !== UserStatus.ACTIVE) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { role: 'ADMIN', status: UserStatus.ACTIVE }
                        });
                    }
                    return true; // Always allow super admin
                }

                if (dbUser && dbUser.status !== UserStatus.ACTIVE) {
                    if (dbUser.status === UserStatus.PENDING) {
                        return '/login?error=ACCOUNT_PENDING';
                    }
                    return '/login?error=ACCOUNT_SUSPENDED';
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.status = (user as any).status;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).status = token.status;
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
    // Chỉ set secret nếu có trong môi trường.
    // Trong development nếu thiếu, NextAuth sẽ tự generate secret tạm thời.
    ...(process.env.NEXTAUTH_SECRET ? { secret: process.env.NEXTAUTH_SECRET } : {}),
    debug: isDevelopment,
};
