import { withAuth } from 'next-auth/middleware';

// Bảo vệ route bằng NextAuth ở cả dev và prod.
// Nếu chưa đăng nhập, tự động redirect về /login.
export const middleware = withAuth({
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export const config = {
    matcher: ["/((?!api/|login|_next/static|_next/image|favicon.ico).*)"],
};
