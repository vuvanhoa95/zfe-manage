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
                // Debug logging
                if (process.env.NODE_ENV === 'development') {
                    console.log('Authorize called with:', { 
                        hasEmail: !!credentials?.email, 
                        hasPassword: !!credentials?.password,
                        emailLength: credentials?.email?.length || 0
                    });
                }
                
                if (!credentials?.email || !credentials?.password) {
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
                        console.error('Error code:', error?.code);
                        console.error('Error message:', error?.message);
                        if (error?.filePath) {
                            console.error('Database file path:', error.filePath);
                        }
                    }
                    
                    // Check if it's a database connection error
                    const errorMessage = error?.message || '';
                    const errorCode = error?.code || '';
                    
                    // Prisma error codes for connection issues
                    if (
                        errorCode === 'DATABASE_URL_MISSING' ||
                        errorCode === 'DATABASE_FILE_NOT_FOUND' ||
                        errorCode === 'P1001' || // Can't reach database server
                        errorCode === 'P1002' || // Database server timed out
                        errorCode === 'P1003' || // Database does not exist
                        errorCode === 'P1017' || // Server has closed the connection
                        errorCode === 'P1012' || // Schema mismatch
                        errorMessage.includes('DATABASE_URL_MISSING') ||
                        errorMessage.includes('DATABASE_FILE_NOT_FOUND') ||
                        errorMessage.includes('Database file not found') ||
                        errorMessage.includes('connect') ||
                        errorMessage.includes('connection') ||
                        errorMessage.includes('DATABASE_URL') ||
                        errorMessage.includes('ECONNREFUSED') ||
                        errorMessage.includes('ENOTFOUND') ||
                        errorMessage.includes('timeout') ||
                        errorMessage.includes('schema')
                    ) {
                        throw new Error('database');
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
