import { withAuth } from "next-auth/middleware";

export const middleware = withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: ["/((?!api/|login|_next/static|_next/image|favicon.ico).*)"],
};
