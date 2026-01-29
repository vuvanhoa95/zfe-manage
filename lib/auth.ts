import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Vui lòng nhập đầy đủ email và mật khẩu');
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email },
                    });

                    if (!user || !user.password) {
                        throw new Error('Không tìm thấy người dùng với email này');
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.password);

                    if (!isValid) {
                        throw new Error('Mật khẩu không chính xác');
                    }

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    };
                } catch (error: any) {
                    // Log error for debugging (only in development)
                    if (process.env.NODE_ENV === 'development') {
                        console.error('Auth error:', error);
                    }
                    
                    // Check if it's a database connection error
                    if (error?.code === 'P1001' || error?.message?.includes('connect')) {
                        throw new Error('Không thể kết nối đến database. Vui lòng kiểm tra cấu hình DATABASE_URL.');
                    }
                    
                    // Re-throw original error
                    throw error;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
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
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};
